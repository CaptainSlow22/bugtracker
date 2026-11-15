import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BugCard from "./BugCard";
import { apiRequest } from "../lib/api";
import { useAuth } from "./AuthContext";

export default function Dashboard() {
  const { id } = useParams();
  const { memberId } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setError("");
        const query = new URLSearchParams({ filter, page: "1", limit: "100" });
        const [memberRows, bugData, projectData] = await Promise.all([
          apiRequest(`/projects/${encodeURIComponent(id)}/members`, { signal: controller.signal }),
          apiRequest(`/projects/${encodeURIComponent(id)}/bugs?${query}`, { signal: controller.signal }),
          apiRequest("/projects?page=1&limit=100", { signal: controller.signal }),
        ]);
        setMembers(Array.isArray(memberRows) ? memberRows : []);
        setBugs(Array.isArray(bugData?.bugs) ? bugData.bugs : []);
        const project = projectData?.projects?.find((item) => String(item.id) === String(id));
        setIsOwner(project?.role === "owner");
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message || "Could not load the project dashboard.");
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [id, filter]);

  const deleteMember = async (member) => {
    if (Number(member.id) === Number(memberId)) return setError("You cannot remove your own account from this project.");
    if (!window.confirm(`Remove ${member.firstname} ${member.lastname} from this project?`)) return;
    try {
      await apiRequest(`/projects/${encodeURIComponent(id)}/deleteMember/${encodeURIComponent(member.id)}`, { method: "DELETE" });
      setMembers((current) => current.filter((item) => item.id !== member.id));
    } catch (requestError) {
      setError(requestError.message || "Could not remove member.");
    }
  };

  const todoBugs = bugs.filter((bug) => bug.status === "TO DO");
  const inProgressBugs = bugs.filter((bug) => bug.status === "IN PROGRESS");
  const doneBugs = bugs.filter((bug) => bug.status === "DONE");
  const columns = [["TO DO", todoBugs], ["IN PROGRESS", inProgressBugs], ["DONE", doneBugs]];

  return (
    <main>
      <h1 className="text-4xl font-black mb-6">Dashboard</h1>
      {isOwner && <Link to={`/projects/${encodeURIComponent(id)}/addMember`} className="inline-block px-3 py-2 bg-green-600 rounded-full font-bold text-white">+ Add Member to Project</Link>}
      {error && <p role="alert" className="my-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      <section className="mt-4">
        <h2 className="text-2xl font-bold mb-2">Project Members</h2>
        <div className="flex gap-3 overflow-x-auto p-2">
          {members.length ? members.map((member) => (
            <div key={member.id} className="flex shrink-0 items-center gap-2 bg-white rounded-full shadow px-3 py-2">
              <span className="font-black">{member.firstname?.[0] || "?"}{member.lastname?.[0] || "?"}</span>
              <span>{member.firstname} {member.lastname}</span>
              {isOwner && Number(member.id) !== Number(memberId) && <button onClick={() => deleteMember(member)} aria-label={`Remove ${member.firstname} ${member.lastname}`} className="text-red-700 underline">Remove</button>}
            </div>
          )) : <p>No members in this project.</p>}
        </div>
      </section>
      <label className="flex items-center gap-3 mt-4">Search bugs
        <input onChange={(event) => setFilter(event.target.value)} value={filter} maxLength={100} className="p-2 shadow bg-white w-full max-w-xs rounded-xl" placeholder="Title or description" />
      </label>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {columns.map(([heading, rows]) => <div key={heading} className="p-5 bg-white rounded-2xl shadow-md min-w-0">
          <h2 className="text-xl text-gray-600 mb-4">{heading}</h2>
          <div className="max-h-96 space-y-4 overflow-auto p-1">
            {rows.length ? rows.map((bug) => <Link key={bug.id} className="block" to={`/projects/${encodeURIComponent(id)}/bugs/${encodeURIComponent(bug.id)}`}><BugCard title={bug.title} priority={bug.priority} dueDate={bug.duedate} /></Link>) : <p className="text-gray-400">No bugs</p>}
          </div>
        </div>)}
      </section>
    </main>
  );
}
