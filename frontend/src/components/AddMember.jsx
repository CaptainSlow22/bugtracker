import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function AddMember() {
  const { id } = useParams();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/members?page=1&limit=100", { signal: controller.signal })
      .then((data) => setMembers(Array.isArray(data?.members) ? data.members : []))
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); });
    return () => controller.abort();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedMember) return setError("Select a member first.");
    setSubmitting(true);
    setError("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(id)}/addMember/${encodeURIComponent(selectedMember)}`, { method: "POST" });
      navigate(`/projects/${encodeURIComponent(id)}/dashboard`);
    } catch (requestError) {
      setError(requestError.message || "Could not add member.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <NavLink to={`/projects/${encodeURIComponent(id)}/dashboard`}>‹ Back to Dashboard</NavLink>
      <h1 className="mt-4 text-3xl font-bold">Add a member to this project</h1>
      {error && <p role="alert" className="mt-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white p-6 mt-6 rounded-2xl w-full max-w-xl">
        {members.length ? members.map((member) => (
          <label key={member.id} className="block border-b p-3 text-lg">
            <input className="mr-3" type="radio" name="member" value={member.id} checked={String(selectedMember) === String(member.id)} onChange={() => setSelectedMember(String(member.id))} />
            {member.firstname} {member.lastname}
          </label>
        )) : <p>No eligible members found.</p>}
        <button disabled={!selectedMember || submitting} className="mt-6 bg-green-600 px-3 py-2 rounded-full text-white font-bold">{submitting ? "Adding…" : "Add Member"}</button>
      </form>
    </main>
  );
}