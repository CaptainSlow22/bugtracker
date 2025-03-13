import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import ProjectCard from './ProjectCard';

const Projects = () => {
    const { token, setToken, loading } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !token) {
            navigate("/login");
        }
    }, [loading, token, navigate]);

    const handleSignOut = () => {
      localStorage.removeItem("token");
      setToken(null);
      navigate("/");
    }

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("http://localhost:8080/projects");
                const data = await res.json();
                console.log(data);
                setProjects(data);
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };

        fetchProjects();
    }, []); 


    const deleteProject = async (id) => {
      try {
        const res = await fetch(`http://localhost:8080/projects/${id}`, {
          method: "DELETE",
          headers: { 'Content-Type': 'application/json' },
        });
    
        if (res.ok) {
          setProjects((prevProjects) => prevProjects.filter(project => project.id !== id));
        } else {
          console.error("Failed to delete project");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    };
    

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className='bg-gradient-to-t from-gray-200 to-gray-100 min-h-screen'>
            <div className='flex justify-between bg-white shadow-md px-6 py-4'>
              <h1 className='font-bold text-3xl'>All Projects</h1>
              <button onClick={handleSignOut} className='bg-red-500 px-3 py-2 rounded-xl text-white font-bold'>Sign Out</button>
            </div>
            <div className='px-10 mt-10'>
              <Link to='/projects/newProject'><button className='bg-blue-700 px-3 py-2 rounded-xl text-white font-bold'>+ Add new project</button></Link>
            </div>
            {projects.length > 0 ? (
                <div className='grid grid-cols-3 gap-8 p-16 h-svh'>
                {projects.map((project) => (
                    <div key={project.id}>
                        <Link to={`/projects/${project.id}/dashboard`}>
                            <ProjectCard title={project.title} description={project.description.substring(0, 50)} />
                        </Link>
                        <div className='mt-1 mr-4 flex justify-end'> 
                            <button onClick={() => deleteProject(project.id)} className='flex items-center text-red-600'>
                                Delete
                                <svg xmlns="http://www.w3.org/2000/svg" color='red' fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 ml-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>            
            ) : (
                <p className='p-6'>No projects found.</p>
            )}
        </div>
    );
};

export default Projects;
