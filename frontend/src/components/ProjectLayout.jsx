import { useState } from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';

const ProjectLayout = () => {
  const { id } = useParams();
  

  return (
    <div className='flex'>
      <nav className='p-10 h-screen'>
        <NavLink to={'/projects'} className='text-xl'>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
        </NavLink>
        <ul className='mt-10 space-y-4'>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/dashboard`}>Dashboard</NavLink></li>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/bugs`}>Bugs</NavLink></li>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/stats`}>Statistics</NavLink></li>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/calendar`}>Calendar</NavLink></li>
        </ul>
      </nav>

      <div className='p-16 bg-gray-100 w-screen'>
        <Outlet /> 
      </div>
    </div>
  );
};

export default ProjectLayout;
