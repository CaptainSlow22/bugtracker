import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

const sections = [
  { image: "/calendar.png", alt: "Bug due dates displayed in a calendar", title: "Calendar View – Stay on Top of Deadlines", text: "Track bug reports and due dates. Plan your work and keep deadlines visible." },
  { image: "/stats.png", alt: "Charts showing bug statistics", title: "Statistics & Insights", text: "Review bug trends, status, priority, and assignments for each project." },
  { image: "/dashboard.png", alt: "Project dashboard", title: "Project Dashboard", text: "See project members and bugs grouped by workflow status." },
  { image: "/bugs.png", alt: "A list of tracked bugs", title: "Bug List", text: "Report, search, prioritize, assign, and update bugs with your project team." },
];

export default function Home() {
  return <div className="bg-gradient-to-t from-gray-200 to-gray-100 min-h-screen">
    <header className="flex justify-between items-center py-5 px-6 sm:px-12">
      <h1 className="text-2xl sm:text-3xl font-bold">BugTracker</h1>
      <Link to="/login" className="bg-blue-700 px-4 py-2 rounded-xl text-white">Get Started</Link>
    </header>
    <section className="flex justify-center items-center py-20 px-6 sm:px-16">
      <div className="text-center max-w-5xl"><h2 className="text-4xl sm:text-6xl font-black mb-8">Track, Prioritize, and Fix Bugs</h2><p className="text-lg sm:text-2xl">Stay on top of software issues with bug tracking, project collaboration, and clear reporting.</p></div>
    </section>
    <section className="px-6 sm:px-16 pb-12 space-y-8 max-w-7xl mx-auto">
      {sections.map((item, index) => <article key={item.title} className={`flex flex-col ${index % 2 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 bg-white/70 rounded-2xl p-6`}>
        <img src={item.image} alt={item.alt} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} className="w-full md:w-1/2 max-h-80 object-cover rounded-xl" />
        <div><h3 className="text-2xl font-bold mb-2">{item.title}</h3><p>{item.text}</p></div>
      </article>)}
    </section>
    <Footer />
  </div>;
}