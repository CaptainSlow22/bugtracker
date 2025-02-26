import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Projects from './components/Projects';
import AddProject from './components/AddProject';
import ProjectPage from './components/ProjectPage';
import { AuthProvider } from './components/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/projects' element={<Projects />} />
          <Route path='/projects/newProject' element={<AddProject />} />
          <Route path='/projects/:id/bugs' element={<ProjectPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
