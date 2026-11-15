import { NavLink, Outlet, useParams } from "react-router-dom";

export default function ProjectLayout() {
  const { id } = useParams();
  const projectPath = `/projects/${encodeURIComponent(id)}`;
  return <div className="min-h-screen md:flex">
    <nav className="bg-white p-5 md:p-8 md:min-h-screen md:w-64 shrink-0" aria-label="Project navigation">
      <NavLink to="/projects" className="text-blue-700 underline">← All projects</NavLink>
      <ul className="mt-6 flex flex-wrap gap-4 md:block md:space-y-4">
        <li><NavLink to={`${projectPath}/dashboard`}>Dashboard</NavLink></li>
        <li><NavLink to={`${projectPath}/bugs`}>Bugs</NavLink></li>
        <li><NavLink to={`${projectPath}/stats`}>Statistics</NavLink></li>
        <li><NavLink to={`${projectPath}/calendar`}>Calendar</NavLink></li>
      </ul>
    </nav>
    <div className="p-5 md:p-10 bg-gray-100 flex-1 min-w-0"><Outlet /></div>
  </div>;
}
