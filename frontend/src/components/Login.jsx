import React, { useContext, useState, useEffect } from 'react'
import { AuthContext } from './AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const {setToken, token} = useContext(AuthContext);

    const navigate = useNavigate();

    useEffect(() => {
        if (token || localStorage.getItem("token")) {
            navigate("/projects");
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const res = await fetch("http://localhost:8080/members/login", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const data = await res.json();
            const token = data.jwt;
            setToken(token);
            localStorage.setItem("token", token);
            navigate("/projects");
        } catch(error) {
            setError("Wrong email or password")
            console.log(error);
            setToken(null);
            localStorage.removeItem("token");
        }
      };

  return (
    <div className='bg-gray-100 flex flex-col space-y-8 h-screen justify-center items-center'>
        <div className='text-4xl font-black'>
            <h1>Log into your member account</h1>
        </div>
        <div className='bg-white shadow-lg p-10 rounded-xl'>
            <form onSubmit={handleSubmit} className='flex flex-col space-y-8'>
                <input onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="p-2 shadow-inne bg-gray-100 w-[250px] rounded-xl" />
                <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="p-2 shadow-inner bg-gray-100 w-[250px] rounded-xl"/>
                <button className='px-4 py-2 bg-blue-700 text-white font-bold rounded-full'>Log In</button>
                {error && (
                    <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
                    {error}
                    </div>
                )}
            </form>           
        </div>
        <span>Don't have a member acconut? <NavLink to='/register' className='font-bold'>Register here</NavLink></span> 
    </div>
  )
}

export default Login
