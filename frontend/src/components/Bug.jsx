import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Bug = () => {
    const { id: projectId, bugId } = useParams();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [asignee, setAsignee] = useState("");
    const [asignees, setAsignees] = useState([]);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchBug = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${projectId}/bugs/${bugId}`);
                if (!res.ok) throw new Error("Failed to fetch bug");
                const data = await res.json();

                setTitle(data.title);
                setDescription(data.description);
                setStatus(data.status);
                setPriority(data.priority);
                setAsignee(data.asignee);
                setDueDate(data.duedate);
            } catch (error) {
                setError("Error fetching bug");
                console.error(error);
            }
        };

        const fetchAsignees = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${projectId}/members`);
                if (!res.ok) throw new Error("Failed to fetch members");
                const data = await res.json();
                setAsignees(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchBug();
        fetchAsignees();
    }, []);

    const handleUpdateBug = async (e) => {
        e.preventDefault();
    
        if (!title || !description || !status || !priority || !dueDate) {
            setError("All fields except Assignee are required.");
            return;
        }
    
        const formattedDueDate = dueDate ? dueDate.split("T")[0] : null;
        const updatedBug = {
            title,
            description,
            status,
            priority,
            asignee: asignee ? Number(asignee) : null, 
            dueDate: formattedDueDate 
        };
    
    
        try {
            const res = await fetch(`http://localhost:8080/projects/${projectId}/bugs/${bugId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedBug) 
            });
    
            if (!res.ok) {
                throw new Error("Failed to update bug");
            }
    
            alert("Bug updated successfully!");
            navigate(`/projects/${projectId}/dashboard`);
        } catch (error) {
            setError("Error updating bug: " + error.message);
            console.error(error);
        }
    };

    const deleteBug = async (bugId) => {
        try {
          const res = await fetch(`http://localhost:8080/projects/${projectId}/bugs/${bugId}`, {
            method: "DELETE",
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if(res.ok) {
            alert("Bug deleted successfully!");
            navigate(`/projects/${projectId}/dashboard`);
          }
    
        } catch(error) {
          setError("Error deleting bug");
          console.error(error);
        }
    }
    
    return (
        <div>
            <div className='flex justify-between items-center'>
                <h1 className='text-4xl font-black mb-8'>{title}</h1>
                <button onClick={() => deleteBug(bugId)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className='size-12' color='red' fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </div>
            <form onSubmit={handleUpdateBug} className='flex px-8 py-4 space-x-32'>
                <div className='flex flex-col space-y-4'>
                    <input 
                        onChange={(e) => setTitle(e.target.value)} 
                        type='text' 
                        value={title} 
                        placeholder='Title' 
                        className='bg-white p-2 rounded-xl shadow-inner' 
                    />
                    <textarea 
                        onChange={(e) => setDescription(e.target.value)} 
                        value={description} 
                        placeholder="Description" 
                        className="bg-white h-40 w-150 p-2 shadow-inner rounded-xl text-left align-top" 
                    />
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Due Date:</label>
                        <input 
                            onChange={(e) => setDueDate(e.target.value)} 
                            type='date' 
                            value={dueDate} 
                            className='bg-white p-2 rounded-xl shadow-inner' 
                        />
                    </div>
                    <button type='submit' className='bg-blue-400 rounded-full px-3 py-2 text-white font-bold w-1/2'>
                        Update Bug
                    </button>
                </div>
                <div className='flex flex-col space-y-4'>
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Status:</label>
                        <select 
                            onChange={(e) => setStatus(e.target.value)} 
                            value={status} 
                            className='bg-white p-2 rounded-xl shadow-inner'
                        >
                            <option value="">Select Status</option>
                            <option value="TO DO">TO DO</option>
                            <option value="IN PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </div>
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Priority:</label>
                        <select 
                            onChange={(e) => setPriority(e.target.value)} 
                            value={priority} 
                            className='bg-white p-2 rounded-xl shadow-inner'
                        >
                            <option value="">Select Priority</option>
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                    </div>
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Assignee</label>
                        <select 
                            onChange={(e) => setAsignee(e.target.value)} 
                            value={asignee} 
                            className='bg-white p-2 rounded-xl shadow-inner'
                        >
                            <option value="">Select an Asignee</option>
                            {asignees.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.firstname} {member.lastname}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {error && <p className="mt-4 bg-red-500 p-2 text-white rounded-xl">{error}</p>}
            </form>
        </div>
    );
};

export default Bug;
