import React from 'react'

const Footer = () => {
  return (
    <div className="text-white bg-gradient-to-tr from-gray-900 to-gray-800 m-6 rounded-2xl">
        <div className="flex">
          <div className="flex-1">
            <p className="text-3xl font-black p-16">BugTracker @ 2025</p>
          </div>
          <div className="grid items-start grid-cols-2 gap-y-2 p-4 mt-16 px-32 pb-16">
            <div className="text-white space-x-3 space-y-2 px-12">
              <p className="font-black text-xl">Our Products</p>
              <p>Task Calendar</p>
              <p>Analytics</p>
              <p>Project Dashboard</p>
            </div>
            <div className="text-white space-x-3 space-y-2 px-12">
              <p className="font-black text-xl">Company</p>
              <p>About Us</p>
              <p>Terms of Service</p>
            </div>
            <div className="text-white space-x-3 space-y-2 px-12">
              <p className="font-black text-xl">Resources</p>
              <p>Blog</p>
            </div>
          </div>
        </div> 
      </div>
  )
}

export default Footer