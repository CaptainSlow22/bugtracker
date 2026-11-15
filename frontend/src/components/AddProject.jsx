import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function AddProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest("/projects/newProject", { method: "POST", body: { title, description } });
      navigate("/projects", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Could not create project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col gap-8 min-h-screen justify-center items-center bg-gray-100 p-6">
      <h1 className="text-4xl font-black">Add New Project</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white py-8 px-8 sm:px-16 rounded-2xl shadow-xl w-full max-w-2xl">
        <label className="flex flex-col gap-2">Title
          <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="p-2 bg-gray-100 rounded-xl" />
        </label>
        <label className="flex flex-col gap-2">Description
          <textarea required maxLength={10000} value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 bg-gray-100 rounded-xl h-40" />
        </label>
        <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-full">{submitting ? "Creating…" : "Add Project"}</button>
        {error && <p role="alert" className="bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      </form>
    </main>
  );
}
