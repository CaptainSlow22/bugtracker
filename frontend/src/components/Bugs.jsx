import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function Bugs() {
  const { id } = useParams();
  const [bugs, setBugs] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadBugs = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/projects/${encodeURIComponent(id)}/bugs?page=${page}&limit=5`, { signal });
      setBugs(Array.isArray(data?.bugs) ? data.bugs : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Could not load bugs.");
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    const controller = new AbortController();
    loadBugs(controller.signal);
    return () => controller.abort();
  }, [loadBugs]);

  const deleteBug = async (bug) => {
    if (!window.confirm(`Delete “${bug.title}”? Its comments will also be deleted.`)) return;
    setError("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(id)}/bugs/${encodeURIComponent(bug.id)}`, { method: "DELETE" });
      if (bugs.length === 1 && page > 1) setPage((current) => current - 1);
      else setBugs((current) => current.filter((item) => item.id !== bug.id));
    } catch (requestError) {
      setError(requestError.message || "Could not delete bug.");
    }
  };

  return (
    <main>
      <h1 className="text-4xl font-black mb-8">Bugs</h1>
      <Link to={`/projects/${encodeURIComponent(id)}/addBug`} className="inline-block px-3 py-2 bg-red-500 rounded-full font-bold text-white">+ Report Bug in Project</Link>
      {error && <p role="alert" className="mt-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      <div className="mt-8 overflow-x-auto bg-white rounded-2xl shadow-md">
        <table className="w-full text-left">
          <thead><tr className="border-b text-lg"><th className="p-4">Title</th><th className="p-4">Status</th><th className="p-4">Priority</th><th className="p-4">Due Date</th><th className="p-4">Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="p-4">Loading…</td></tr> : bugs.length ? bugs.map((bug) => (
              <tr key={bug.id} className="border-b hover:bg-gray-50 font-semibold">
                <td className="p-4"><Link className="text-blue-700 underline" to={`/projects/${encodeURIComponent(id)}/bugs/${encodeURIComponent(bug.id)}`}>{bug.title}</Link></td>
                <td className="p-4">{bug.status}</td><td className="p-4">{bug.priority}</td><td className="p-4">{bug.duedate || "—"}</td>
                <td className="p-4"><button onClick={() => deleteBug(bug)} className="text-red-700 underline">Delete</button></td>
              </tr>
            )) : <tr><td colSpan="5" className="p-4 text-center text-gray-500">No bugs on this page.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Bug pages" className="flex items-center justify-center gap-6 mt-8">
        <button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="px-3 py-1 bg-black text-white rounded-full">Previous</button>
        <span className="font-bold">Page {page}</span>
        <button disabled={bugs.length < 5 || loading} onClick={() => setPage((current) => current + 1)} className="px-3 py-1 bg-black text-white rounded-full">Next</button>
      </nav>
    </main>
  );
}