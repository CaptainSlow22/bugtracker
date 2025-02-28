import React, { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'

const Dashboard = () => {
    const {id} = useParams();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${id}/members`);
                const data = await res.json();
                console.log(data);
                setMembers(data);
            } catch(error) {
                console.log(error);
            }
        }

        fetchMembers();
    },[]);

    const deleteMember = async (memberid) => {
        try {
            const res = await fetch(`http://localhost:8080/projects/${id}/deleteMember/${memberid}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if(res.ok) {
                setMembers((prevMembers) => prevMembers.filter((member => member.id !== memberid)));
            }

        } catch(error) {
            console.error(error);
        }
    }


  return (
    <div>
        <NavLink to={`/projects/${id}/addMember`} className='px-3 py-2 bg-green-400 rounded-full font-bold text-white'>+ Add Member to Project</NavLink>
        <div className='flex items-center space-x-4 mt-8'>
            <div className='text-2xl font-bold'>Project Members: </div>
            <div className='flex'>
                {members.length > 0 ? (
                    <div className='flex space-x-4'>
                        {members.map((member) => (
                            <div key={member.id} className='flex space-x-2 bg-white rounded-full shadow-lg px-3 py-2'>
                               <div className='font-black'>
                               {member.firstname[0]}{member.lastname[0]}
                                </div>
                                <div>
                                    {member.firstname} {member.lastname}
                                </div>
                                <button onClick={() => deleteMember(member.id)} className='px-2 text-red-600 underline'>Delete</button>
                            </div>
                        ))}
                    </div>
                ) : (<p>No members in this project</p>)}
            </div>
        </div>
    </div>
  )
}

export default Dashboard