import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'localadmin123';

function Admin() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('adminAuth');
    if (stored === 'true') {
      setAuthenticated(true);
      fetchQuestions();
    }
  }, []);

  const fetchQuestions = async () => {
    const headers = { 'x-admin-password': ADMIN_PASS };
    const [pendingRes, approvedRes] = await Promise.all([
      fetch(`${VITE_API_URL}/questions/pending`, { headers }),
      fetch(`${VITE_API_URL}/questions/approved`, { headers })
    ]);
    if (pendingRes.ok) setPending(await pendingRes.json());
    if (approvedRes.ok) setApproved(await approvedRes.json());
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      localStorage.setItem('adminAuth', 'true');
      setAuthenticated(true);
      fetchQuestions();
    } else {
      alert('Invalid password');
    }
  };

  const handleApprove = async (id) => {
    await fetch(`${VITE_API_URL}/questions/approve/${id}`, {
      method: 'POST',
      headers: { 'x-admin-password': ADMIN_PASS }
    });
    fetchQuestions();
  };

  const handleHide = async (id) => {
    await fetch(`${VITE_API_URL}/questions/hide/${id}`, {
      method: 'POST',
      headers: { 'x-admin-password': ADMIN_PASS }
    });
    fetchQuestions();
  };

  const handleDelete = async (id) => {
    await fetch(`${VITE_API_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': ADMIN_PASS }
    });
    fetchQuestions();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setAuthenticated(false);
    navigate('/');
  };

  if (!authenticated) {
    return (
      <div className="container">
        <div className="card max-w-md mx-auto mt-20">
          <h1 className="text-xl font-bold mb-4">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-3 border rounded mb-4"
            />
            <button type="submit" className="btn w-full">Login</button>
          </form>
          <Link to="/" className="text-blue-600 hover:underline mt-4 block">Back to Site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div>
          <Link to="/" className="text-blue-600 hover:underline mr-4">Back to Site</Link>
          <button onClick={handleLogout} className="btn bg-gray-600">Logout</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-gray-500">No pending questions.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((q) => (
                <div key={q.id} className="p-4 bg-yellow-50 rounded border-l-4 border-yellow-500">
                  <p>{q.txt}</p>
                  <div className="mt-2 space-x-2">
                    <button onClick={() => handleApprove(q.id)} className="btn btn-approve text-sm">Approve</button>
                    <button onClick={() => handleHide(q.id)} className="btn btn-hide text-sm">Hide</button>
                    <button onClick={() => handleDelete(q.id)} className="btn btn-delete text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Approved ({approved.length})</h2>
          {approved.length === 0 ? (
            <p className="text-gray-500">No approved questions.</p>
          ) : (
            <div className="space-y-3">
              {approved.map((q) => (
                <div key={q.id} className="p-4 bg-green-50 rounded border-l-4 border-green-500">
                  <p>{q.txt}</p>
                  <small className="text-gray-500">{new Date(q.ts).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
