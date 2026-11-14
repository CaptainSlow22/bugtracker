import React from "react";

export default function BugCard({ title, priority, dueDate }) {
  return <article className="bg-gray-100 p-5 shadow rounded-2xl">
    <h3 className="font-black text-lg mb-4 break-words">{title}</h3>
    <div className="flex items-center justify-between gap-3">
      <span className={`px-3 py-1 text-white font-bold rounded-full ${priority === "LOW" ? "bg-green-600" : priority === "MEDIUM" ? "bg-yellow-600" : "bg-red-600"}`}>{priority}</span>
      <span>{dueDate ? String(dueDate).slice(0, 10) : "No due date"}</span>
    </div>
  </article>;
}