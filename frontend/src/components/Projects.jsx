import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';

const Projects = () => {
    const { token, loading } = useContext(AuthContext);
   
    const navigate = useNavigate();


    if (loading) {
        return null;
    }

    if (!token) {
        navigate("/login");
    }

  return (
    <div>Projects</div>
  )
}

export default Projects