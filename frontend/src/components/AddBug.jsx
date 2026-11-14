import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

const initialForm = { title: "", description: "", status: "TO DO", priority: "MEDIUM", asignee: "", dueDate: "" };

export default function AddBug() {
  const { id } = useParams();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/projects/${encodeURIComponent(id)}/members`, { signal: controller.signal })
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); });
    return () => controller.abort();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.asignee) return setError("Select an assignee.");
    setSubmitting(true);
    try {
      await apiRequest(`/projects/${encodeURIComponent(id)}/bugs`, {
        method: "POST",
        body: { ...form, asignee: Number(form.asignee) },
      });
      navigate(`/projects/${encodeURIComponent(id)}/bugs`);
    } catch (requestError) {
      setError(requestError.message || "Could not create bug.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <NavLink to={`/projects/${encodeURIComponent(id)}/bugs`}>‹ Back to Bugs</NavLink>
      <h1 className="mt-4 text-3xl font-bold mb-8">Report New Bug</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl p-6 sm:p-8 max-w-5xl">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">Title<input required maxLength={200} value={form.title} onChange={update("title")} className="bg-gray-100 p-2 rounded-xl" /></label>
          <label className="flex flex-col gap-2">Description<textarea required maxLength={20000} value={form.description} onChange={update("description")} className="bg-gray-100 h-48 p-2 rounded-xl" /></label>
          <label className="flex flex-col gap-2">Due date<input required type="date" value={form.dueDate} onChange={update("dueDate")} className="bg-gray-100 p-2 rounded-xl" /></label>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">Status<select required value={form.status} onChange={update("status")} className="bg-gray-100 p-2 rounded-xl"><option>TO DO</option><option>IN PROGRESS</option><option>DONE</option></select></label>
          <label className="flex flex-col gap-2">Priority<select required value={form.priority} onChange={update("priority")} className="bg-gray-100 p-2 rounded-xl"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
          <label className="flex flex-col gap-2">Assignee<select required value={form.asignee} onChange={update("asignee")} className="bg-gray-100 p-2 rounded-xl"><option value="">Select an assignee</option>{members.map((member) => <option key={member.id} value={member.id}>{member.firstname} {member.lastname}</option>)}</select></label>
          <button disabled={submitting} className="bg-red-500 rounded-full px-3 py-2 text-white font-bold">{submitting ? "Submitting…" : "Report Bug"}</button>
        </div>
      </form>
      {error && <p role="alert" className="mt-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
    </main>
  );
}