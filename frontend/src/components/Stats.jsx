import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { apiGetAllPages, apiRequest } from "../lib/api";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

export default function Stats() {
  const { id } = useParams();
  const [bugs, setBugs] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest(`/projects/${encodeURIComponent(id)}/members`, { signal: controller.signal }),
      apiGetAllPages(`/projects/${encodeURIComponent(id)}/bugs`, { signal: controller.signal }),
    ]).then(([memberRows, bugRows]) => {
      setMembers(Array.isArray(memberRows) ? memberRows : []);
      setBugs(Array.isArray(bugRows) ? bugRows : []);
    }).catch((requestError) => {
      if (requestError.name !== "AbortError") setError(requestError.message || "Could not load project statistics.");
    });
    return () => controller.abort();
  }, [id]);

  const statusData = useMemo(() => {
    const counts = { "TO DO": 0, "IN PROGRESS": 0, DONE: 0 };
    bugs.forEach((bug) => { if (counts[bug.status] !== undefined) counts[bug.status] += 1; });
    return { labels: Object.keys(counts), datasets: [{ label: "Bugs by status", data: Object.values(counts), backgroundColor: ["#9ca3af", "#3b82f6", "#22c55e"] }] };
  }, [bugs]);

  const priorityData = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    bugs.forEach((bug) => { if (counts[bug.priority] !== undefined) counts[bug.priority] += 1; });
    return { labels: Object.keys(counts), datasets: [{ label: "Bugs by priority", data: Object.values(counts), backgroundColor: ["#3b82f6", "#eab308", "#ef4444"] }] };
  }, [bugs]);

  const assignmentData = useMemo(() => {
    const counts = new Map(members.map((member) => [Number(member.id), 0]));
    bugs.forEach((bug) => { const key = Number(bug.asignee); if (counts.has(key)) counts.set(key, counts.get(key) + 1); });
    return { labels: members.map((member) => `${member.firstname} ${member.lastname}`), datasets: [{ label: "Assigned bugs", data: members.map((member) => counts.get(Number(member.id)) || 0), backgroundColor: "#60a5fa" }] };
  }, [bugs, members]);

  const timelineData = useMemo(() => {
    const counts = new Map();
    bugs.forEach((bug) => {
      // The current bug-list API returns due dates, but not created timestamps.
      const date = bug.duedate ? String(bug.duedate).slice(0, 10) : null;
      if (date) counts.set(date, (counts.get(date) || 0) + 1);
    });
    const dates = [...counts.keys()].sort();
    return { labels: dates, datasets: [{ label: "Bugs due", data: dates.map((date) => counts.get(date)), fill: true, borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.15)", tension: 0.3 }] };
  }, [bugs]);

  const resolved = bugs.filter((bug) => bug.status === "DONE").length;
  const resolutionData = { labels: ["Open or in progress", "Done"], datasets: [{ label: "Bug count", data: [bugs.length - resolved, resolved], backgroundColor: ["#fb7185", "#34d399"] }] };

  return <main>
    <h1 className="text-4xl font-black mb-6">Statistics</h1>
    {error && <p role="alert" className="mb-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      <p className="mb-4 text-sm text-gray-600">Based on up to 5,000 bugs returned by the API.</p>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <section className="bg-white p-5 rounded-xl"><h2 className="text-xl font-bold mb-3">Bugs by status</h2><Doughnut data={statusData} /></section>
      <section className="bg-white p-5 rounded-xl"><h2 className="text-xl font-bold mb-3">Bugs by priority</h2><Doughnut data={priorityData} /></section>
      <section className="bg-white p-5 rounded-xl"><h2 className="text-xl font-bold mb-3">Bugs reported vs. resolved</h2><Bar data={resolutionData} /></section>
      <section className="bg-white p-5 rounded-xl"><h2 className="text-xl font-bold mb-3">Assignments by member</h2><Bar data={assignmentData} /></section>
      <section className="bg-white p-5 rounded-xl xl:col-span-2"><h2 className="text-xl font-bold mb-3">Bugs by due date</h2><Line data={timelineData} /></section>
    </div>
  </main>;
}
