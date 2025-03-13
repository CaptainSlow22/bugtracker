import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);



const Stats = () => {
  const {id} = useParams();
  const [bugs, setBugs] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
          const fetchMembers = async () => {
              try {
                  const res = await fetch(`http://localhost:8080/projects/${id}/members`);
                  const data = await res.json();
                  console.log(data);
                  setMembers(data);
              } catch (error) {
                  console.log(error);
              }
          };
  
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
  
          fetchMembers();
          fetchBugs();
  }, []);

  const bugStatusCounts = useMemo(() => {
    const counts = { "TO DO": 0, "IN PROGRESS": 0, "DONE": 0 };

    bugs.forEach((bug) => {
      if (counts[bug.status] !== undefined) {
        counts[bug.status]++;
      }
    });

    return Object.values(counts);
  }, [bugs]);

  const statusData = {
    labels: ["TO DO", "IN PROGRESS", "DONE"],
    datasets: [
      {
        label: 'Bug Status Distribution',
        data: bugStatusCounts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const priorityData = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };

    bugs.forEach((bug) => {
      if (counts[bug.priority] !== undefined) {
        counts[bug.priority]++;
      }
    });

    return {
      labels: ['LOW', 'MEDIUM', 'HIGH'],
      datasets: [
        {
          label: 'Bug Count',
          data: [counts.LOW, counts.MEDIUM, counts.HIGH],
          backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(255, 99, 132, 0.5)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        },
      ],
    };
  }, [bugs]);

  const bugAssignments = useMemo(() => {
    const counts = {};
    
    members.forEach((member) => {
      counts[member.id] = 0;
    });

    bugs.forEach((bug) => {
      if (counts[bug.asignee] !== undefined) {
        counts[bug.asignee]++;
      }
    });

    return counts;
  }, [bugs, members]);
    
  const bugAssignmentData = {
    labels: members.map((m) => `${m.firstname} ${m.lastname}`),
    datasets: [
      {
        label: 'Bugs Assigned',
        data: members.map((m) => bugAssignments[m.id] || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const { totalBugs, resolvedBugs } = useMemo(() => {
    const total = bugs.length;
    const resolved = bugs.filter((bug) => bug.status === 'DONE').length;

    return { totalBugs: total, resolvedBugs: resolved };
  }, [bugs]);

  const bugResolutionData = {
    labels: ['Bugs Reported', 'Bugs Resolved'],
    datasets: [
      {
        label: 'Count',
        data: [totalBugs, resolvedBugs],
        backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const bugsByDateData = useMemo(() => {
    const counts = {};

    bugs.forEach((bug) => {
      const date = new Date(bug.createdat).toISOString().split('T')[0]; 
      counts[date] = (counts[date] || 0) + 1;
    });

    const dates = Object.keys(counts).sort();
    const values = dates.map((date) => counts[date]);

    return {
      labels: dates,
      datasets: [
        {
          label: 'Bugs Reported',
          data: values,
          fill: true, 
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.3, 
          pointRadius: 4,
        },
      ],
    };
  }, [bugs]);

  return (
    <div>
      <h1 className='text-4xl font-black mb-6'>Statistics</h1>
      <div className='px-8'>
        <div className="flex space-x-60 mb-30 h-[250px]">
          <div>
            <h3 className='text-2xl font-bold mb-3'>Bugs by Status</h3>
            <Doughnut data={statusData} />
          </div>
          <div>
            <h3 className='text-2xl font-bold mb-3'>Bugs by Priority</h3>
            <Doughnut data={priorityData}/>
          </div>
        </div>
        <div className='flex space-x-36 h-[300px]'>
          <div>
            <h3 className='text-2xl font-bold mb-3'>Bugs reported vs Bugs resolved</h3>
            <Bar data={bugResolutionData} />
          </div>
          <div>
            <h3 className='text-2xl font-bold mb-3'>Bugs by Member</h3>
            <Bar data={bugAssignmentData} />
          </div>
        </div>
        <div className='h-[300px]'>
          <h3 className='text-2xl font-bold mb-3'>Bugs Reported Timeline</h3>
          <Line data={bugsByDateData} />
        </div>
      </div>
    </div>
  )
}

export default Stats