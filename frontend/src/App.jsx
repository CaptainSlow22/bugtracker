import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Projects from './components/Projects';
import AddProject from './components/AddProject';
import ProjectLayout from './components/ProjectLayout';
import Bugs from './components/Bugs';
import Stats from './components/Stats';
import Dashboard from './components/Dashboard';
import { AuthProvider } from './components/AuthContext';
import AddMember from './components/addMember';
import AddBug from './components/AddBug';
import Bug from './components/Bug';
import Register from './components/Register';
import Calendar from './components/Calendar';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/projects' element={<Projects />} />
          <Route path='/projects/newProject' element={<AddProject />} />
          <Route path='/projects/:id' element={<ProjectLayout />}>
            <Route path='addMember' element={<AddMember/>} />
            <Route path='addBug' element={<AddBug/>} />
            <Route path='bugs' element={<Bugs />} />
            <Route path='bugs/:bugId' element={<Bug />} />
            <Route path='stats' element={<Stats />} />
            <Route path='dashboard' element={<Dashboard />} />
            <Route path='calendar'  element={<Calendar/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
