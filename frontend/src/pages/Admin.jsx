import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_RUNTIME = import.meta.env.VITE_RUNTIME || 'local';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'localadmin123';

function AdminContent() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('AdminContent active. Runtime:', VITE_RUNTIME, 'API:', VITE_API_URL);
    fetchQuestions();
  }, []);

  const getHeaders = async () => {
    if (VITE_RUNTIME === 'lambda') {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken) {
        throw new Error('No ID token available. Please sign in again.');
      }
      return {
        'Authorization': `Bearer ${tokens.idToken.toString()}`
      };
    }
    return { 'x-admin-password': ADMIN_PASS };
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      console.log('[DEBUG] Starting fetchQuestions...');
      // Safety delay for Amplify init
      await new Promise(r => setTimeout(r, 500));

      const headers = await getHeaders();
      console.log('[DEBUG] Headers obtained:', headers.Authorization ? 'Auth present' : 'Auth missing');
      
      const [pendingRes, approvedRes] = await Promise.all([
        fetch(`${VITE_API_URL}/questions/pending`, { headers }),
        fetch(`${VITE_API_URL}/questions/approved`, { headers })
      ]);

      console.log('[DEBUG] Pending status:', pendingRes.status, 'Approved status:', approvedRes.status);

      if (pendingRes.status === 401 || approvedRes.status === 401) {
        console.error('[DEBUG] 401 Unauthorized detected');
        setError('Unauthorized: Access denied. Please ensure you are logged in as an admin.');
        return;
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(Array.isArray(data) ? data : (data.questions || data.data || []));
      }
      if (approvedRes.ok) {
        const data = await approvedRes.json();
        setApproved(Array.isArray(data) ? data : (data.questions || data.data || []));
      }
      setError(null);
    } catch (err) {
      console.error('[DEBUG] Fetch questions failed:', err);
      setError(`Connection Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/approve/${id}`, {
        method: 'POST',
        headers
      });
      if (res.status === 401) {
        setError('Unauthorized');
        return;
      }
      fetchQuestions();
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleHide = async (id) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/hide/${id}`, {
        method: 'POST',
        headers
      });
      if (res.status === 401) {
        setError('Unauthorized');
        return;
      }
      fetchQuestions();
    } catch (err) {
      console.error('Hide failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.status === 401) {
        setError('Unauthorized');
        return;
      }
      fetchQuestions();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) return <div className="container mt-10 text-center">Loading dashboard...</div>;

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center">
          <button onClick={fetchQuestions} className="px-3 py-1 bg-gray-200 rounded mr-4 text-sm hover:bg-gray-300">Refresh</button>
          <Link to="/" className="text-blue-600 hover:underline">Back to Site</Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

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

function Admin() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (VITE_RUNTIME === 'local') {
      const stored = localStorage.getItem('adminAuth');
      if (stored === 'true') setAuthenticated(true);
    }
  }, []);

  const handleLocalLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      localStorage.setItem('adminAuth', 'true');
      setAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  if (VITE_RUNTIME === 'lambda') {
    return (
      <Authenticator hideSignUp={true}>
        {({ signOut, user }) => (
          <main>
            <div className="bg-white border-b p-2 flex justify-end">
              <span className="mr-4 text-sm text-gray-600">Logged in as {user?.username}</span>
              <button onClick={signOut} className="text-sm text-red-600 font-bold">Sign Out</button>
            </div>
            <AdminContent />
          </main>
        )}
      </Authenticator>
    );
  }

  if (!authenticated) {
    return (
      <div className="container">
        <div className="card max-w-md mx-auto mt-20">
          <h1 className="text-xl font-bold mb-4">Admin Login (Local)</h1>
          <form onSubmit={handleLocalLogin}>
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

  return <AdminContent />;
}

export default Admin;
