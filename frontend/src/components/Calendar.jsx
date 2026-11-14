import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useParams } from "react-router-dom";
import { apiGetAllPages } from "../lib/api";

export default function Calendar() {
  const { id } = useParams();
  const [bugs, setBugs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiGetAllPages(`/projects/${encodeURIComponent(id)}/bugs`, { signal: controller.signal })
      .then(setBugs)
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message || "Could not load calendar items."); });
    return () => controller.abort();
  }, [id]);

  const events = bugs.filter((bug) => bug.duedate).map((bug) => ({
    id: String(bug.id), title: bug.title, start: bug.duedate, allDay: true,
    url: `/projects/${encodeURIComponent(id)}/bugs/${encodeURIComponent(bug.id)}`,
  }));

  return <main><h1 className="text-4xl font-black mb-6">Calendar</h1>{error && <p role="alert" className="mb-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}<FullCalendar height={650} plugins={[dayGridPlugin]} initialView="dayGridMonth" weekends events={events} /></main>;
}