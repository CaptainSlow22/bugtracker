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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/projects' element={<Projects />} />
          <Route path='/projects/newProject' element={<AddProject />} />
          <Route path='/projects/:id' element={<ProjectLayout />}>
            <Route path='addMember' element={<AddMember/>} />
            <Route path='bugs' element={<Bugs />} />
            <Route path='stats' element={<Stats />} />
            <Route path='dashboard' element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
