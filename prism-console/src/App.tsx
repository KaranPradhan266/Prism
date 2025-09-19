import { Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/login';
import Welcome from './components/Welcome';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/welcome" element={<Welcome />} />
    </Routes>
  );
}

export default App;
