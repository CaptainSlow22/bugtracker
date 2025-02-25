import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Projects from './components/Projects'

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/projects' element={<Projects/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
