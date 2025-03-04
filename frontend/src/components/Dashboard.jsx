import React, { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import BugCard from "./BugCard";

const Dashboard = () => {
    const { id } = useParams();
    const [bugs, setBugs] = useState([]);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${id}/members`);
                const data = await res.json();
                console.log(data);
                setMembers(data);
            } catch (error) {
                console.log(error);
            }
        };

        const fetchBugs = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${id}/bugs`);
                const data = await res.json();
                console.log(data);
                setBugs(data.bugs);
            } catch (error) {
                console.error(error);
            }
        };

        fetchMembers();
        fetchBugs();
    }, []);

    const deleteMember = async (memberid) => {
        try {
            const res = await fetch(`http://localhost:8080/projects/${id}/deleteMember/${memberid}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                setMembers((prevMembers) => prevMembers.filter((member) => member.id !== memberid));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const todoBugs = bugs.filter((bug) => bug.status === "TO DO");
    const inProgressBugs = bugs.filter((bug) => bug.status === "IN PROGRESS");
    const doneBugs = bugs.filter((bug) => bug.status === "DONE");

    return (
        <div>
            <h1 className="text-4xl font-black mb-8">Dashboard</h1>
            <NavLink to={`/projects/${id}/addMember`} className="px-3 py-2 bg-green-400 rounded-full font-bold text-white">
                + Add Member to Project
            </NavLink>

            <div className="flex items-center space-x-4 mt-8">
                <div className="text-2xl font-bold">Project Members: </div>
                <div className="flex">
                    {members.length > 0 ? (
                        <div className="flex space-x-4 overflow-x-auto w-150 p-2 text-nowrap">
                            {members.map((member) => (
                                <div key={member.id} className="flex space-x-2 bg-white rounded-full shadow-lg px-3 py-2">
                                    <div className="font-black">{member.firstname[0]}{member.lastname[0]}</div>
                                    <div>{member.firstname} {member.lastname}</div>
                                    <button onClick={() => deleteMember(member.id)} className="px-2 text-red-600 underline">
                                    <svg xmlns="http://www.w3.org/2000/svg" className='size-12' color='red' fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No members in this project</p>
                    )}
                </div>
            </div>

            <div className="flex space-x-6 mt-8">
                <div className="p-6 bg-white rounded-2xl w-1/3 shadow-md">
                    <h1 className="text-xl text-gray-500 mb-4">TO DO</h1>
                    <div className="h-70 space-y-4 overflow-auto p-2">
                        {todoBugs.length > 0 ? (
                            todoBugs.map((bug) => (
                                <NavLink className='p-2' to={`/projects/${id}/bugs/${bug.id}`}>
                                    <BugCard key={bug.id} title={bug.title} priority={bug.priority} dueDate={bug.duedate}/>
                                </NavLink>
                            ))
                        ) : (
                            <p className="text-gray-400">No bugs</p>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white rounded-2xl w-1/3 shadow-md">
                    <h1 className="text-xl text-gray-500 mb-4">IN PROGRESS</h1>
                    <div className="h-70 space-y-4 overflow-auto">
                        {inProgressBugs.length > 0 ? (
                            inProgressBugs.map((bug) => (
                                <NavLink className='p-2' to={`/projects/${id}/bugs/${bug.id}`}>
                                    <BugCard key={bug.id} title={bug.title} priority={bug.priority} dueDate={bug.duedate}/>
                                </NavLink>
                            ))  
                        ) : (
                            <p className="text-gray-400">No bugs</p>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white rounded-2xl w-1/3 shadow-md">
                    <h1 className="text-xl text-gray-500 mb-4">DONE</h1>
                    <div className="h-70 space-y overflow-auto p-2">
                        {doneBugs.length > 0 ? (
                            doneBugs.map((bug) => (
                                <NavLink className='p-2' to={`/projects/${id}/bugs/${bug.id}`}>
                                    <BugCard key={bug.id} title={bug.title} priority={bug.priority} dueDate={bug.duedate}/>
                                </NavLink>
                            ))
                        ) : (
                            <p className="text-gray-400">No bugs</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
