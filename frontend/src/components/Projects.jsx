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
        <div className='bg-gradient-to-t from-gray-200 to-gray-100 h-screen'>
            <div className='flex justify-between bg-white shadow-xl px-6 py-4'>
              <h1 className='font-bold text-3xl'>All Projects</h1>
              <button onClick={handleSignOut} className='bg-red-500 p-2 rounded-xl text-white font-bold'>Sign Out</button>
            </div>
            <div className='px-10 mt-10'>
              <Link to='/projects/newProject'><button className='bg-blue-700 p-2 rounded-xl text-white font-bold'>+ Add new project</button></Link>
            </div>
            {projects.length > 0 ? (
                <div className='grid grid-cols-3 gap-8 p-16'>
                    {projects.map((project) => (
                      <div key={project.id}>
                        <Link to={`/projects/${project.id}/dashboard`}>
                          <ProjectCard title={project.title} description={project.description} />
                        </Link>
                        <button onClick={() => deleteProject(project.id)} className='px-6 text-red-600 underline'>Delete</button>
                      </div>
                    ))}
                </div>
            ) : (
                <p>No projects found.</p>
            )}
        </div>
    );
};

export default Projects;
