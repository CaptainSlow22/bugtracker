import React, { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'

const Bugs = () => {
  const {id} = useParams();
  const [bugs, setBugs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await fetch(`http://localhost:8080/projects/${id}/bugs`);
        const data = await res.json();
        setBugs(data.bugs.reverse());
      } catch(error) {
        setError("Error fetching bugs");
        console.error(error);
      }
    };

    fetchBugs();
  },[]);

  const deleteBug = async (bugId) => {
    try {
      const res = await fetch(`http://localhost:8080/projects/${id}/bugs/${bugId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if(res.ok) {
        setBugs((prevBugs) => prevBugs.filter(bug => bug.id !== bugId));
      }

    } catch(error) {
      setError("Error deleting bug");
      console.error(error);
    }
  }

  return (
    <div>
      <h1 className='text-4xl font-black mb-8'>Bugs</h1>
      <NavLink to={`/projects/${id}/addBug`} className='px-3 py-2 bg-red-400 rounded-full font-bold text-white'>+ Report Bug in Project</NavLink>
      <table className="mt-8 bg-white rounded-2xl w-full shadow-md">
            <thead>
                <tr className="border-b text-2xl bg-white text-left rounded-2xl">
                    <th className="p-4">Title</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Action</th>
                </tr>
            </thead>
            <tbody>
                {bugs.length > 0 ? (
                    bugs.map((bug) => (
                        <tr key={bug.id} className="hover:bg-gray-100 font-bold">
                            <NavLink to={`/projects/${id}/bugs/${bug.id}`}>
                              <td className="p-4">{bug.title}</td>
                            </NavLink>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-white ${
                                bug.status === 'TO DO' ? 'bg-gray-500' :
                                bug.status === 'IN PROGRESS' ? 'bg-blue-500' :
                                bug.status === 'DONE' ? 'bg-green-500' : 'bg-black'
                              }`}>
                                {bug.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-white ${
                                bug.priority === 'LOW' ? 'bg-green-500' :
                                bug.priority === 'MEDIUM' ? 'bg-yellow-500' :
                                bug.priority === 'HIGH' ? 'bg-red-500' : 'bg-black'
                              }`}>
                                {bug.priority}
                              </span>
                            </td>
                            <td className="p-4">{bug.duedate.split('T')[0]}</td>
                            <td className="p-4 text-red-500 cursor-pointer hover:text-red-700"><button onClick={() => deleteBug(bug.id)}>Delete</button></td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-500">
                            No bugs found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>

    </div>
  )
}

export default Bugs