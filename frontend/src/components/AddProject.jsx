import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const AddProject = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:8080/projects/newProject", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description
                })
            });
            
            if(res.ok) {
                navigate('/projects');
            }
        } catch(error) {
            setError("Please provide all required fields");
            console.log(error);
        }
    }

  return (
    <div className='flex flex-col space-y-8 h-screen justify-center items-center bg-gray-100'>
        <div className='text-4xl font-black'>
            <h1>Add New Project</h1>
        </div>
        <form onSubmit={handleSubmit} className='flex flex-col space-y-8 bg-white py-8 px-16 rounded-2xl shadow-xl'>
            <input onChange={(e) => setTitle(e.target.value)} type='text' placeholder='Title' className="p-2 bg-gray-100 shadow-inner w-[250px] rounded-xl"/>
            <input onChange={(e) => setDescription(e.target.value)} type='text' placeholder='Description' className="p-2 bg-gray-100 shadow-inner w-[250px] rounded-xl" />
            <button className='px-4 py-2 bg-blue-600 text-white font-bold rounded-full'>Add Project</button>
            {error && (
                <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
                    {error}
                </div>
            )}
        </form>
    </div>
  )
}

export default AddProject