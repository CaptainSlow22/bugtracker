import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { debugAdvice } from "../lib/groqAI";
import { useAuth } from "./AuthContext";

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

export default function Bug() {
  const { id: projectId, bugId } = useParams();
  const { memberId } = useAuth();
  const [bug, setBug] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", status: "", priority: "", asignee: "" });
  const [asignees, setAsignees] = useState([]);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const base = `/projects/${encodeURIComponent(projectId)}/bugs/${encodeURIComponent(bugId)}`;

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const [bugData, membersData, commentsData] = await Promise.all([
        apiRequest(base, { signal }),
        apiRequest(`/projects/${encodeURIComponent(projectId)}/members`, { signal }),
        apiRequest(`${base}/comments`, { signal }),
      ]);
      setBug(bugData);
      setForm({
        title: bugData.title || "",
        description: bugData.description || "",
        dueDate: String(bugData.duedate || "").slice(0, 10),
        status: bugData.status || "TO DO",
        priority: bugData.priority || "MEDIUM",
        asignee: String(bugData.asignee || ""),
      });
      setAsignees(Array.isArray(membersData) ? membersData : []);
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Could not load this bug.");
    } finally {
      setLoading(false);
    }
  }, [base, projectId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleUpdateBug = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const updated = await apiRequest(base, {
        method: "PUT",
        body: { ...form, asignee: Number(form.asignee), dueDate: form.dueDate },
      });
      setBug(updated);
      setForm((current) => ({ ...current, ...updated, asignee: String(updated.asignee), dueDate: String(updated.duedate || "").slice(0, 10) }));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not update bug.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBug = async () => {
    if (!window.confirm(`Delete “${bug?.title || "this bug"}” and its comments?`)) return;
    try {
      await apiRequest(base, { method: "DELETE" });
      navigate(`/projects/${encodeURIComponent(projectId)}/bugs`, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Could not delete bug.");
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return setError("Comment cannot be empty.");
    setSubmitting(true);
    setError("");
    try {
      await apiRequest(`${base}/comments`, { method: "POST", body: { content: trimmed } });
      setContent("");
      const rows = await apiRequest(`${base}/comments`);
      setComments(Array.isArray(rows) ? rows : []);
    } catch (requestError) {
      setError(requestError.message || "Could not add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await apiRequest(`${base}/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (requestError) {
      setError(requestError.message || "Could not delete comment.");
    }
  };

  const handleDebugAdvice = async () => {
    setAiError("");
    setAiAdvice("");
    if (!form.description.trim()) return setAiError("Add a bug description before asking for advice.");
    if (form.description.length > 10000) return setAiError("Ask AI accepts descriptions up to 10,000 characters.");
    setAiLoading(true);
    try {
      setAiAdvice(await debugAdvice(form.description));
    } catch (requestError) {
      setAiError(requestError.message || "Could not get AI advice.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <p>Loading bug…</p>;
  if (!bug) return <main><NavLink to={`/projects/${encodeURIComponent(projectId)}/bugs`}>‹ Back to bugs</NavLink><p role="alert" className="mt-4">{error || "Bug not found."}</p></main>;

  return (
    <main>
      <NavLink to={`/projects/${encodeURIComponent(projectId)}/dashboard`}>‹ Back to Dashboard</NavLink>
      <header className="mt-4 flex justify-between items-start gap-4">
        <h1 className="text-3xl sm:text-4xl font-black mb-6">{bug.title}</h1>
        <button onClick={deleteBug} aria-label="Delete bug" className="text-red-700 underline">Delete</button>
      </header>
      {error && <p role="alert" className="mb-4 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      <form onSubmit={handleUpdateBug} className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white rounded-2xl p-6">
        <label className="flex flex-col gap-2">Title<input required maxLength={200} value={form.title} onChange={update("title")} className="bg-gray-100 p-2 rounded-xl" /></label>
        <label className="flex flex-col gap-2">Description<textarea required maxLength={20000} value={form.description} onChange={update("description")} className="bg-gray-100 min-h-40 p-2 rounded-xl" /></label>
        <label className="flex flex-col gap-2">Due date<input required type="date" value={form.dueDate} onChange={update("dueDate")} className="bg-gray-100 p-2 rounded-xl" /></label>
        <label className="flex flex-col gap-2">Status<select required value={form.status} onChange={update("status")} className="bg-gray-100 p-2 rounded-xl"><option>TO DO</option><option>IN PROGRESS</option><option>DONE</option></select></label>
        <label className="flex flex-col gap-2">Priority<select required value={form.priority} onChange={update("priority")} className="bg-gray-100 p-2 rounded-xl"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
        <label className="flex flex-col gap-2">Assignee<select required value={form.asignee} onChange={update("asignee")} className="bg-gray-100 p-2 rounded-xl"><option value="">Select an assignee</option>{asignees.map((member) => <option key={member.id} value={member.id}>{member.firstname} {member.lastname}</option>)}</select></label>
        <button disabled={submitting} className="bg-blue-600 rounded-full px-3 py-2 text-white font-bold w-fit">{submitting ? "Saving…" : "Update Bug"}</button>
      </form>

      <section className="mt-6">
        <p className="text-sm text-gray-600 mb-2">This sends the bug description to Groq. Remove secrets or personal data before requesting advice.</p>
        <button type="button" onClick={handleDebugAdvice} disabled={aiLoading || submitting} className="px-4 py-2 rounded-xl text-white bg-gradient-to-b from-blue-900 to-blue-700 font-bold">
          {aiLoading ? "Getting advice…" : "⚡ Ask AI to help debug"}
        </button>
        {aiError && <p role="alert" className="mt-3 bg-red-100 text-red-800 p-3 rounded-lg">{aiError}</p>}
        {aiAdvice && <div className="mt-4 p-5 bg-orange-100 rounded-2xl">
          <h2 className="font-bold text-lg mb-2">Suggested debugging steps</h2>
          <p className="whitespace-pre-wrap break-words">{aiAdvice}</p>
          <p className="mt-3 text-sm text-gray-600">AI suggestions can be incorrect; verify them against your code and logs.</p>
        </div>}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl mb-3 font-bold">Comments</h2>
        <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-3">
          <label className="sr-only" htmlFor="comment-content">Write a comment</label>
          <textarea id="comment-content" required maxLength={5000} value={content} onChange={(event) => setContent(event.target.value)} className="bg-white min-h-24 flex-1 p-3 rounded-xl" placeholder="Leave a comment…" />
          <button disabled={submitting} className="self-start bg-green-600 px-4 py-2 rounded-xl text-white font-bold" type="submit">Comment</button>
        </form>
        {comments.length ? <div className="max-h-96 overflow-y-auto mt-4 p-4 bg-white rounded-xl space-y-3">
          {comments.map((comment) => (
            <article key={comment.id} className="flex gap-4 p-3 border-b">
              <div className="font-black text-lg" aria-hidden="true">{comment.firstname?.[0] || "?"}{comment.lastname?.[0] || "?"}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3"><p className="font-bold">{comment.firstname} {comment.lastname}</p>
                  {Number(comment.memberid) === Number(memberId) && <button type="button" onClick={() => deleteComment(comment.id)} className="text-red-700 underline">Delete</button>}
                </div>
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                <time className="text-sm text-gray-600" dateTime={comment.updatedat || comment.createdat}>{formatTimestamp(comment.updatedat || comment.createdat)}</time>
              </div>
            </article>
          ))}
        </div> : <p className="p-4">No comments yet.</p>}
      </section>
      <p className="sr-only">Current bug ID: {bug.id}</p>
    </main>
  );
}