import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "./AuthContext";
import ProjectCard from "./ProjectCard";

export default function Projects() {
  const { signOut } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProjects = useCallback(async (signal) => {
    setError("");
    try {
      const data = await apiRequest("/projects?page=1&limit=100", { signal });
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete project “${project.title}” and all its bugs and comments?`)) return;
    setError("");
    try {
      await apiRequest(`/projects/${encodeURIComponent(project.id)}`, { method: "DELETE" });
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (requestError) {
      setError(requestError.message || "Could not delete project.");
    }
  };

  return (
    <main className="bg-gradient-to-t from-gray-200 to-gray-100 min-h-screen">
      <header className="flex justify-between items-center bg-white shadow-md px-6 py-4">
        <h1 className="font-bold text-3xl">All Projects</h1>
        <button onClick={handleSignOut} className="bg-red-500 px-3 py-2 rounded-xl text-white font-bold">Sign Out</button>
      </header>
      <div className="px-6 sm:px-10 mt-8"><Link to="/projects/newProject" className="inline-block bg-blue-700 px-3 py-2 rounded-xl text-white font-bold">+ Add new project</Link></div>
      {error && <p role="alert" className="m-6 bg-red-100 text-red-800 p-3 rounded-lg">{error}</p>}
      {loading ? <p className="p-6">Loading projects…</p> : projects.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-6 sm:p-16">
          {projects.map((project) => (
            <article key={project.id}>
              <Link to={`/projects/${encodeURIComponent(project.id)}/dashboard`} className="block"><ProjectCard title={project.title} description={project.description} /></Link>
              {project.role === "owner" && <button onClick={() => deleteProject(project)} className="mt-2 text-red-700 underline">Delete project</button>}
            </article>
          ))}
        </div>
      ) : <p className="p-6">No projects found.</p>}
    </main>
  );
}
