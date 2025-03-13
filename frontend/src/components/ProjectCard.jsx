import React from 'react'

const ProjectCard = ({title, description}) => {
  return (
    <div className='flex bg-white rounded-2xl shadow-xl'>
        <div>
            <img className='rounded-l-2xl' src='https://mosaicprojects.com.au/Images/ProjectType.png' height={300} width={300}/>
        </div>
        <div className='p-3'>
            <h3 className='font-black'>{title}</h3>
            <p className='text-gray-500'>{description}</p>
        </div>
    </div>
  )
}

export default ProjectCard