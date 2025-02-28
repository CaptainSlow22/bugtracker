import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AddMember = () => {
    const {id} = useParams();
    const [allMembers, setAllMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllMembers = async () => {
            try {
                const res = await fetch("http://localhost:8080/members");
                const data = await res.json();
                setAllMembers(data);
            } catch (error) {
                console.log(error);
            }
        };
        fetchAllMembers();
    }, []);

    const handleSelection = (memberId) => {
        setSelectedMember(memberId);
    };

    const handleSubmit = async () => {
        if (!selectedMember) {
            alert("Please select a member before submitting.");
            return;
        }
    
        try {
            const res = await fetch(`http://localhost:8080/projects/${id}/addMember/${selectedMember}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            
            if (res.ok) {
                alert("Member added successfully!");
                setSelectedMember(null);
                navigate(`/projects/${id}/dashboard`);
            } else {
                alert("Failed to add member.");
            }
        } catch (error) {
            console.error("Error submitting selected member:", error);
        }
    };

    return (
        <div>
            <h1 className='text-3xl font-bold'>Add new member to project</h1>
            {allMembers.length > 0 ? (
                <div className='bg-white p-6 mt-6 rounded-2xl'>
                    {allMembers.map((member) => (
                        <div key={member.id} className='border-b p-2'>
                            <label className='text-xl'>
                                <input className='mr-2'
                                    type="radio"
                                    name="member"
                                    value={member.id}
                                    checked={selectedMember === member.id}
                                    onChange={() => handleSelection(member.id)}
                                />
                                {member.firstname} {member.lastname}
                            </label>
                        </div>
                    ))}
                    <button onClick={handleSubmit} disabled={!selectedMember} className='mt-6 bg-green-400 px-3 py-2 rounded-full text-white font-bold'>
                        Add Member
                    </button>
                </div>
            ) : (
                <p>No members found</p>
            )}
        </div>
    );
};

export default AddMember;
