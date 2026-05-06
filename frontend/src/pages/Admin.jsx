import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';

const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_RUNTIME = import.meta.env.VITE_RUNTIME || 'local';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'localadmin123';

function AdminContent() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);

  const getHeaders = async () => {
    if (VITE_RUNTIME === 'lambda') {
      const session = await fetchAuthSession();
      console.log('[TOKEN] session:', session);
      
      const token = session?.tokens?.idToken?.toString();
      if (!token) {
        throw new Error('No ID token available. Please sign in again.');
      }
      
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return { 'x-admin-password': ADMIN_PASS };
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[DEBUG] Starting fetchQuestions...');
      await new Promise(r => setTimeout(r, 800));

      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions`, { headers });

      console.log('[DEBUG] Fetch status:', res.status);

      if (res.status === 401) {
        console.error('[DEBUG] 401 Unauthorized detected');
        setError('Session expired or unauthorized. Please refresh the page or sign in again.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        const sorted = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.ts) - new Date(a.ts));
        setQuestions(sorted);
      } else {
        throw new Error(`Failed to load: ${res.statusText}`);
      }
    } catch (err) {
      console.error('[DEBUG] Fetch questions failed:', err);
      setError(`Connection Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    fetchQuestions().finally(() => {
      fetchingRef.current = false;
    });
  }, []);

  const handleDone = async (id) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}/done`, {
        method: 'PATCH',
        headers
      });
      if (res.status === 401) {
        setError('Session expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
      }
    } catch (err) {
      console.error('Done failed:', err);
      alert('Action failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question permanently?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.status === 401) {
        setError('Session expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mt-20 text-center">
        <div className="animate-pulse text-xl text-gray-500 font-medium">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-20 max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <h2 className="text-red-800 font-bold mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchQuestions} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[700px] mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{questions.length} questions waiting</p>
        </div>
        <button onClick={fetchQuestions} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors">Refresh</button>
      </div>

      {questions.length === 0 ? (
        <div className="py-20 text-center">
          <span className="text-5xl block mb-4">🎉</span>
          <h2 className="text-xl font-medium text-gray-600">No questions yet!</h2>
          <p className="text-gray-400 mt-2">All caught up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b bg-gray-50/50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <span className="mr-2">👤</span> {q.name || 'Anonymous'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <span className="mr-2">📚</span> {q.courseSection}
                  </p>
                </div>
                <div className="text-right">
                  <small className="text-gray-400 text-xs uppercase tracking-wider block">
                    {new Date(q.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                  <small className="text-gray-400 text-[10px]">
                    {new Date(q.ts).toLocaleDateString()}
                  </small>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {q.question}
                </p>
              </div>

              <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button 
                  onClick={() => handleDone(q.id)}
                  className="flex-1 max-w-[120px] py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
                >
                  ✓ Done
                </button>
                <button 
                  onClick={() => handleDelete(q.id)}
                  className="flex-1 max-w-[120px] py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors border border-red-200"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setAuthenticated(false);
  };

  if (VITE_RUNTIME === 'lambda') {
    return (
      <Authenticator hideSignUp={true}>
        {({ signOut, user }) => (
          <main className="min-h-screen bg-gray-50">
            <div className="bg-white border-b px-4 py-2 flex justify-between items-center shadow-sm sticky top-0 z-10">
              <Link to="/" className="text-blue-600 font-bold hover:underline">← Home</Link>
              <div className="flex items-center">
                <span className="mr-4 text-xs text-gray-500 italic hidden sm:block">Logged in as {user?.username}</span>
                <button onClick={signOut} className="px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded border border-red-100 hover:bg-red-100">Sign Out</button>
              </div>
            </div>
            <AdminContent />
          </main>
        )}
      </Authenticator>
    );
  }

  if (!authenticated) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="card max-w-md w-full mx-4 shadow-xl border p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLocalLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button type="submit" className="btn w-full py-4 text-lg">Login</button>
          </form>
          <Link to="/" className="text-blue-600 hover:underline mt-6 block text-center font-medium">Back to Site</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <Link to="/" className="text-blue-600 font-bold hover:underline">← Home</Link>
        <button onClick={handleLogout} className="px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded border border-red-100 hover:bg-red-100">Sign Out</button>
      </div>
      <AdminContent />
    </main>
  );
}

export default Admin;
