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
                                        Delete
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
                                <BugCard key={bug.id} title={bug.title} priority={bug.priority} dueDate={bug.duedate}/>
                            ))
                        ) : (
                            <p className="text-gray-400">No bugs</p>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white rounded-2xl w-1/3 shadow-md">
                    <h1 className="text-xl text-gray-500 mb-4">IN PROGRESS</h1>
                    <div className="h-70 space-y-4 overflow-auto p-2">
                        {inProgressBugs.length > 0 ? (
                            inProgressBugs.map((bug) => (
                                <BugCard key={bug.id} title={bug.title} priority={bug.priority} dueDate={bug.duedate}/>
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
                                <BugCard key={bug.id} title={bug.title} priority={bug.priority} dueDate={bug.duedate}/>
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
