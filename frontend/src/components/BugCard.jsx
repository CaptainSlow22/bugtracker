import React from 'react'

const BugCard = ({title, priority, dueDate}) => {
  return (
    <div className='bg-gray-100 p-6 shadow-lg rounded-2xl'>
        <h1 className='font-black text-lg mb-4'>{title}</h1>
        <div className='flex items-center justify-between'>
            <p className={`px-3 py-1 text-white font-bold rounded-full ${
                              priority === 'LOW' ? 'bg-green-500' :
                              priority === 'MEDIUM' ? 'bg-yellow-500' :
                              priority === 'HIGH' ? 'bg-red-500' : 'text-black'
                            }`}>{priority}</p>
            <p>{dueDate.split("T")[0]}</p>
        </div>
    </div>
  )
}

export default BugCard