import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';

const VITE_API_URL = import.meta.env.VITE_API_URL || "https://d11ffcb0dwbou3.cloudfront.net";
const VITE_RUNTIME = import.meta.env.VITE_RUNTIME || 'local';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'localadmin123';

function AdminContent() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pend');
  const [isPollingError, setIsPollingError] = useState(false);
  const fetchingRef = useRef(false);
  const intervalRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const POLL_INTERVAL = 5000;
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate magical gold particles
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      duration: Math.random() * 15 + 10 + 's',
      delay: Math.random() * 10 + 's',
      size: Math.random() * 2 + 1 + 'px'
    }));
    setParticles(newParticles);
  }, []);

  const getHeaders = async () => {
    if (VITE_RUNTIME === 'lambda') {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (!token) throw new Error('Access denied. Unauthorized.');
      return { 'Authorization': `Bearer ${token}` };
    }
    return { 'x-admin-password': ADMIN_PASS };
  };

  const fetchQuestions = async (isPolling = false) => {
    if (!isPolling) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions`, { headers });

      if (res.status === 401) {
        setError('Access denied. Unauthorized.');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const sorted = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.ts) - new Date(a.ts));
        
        setQuestions(sorted);
        consecutiveErrorsRef.current = 0;
        setIsPollingError(false);
      } else {
        throw new Error(`UPLINK_ERROR: ${res.statusText}`);
      }
    } catch (err) {
      if (!isPolling) {
        setError(err.message === 'Access denied. Unauthorized.' ? err.message : `CONNECTION_FAILURE: ${err.message}`);
      } else {
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 3) setIsPollingError(true);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    fetchQuestions().finally(() => { fetchingRef.current = false; });

    intervalRef.current = setInterval(() => { fetchQuestions(true); }, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}/status`, { 
        method: 'PATCH', 
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.status === 401) { setError('Access denied. Unauthorized.'); return; }
      if (res.ok) {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, stat: status } : q));
      }
    } catch (err) { alert('ACTION_FAILED: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This question will be permanently deleted.")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}`, { method: 'DELETE', headers });
      if (res.status === 401) { setError('Access denied. Unauthorized.'); return; }
      if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) { alert('PURGE_FAILED: ' + err.message); }
  };

  if (loading) {
    return (
      <div className="container mt-40 text-center z-10 relative">
        <div className="animate-pulse cinzel text-xl text-[#FFD700] font-black tracking-widest">
          ⚡ Connecting to the cloud...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-20 max-w-md mx-auto z-10 relative px-4">
        <div className="magic-border p-1 bg-[#FF4444]/20">
          <div className="magic-border-inner bg-[#0A0800]/90 p-8 rounded-sm text-center">
            <h2 className="text-[#FF4444] cinzel font-black mb-4 tracking-widest uppercase">System Error</h2>
            <p className="text-[#FFFDF0] mb-6 font-serif text-sm">{error}</p>
            <button onClick={() => fetchQuestions()} className="wax-seal px-8 py-3 cinzel font-bold text-xs uppercase tracking-widest">Restore Link</button>
          </div>
        </div>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => q.stat === activeTab);

  const emptyMessages = {
    pend: "No pending questions.",
    apprv: "No approved questions yet.",
    flag: "No hidden questions."
  };

  const getStatusBadge = (stat) => {
    switch(stat) {
      case 'pend': return <span className="text-[10px] bg-[#B8860B]/20 text-[#FFD700] px-2 py-0.5 rounded border border-[#B8860B]/40 uppercase tracking-tighter">Pending ⏳</span>;
      case 'apprv': return <span className="text-[10px] bg-[#00FF88]/10 text-[#00FF88] px-2 py-0.5 rounded border border-[#00FF88]/30 uppercase tracking-tighter">Live ✅</span>;
      case 'flag': return <span className="text-[10px] bg-[#FF4444]/10 text-[#FF4444] px-2 py-0.5 rounded border border-[#FF4444]/30 uppercase tracking-tighter">Hidden 🚫</span>;
      default: return null;
    }
  };

  return (
    <div className="container max-w-[800px] mx-auto py-10 px-4 relative z-10">
      {/* Background Particles */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animation: `floatUp ${p.duration} linear infinite`, animationDelay: p.delay }} />
      ))}

      {isPollingError && (
        <div className="mb-8 bg-[#FF4444]/20 border border-[#FF4444] p-3 rounded flex items-center justify-between text-[#FFFDF0] text-xs cinzel tracking-widest animate-pulse">
          <span className="flex items-center">
            <span className="mr-2">⚡</span> Uplink stability critical...
          </span>
          <button onClick={() => fetchQuestions()} className="underline font-bold">RE-STABILIZE</button>
        </div>
      )}

      <div className="sticky top-[60px] bg-[#0A0800]/90 backdrop-blur-md z-30 pb-4 mb-8 border-b border-[#B8860B]">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#FFD700] cinzel tracking-widest">
              CL⚡UDED — Control Tower
            </h1>
            <p className="text-[#FFD700] cinzel text-[10px] tracking-[0.3em] uppercase mt-2 opacity-80">
              CNAG-CICS Question Dashboard
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center text-[#C8A951] cinzel text-[10px] tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD700] mr-2 shadow-[0_0_8px_rgba(255,215,0,0.6)] animate-pulse"></span>
              <span>🕯️ Watching for questions...</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-[#B8860B]/20">
          <button 
            onClick={() => setActiveTab('pend')}
            className={`pb-2 cinzel text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${activeTab === 'pend' ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-[#C8A951] opacity-50 hover:opacity-100'}`}
          >
            Pending Questions ({questions.filter(q => q.stat === 'pend').length})
          </button>
          <button 
            onClick={() => setActiveTab('apprv')}
            className={`pb-2 cinzel text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${activeTab === 'apprv' ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-[#C8A951] opacity-50 hover:opacity-100'}`}
          >
            Live Questions ({questions.filter(q => q.stat === 'apprv').length})
          </button>
          <button 
            onClick={() => setActiveTab('flag')}
            className={`pb-2 cinzel text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${activeTab === 'flag' ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-[#C8A951] opacity-50 hover:opacity-100'}`}
          >
            Hidden Questions ({questions.filter(q => q.stat === 'flag').length})
          </button>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="py-32 text-center parchment-scroll magic-border p-1 bg-[#1A1200]/30 rounded-sm">
          <span className="text-6xl block mb-6 animate-pulse opacity-20">⚡</span>
          <h2 className="text-xl font-black text-[#FFD700] cinzel tracking-widest">{emptyMessages[activeTab]}</h2>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="parchment-scroll magic-border p-1 rounded-sm group hover:scale-[1.01] transition-transform duration-300">
              <div className="magic-border-inner bg-[#1A1200]/80 overflow-hidden shadow-xl border-l-4 border-l-[#B8860B] group-hover:border-l-[#FFD700]">
                <div className="p-6 border-b border-[#B8860B] bg-black/20 flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-[#FFFDF0] cinzel tracking-widest text-lg flex items-center">
                      {q.name || 'Anonymous Student'}
                    </h3>
                    <p className="text-xs text-[#FFD700] cinzel tracking-widest mt-2 flex items-center opacity-80 uppercase">
                      <span className="mr-3 opacity-60 italic font-serif lowercase text-[#C8A951]">section:</span> {q.courseSection}
                    </p>
                    <div className="mt-3">{getStatusBadge(q.stat)}</div>
                  </div>
                  <div className="text-right">
                    <small className="text-[#C8A951] cinzel text-[10px] uppercase tracking-widest block opacity-60">
                      {new Date(q.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                    <small className="text-[#C8A951] cinzel text-[8px] tracking-widest opacity-40">
                      {new Date(q.ts).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                
                <div className="p-8 relative bg-black/10">
                  <p className="text-lg text-[#FFFDF0] leading-relaxed italic font-serif whitespace-pre-wrap">
                    "{q.question}"
                  </p>
                </div>

                <div className="p-4 bg-black/40 border-t border-[#B8860B] flex justify-end space-x-4">
                  {q.stat !== 'apprv' && (
                    <button 
                      onClick={() => updateStatus(q.id, 'apprv')}
                      className="wax-seal px-6 py-2 cinzel font-black text-[10px] tracking-widest uppercase rounded-sm"
                    >
                      Approve ✅
                    </button>
                  )}
                  {q.stat !== 'flag' && (
                    <button 
                      onClick={() => updateStatus(q.id, 'flag')}
                      className="px-6 py-2 border border-[#B8860B] text-[#FFD700] cinzel font-black text-[10px] tracking-widest uppercase rounded-sm hover:bg-[#B8860B]/20"
                    >
                      Hide 🚫
                    </button>
                  )}
                  <button 
                    onClick={() => updateStatus(q.id, 'done')}
                    className="px-6 py-2 border border-[#B8860B] text-[#C8A951] cinzel font-black text-[10px] tracking-widest uppercase rounded-sm"
                  >
                    Archive
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    className="px-4 py-2 border border-[#FF4444] text-[#FF4444] cinzel font-black text-[10px] tracking-widest uppercase hover:bg-[#FF4444] hover:text-white transition-all duration-300 rounded-sm"
                  >
                    🗑
                  </button>
                </div>
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
      alert('Access denied. Unauthorized.');
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
          <main className="min-h-screen relative overflow-hidden bg-[#0A0800]">
            <div className="bg-[#0A0800] border-b border-[#B8860B] px-4 py-3 flex justify-between items-center shadow-2xl sticky top-0 z-[100]">
              <Link to="/" className="text-[#FFD700] cinzel font-black tracking-widest text-xs hover:underline">← Home</Link>
              <div className="flex items-center">
                <span className="mr-6 text-[10px] text-[#C8A951] cinzel tracking-widest italic hidden sm:block">USER_AUTH: {user?.username}</span>
                <button onClick={signOut} className="wax-seal px-4 py-1.5 cinzel font-black text-[9px] tracking-[0.2em] rounded-sm uppercase">Logout</button>
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
      <div className="container flex items-center justify-center min-h-screen px-4 bg-[#0A0800]">
        <div className="w-full max-w-md z-10">
          <div className="magic-border p-1 rounded-sm shadow-[0_0_60px_rgba(255,215,0,0.1)]">
            <div className="magic-border-inner bg-[#0A0800] p-10 rounded-sm text-center">
              <h1 className="text-3xl font-black mb-8 text-[#FFD700] cinzel tracking-[0.2em] uppercase">Control Tower Login</h1>
              <form onSubmit={handleLocalLogin} className="space-y-8">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="[ENTER_CREDENTIALS]"
                  className="ink-field w-full p-4 rounded-sm cinzel text-sm placeholder:text-[#C8A951]/40 tracking-widest text-center"
                />
                <button type="submit" className="wax-seal w-full py-4 cinzel font-black text-xs tracking-[0.3em] uppercase rounded-sm text-center">Enter Dashboard</button>
              </form>
              <Link to="/" className="text-[#C8A951] cinzel text-[10px] tracking-widest hover:underline mt-8 block font-medium opacity-60">Back to Site</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0A0800]">
      <div className="bg-[#0A0800] border-b border-[#B8860B] px-4 py-3 flex justify-between items-center shadow-2xl sticky top-0 z-[100]">
        <Link to="/" className="text-[#FFD700] cinzel font-black tracking-widest text-xs hover:underline">← Home</Link>
        <button onClick={handleLogout} className="wax-seal px-4 py-1.5 cinzel font-black text-[9px] tracking-[0.2em] rounded-sm uppercase">Logout</button>
      </div>
      <AdminContent />
    </main>
  );
}

export default Admin;
