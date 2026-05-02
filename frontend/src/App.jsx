import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Guest from './pages/Guest';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Guest />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
