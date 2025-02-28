import { useState } from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';

const ProjectLayout = () => {
  const { id } = useParams();
  

  return (
    <div className='flex'>
      <nav className='p-10 shadow-2xl h-screen'>
        <NavLink to={'/projects'} className='text-xl'>{'<'} Back</NavLink>
        <ul className='mt-10 space-y-4'>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/dashboard`}>Dashboard</NavLink></li>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/bugs`}>Bugs</NavLink></li>
          <li className='font-bold text-2xl'><NavLink to={`/projects/${id}/stats`}>Stats</NavLink></li>
        </ul>
      </nav>

      <div className='p-16 bg-gray-100 w-screen'>
        <Outlet /> 
      </div>
    </div>
  );
};

export default ProjectLayout;
