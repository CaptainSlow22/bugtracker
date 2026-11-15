import React from "react";

export default function ProjectCard({ title, description }) {
  return <div className="min-h-36 bg-white rounded-2xl shadow-xl p-5 border-l-4 border-blue-700">
    <h3 className="font-black text-xl">{title}</h3>
    <p className="text-gray-600 mt-2 line-clamp-3">{description}</p>
  </div>;
}
