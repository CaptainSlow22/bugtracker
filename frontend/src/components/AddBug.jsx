import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AddBug = () => {
    const { id } = useParams();
    const [asignees, setAsignees] = useState([]);
    const token = localStorage.getItem("token");
    const payload = jwtDecode(token);
    const reporterId = payload.memberId;
    const [asignee, setAsignee] = useState(null);
    const [reporter, setReporter] = useState([]);
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [dueDate, setDueDate] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAsignees = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${id}/members`);
                const data = await res.json();
                setAsignees(data);
            } catch (error) {
                console.error(error);
            }
        };

        const fetchReporter = async () => {
            try {
                const res = await fetch(`http://localhost:8080/members/${reporterId}`);
                const data = await res.json();
                setReporter(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchAsignees();
        fetchReporter();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!asignee) {
            setError("Please select an assignee.");
            return;
        }
    
        if (!reporter) {
            setError("Reporter information is missing.");
            return;
        }
    
        const formattedDueDate = dueDate ? new Date(dueDate).toISOString().split("T")[0] : null;
    
        const payload = {
            title,
            description,
            status,
            priority,
            asignee: asignee.id,
            reporter: reporter[0].id,
            dueDate: formattedDueDate,
        };
    
        console.log("Sending Payload:", payload);
    
        try {
            const res = await fetch(`http://localhost:8080/projects/${id}/bugs`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
    
            if (!res.ok) {
                const errorResponse = await res.text();
                console.error("Server Response:", errorResponse);
                setError("Failed to submit bug.");
                return;
            }
    
            alert("Bug reported successfully!");
            navigate(`/projects/${id}/bugs`);
        } catch (error) {
            setError("Please provide all required fields.");
            console.error("Fetch error:", error);
        }
    };
    

    return (
        <div>
            <h1 className='text-3xl font-bold mb-8'>Report New Bug</h1>
            <form onSubmit={handleSubmit} className='flex bg-white rounded-2xl px-8 py-8 space-x-16 w-3/4'>
                <div className='flex flex-col space-y-4'>
                    <input onChange={(e) => setTitle(e.target.value)} type='text' value={title} placeholder='Title' className='bg-gray-100 p-2 rounded-xl shadow-inner'/>
                    <textarea onChange={(e) => setDescription(e.target.value)} value={description} placeholder="Description" className="bg-gray-100 h-80 w-100 p-2 shadow-inner rounded-xl text-left align-top"/>

                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Due Date:</label>
                        <input onChange={(e) => setDueDate(e.target.value)} type='date' value={dueDate} className='bg-gray-100 p-2 rounded-xl shadow-inner' />
                    </div>
                    <button type='submit' className='bg-red-400 rounded-full px-3 py-2 text-white font-bold w-1/2'>Report</button>
                </div>
                <div className='flex flex-col space-y-4'>
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Status:</label>
                        <select onChange={(e) => setStatus(e.target.value)} value={status} className='bg-gray-100 p-2 rounded-xl shadow-inner'>
                            <option value="">Select Status</option>
                            <option value="TO DO">TO DO</option>
                            <option value="IN PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </div>
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Priority:</label>
                        <select onChange={(e) => setPriority(e.target.value)} value={priority} className='bg-gray-100 p-2 rounded-xl shadow-inner'>
                            <option value="">Select Priority</option>
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                    </div>
                    <div className='flex items-center'>
                        <label className='font-bold mr-2'>Asignee</label>
                        <select onChange={(e) => {
                            const selectedAsignee = asignees.find(a => a.id.toString() === e.target.value);
                            setAsignee(selectedAsignee || null);
                        }} className='bg-gray-100 p-2 rounded-xl shadow-inner'>
                            <option value="">Select an Assignee</option>
                            {asignees.map((asignee) => (
                                <option key={asignee.id} value={asignee.id}>
                                    {asignee.firstname} {asignee.lastname}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </form>
            {error && <p className="mt-4 bg-red-500 p-2 text-white rounded-xl">{error}</p>}
        </div>
    );
};

export default AddBug;
