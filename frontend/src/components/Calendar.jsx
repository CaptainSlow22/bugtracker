import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const Calendar = () => {
    const { id } = useParams();
    const [bugs, setBugs] = useState([]);

    useEffect(() => {
        const fetchBugs = async () => {
            try {
                const res = await fetch(`http://localhost:8080/projects/${id}/bugs`);
                const data = await res.json();
                console.log(data);
                setBugs(data.bugs);
            } catch (error) {
                console.error(error);
            }
        };
    
        fetchBugs();
    }, []);

  return (
    <div>
        <h1 className="text-4xl font-black mb-6">Calendar</h1>
        <FullCalendar
            height={650}
            plugins={[ dayGridPlugin ]}
            initialView="dayGridMonth"
            weekends={true}
            events={bugs.map((bug) => (
                {title: bug.title, start: bug.createdat.split("T")[0], end: bug.duedate.split("T")[0]}
            ))}
        />
    </div>
  )
}

export default Calendar