import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom';

const Register = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const res = await fetch("http://localhost:8080/members/register", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password
                })
            });
            
            if(res.ok) {
                alert("Member registered successfully!");
                navigate("/login");
            }

        } catch(error) {
            setError("Please entry all the required fields!");
            console.log(error);
        }
      };

  return (
    <div className='bg-gray-100 flex flex-col space-y-8 h-screen justify-center items-center'>
        <div className='text-4xl font-black'>
            <h1>Sign up for a member account</h1>
        </div>
        <div className='bg-white shadow-lg p-10 rounded-xl'>
            <form onSubmit={handleSubmit} className='flex flex-col space-y-8'>
                <input onChange={(e) => setFirstName(e.target.value)} type='text' placeholder='First Name' className='p-2 shadow-inne bg-gray-100 w-[300px] rounded-xl' />
                <input onChange={(e) => setLastName(e.target.value)} type='text' placeholder='Last Name' className='p-2 shadow-inne bg-gray-100 w-[300px] rounded-xl' />
                <input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="p-2 shadow-inne bg-gray-100 w-[300px] rounded-xl" />
                <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="p-2 shadow-inner bg-gray-100 w-[300px] rounded-xl"/>
                <button className='px-4 py-2 bg-blue-700 text-white font-bold rounded-full'>Sign Up</button>
                {error && (
                    <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
                    {error}
                    </div>
                )}
            </form>         
        </div>
        <span>Already have an account? <NavLink to='/login' className='font-bold'>Log in</NavLink></span>   
    </div>
  )
}

export default Register