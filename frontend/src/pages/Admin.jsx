import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function Admin() {
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchPendingQuestions(token);
  }, [navigate]);

  const fetchPendingQuestions = async (token) => {
    try {
      const res = await fetch(`${API_URL}/admin/questions/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/login');
        return;
      }

      const data = await res.json();
      setPendingQuestions(data);
    } catch (err) {
      setError('Failed to load questions');
    }
  };

  const handleApprove = async (id) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/admin/questions/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setPendingQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      setError('Failed to approve question');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setPendingQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      setError('Failed to delete question');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="container">
      <div className="nav">
        <h1>Admin Dashboard</h1>
        <div>
          <Link to="/" style={{ marginRight: '16px' }}>Back to Site</Link>
          <button onClick={handleLogout} style={{ background: '#6c757d' }}>
            Logout
          </button>
        </div>
      </div>

      <div className="form-container">
        <h2>Pending Questions ({pendingQuestions.length})</h2>
        {pendingQuestions.length === 0 ? (
          <p>No pending questions.</p>
        ) : (
          <div className="questions-list">
            {pendingQuestions.map((q) => (
              <div key={q.id} className="question-card pending">
                <p>{q.text}</p>
                <small>Submitted: {new Date(q.createdAt).toLocaleString()}</small>
                <div className="question-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(q.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(q.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="toast">{error}</div>}
    </div>
  );
}

export default Admin;
