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
  const [isPollingError, setIsPollingError] = useState(false);
  const fetchingRef = useRef(false);
  const intervalRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const POLL_INTERVAL = 5000;
  const [clouds, setClouds] = useState([]);

  useEffect(() => {
    const newClouds = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      top: Math.random() * 80 + '%',
      duration: Math.random() * 25 + 15 + 's',
      delay: Math.random() * 10 + 's',
      size: Math.random() * 150 + 50 + 'px'
    }));
    setClouds(newClouds);
  }, []);

  const getHeaders = async () => {
    if (VITE_RUNTIME === 'lambda') {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (!token) throw new Error('Authentication failure. Re-login required.');
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
        setError('SESSION EXPIRED. RE-AUTHENTICATE SYSTEM.');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const sorted = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.ts) - new Date(a.ts));
        
        setQuestions(prev => {
          const prevIds = prev.map(q => q.id).join(',');
          const newIds = sorted.map(q => q.id).join(',');
          if (prevIds === newIds) return prev;
          return sorted;
        });

        consecutiveErrorsRef.current = 0;
        setIsPollingError(false);
      } else {
        throw new Error(`SYSTEM_ERROR: ${res.statusText}`);
      }
    } catch (err) {
      if (!isPolling) {
        setError(`UPLINK_FAILURE: ${err.message}`);
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

  const handleDone = async (id) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}/done`, { method: 'PATCH', headers });
      if (res.status === 401) { setError('AUTH_TIMEOUT'); return; }
      if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) { alert('ACTION_FAILED: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("PURGE DATA? THIS ACTION CANNOT BE UNDONE.")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}`, { method: 'DELETE', headers });
      if (res.status === 401) { setError('AUTH_TIMEOUT'); return; }
      if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) { alert('PURGE_FAILED: ' + err.message); }
  };

  if (loading) {
    return (
      <div className="container mt-40 text-center z-10 relative">
        <div className="animate-pulse orbitron text-xl text-[#00BFFF] font-black tracking-widest">
          ⚡ ACCESSING CLOUD_DATABASE...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-20 max-w-md mx-auto z-10 relative px-4">
        <div className="glass-card p-1 bg-[#8B0000]/20">
          <div className="bg-[#1a1a2e]/90 p-8 rounded-sm text-center">
            <h2 className="text-[#C0392B] orbitron font-black mb-4 tracking-tighter uppercase">Security Breach / Error</h2>
            <p className="text-white mb-6 font-mono text-xs">{error}</p>
            <button onClick={() => fetchQuestions()} className="tech-button px-8 py-3 text-xs">Re-Connect</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[850px] mx-auto py-10 px-4 relative z-10">
      {/* Background Storm */}
      <div className="lightning-flash" />
      {clouds.map(c => (
        <div key={c.id} className="cloud-particle" style={{ top: c.top, width: c.size, height: c.size, animation: `cloudDrift ${c.duration} linear infinite`, animationDelay: c.delay }} />
      ))}

      {isPollingError && (
        <div className="mb-8 bg-[#8B0000]/20 border border-[#8B0000] p-3 rounded flex items-center justify-between text-white text-[10px] orbitron tracking-widest animate-pulse">
          <span className="flex items-center">
            <span className="mr-2">⚡</span> UPLINK STABILITY CRITICAL...
          </span>
          <button onClick={() => fetchQuestions()} className="underline font-bold">RE-STABILIZE</button>
        </div>
      )}

      <div className="sticky top-[60px] bg-[#0A0810]/90 backdrop-blur-md z-30 pb-6 mb-10 border-b border-[#2a2a4e]">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-white orbitron tracking-tighter">
              CL<span className="text-[#00BFFF]">⚡</span>UDED
            </h1>
            <p className="text-[#666688] font-bold text-[10px] tracking-[0.3em] uppercase mt-2">
              System Control Tower
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center text-[#00BFFF] font-bold text-[10px] tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] mr-2 shadow-[0_0_8px_rgba(0,255,136,0.6)] animate-pulse"></span>
              <span>LIVE_RADAR</span>
            </div>
            <span className="status-badge badge-blue">
              {questions.length} DATA_PACKETS_PENDING
            </span>
          </div>
        </div>
      </div>

      <div className="text-center mb-12 flex justify-center items-center space-x-4">
        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#2a2a4e]" />
        <span className="text-[#666688] font-bold text-[10px] tracking-[0.5em] uppercase">Incoming Inquiries</span>
        <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#2a2a4e]" />
      </div>

      {questions.length === 0 ? (
        <div className="py-32 text-center glass-card bg-[#1a1a2e]/30 rounded-sm">
          <span className="text-6xl block mb-6 animate-pulse opacity-20">☁️</span>
          <h2 className="text-xl font-bold text-white orbitron tracking-widest">CLOUD_SYNC_COMPLETE</h2>
          <p className="text-[#666688] mt-4 font-mono text-xs uppercase tracking-widest">No active threats or inquiries detected.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q) => (
            <div key={q.id} className="glass-card p-1 rounded-sm group hover:border-[#00BFFF]/50 transition-all duration-500">
              <div className="bg-[#1a1a2e]/80 overflow-hidden border-l-4 border-l-[#8B0000] group-hover:border-l-[#00BFFF]">
                <div className="p-6 border-b border-[#2a2a4e] bg-black/40 flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-white orbitron tracking-tighter text-lg flex items-center">
                      <span className="mr-3 text-[#00BFFF] opacity-60">ID:</span> {q.name || 'ANONYMOUS_USER'}
                    </h3>
                    <p className="text-[10px] text-[#00BFFF] font-bold tracking-widest mt-2 flex items-center opacity-80 uppercase">
                      <span className="mr-3 text-[#666688] opacity-60 font-mono">SECTOR:</span> {q.courseSection}
                    </p>
                  </div>
                  <div className="text-right">
                    <small className="text-[#666688] font-mono text-[10px] uppercase block">
                      {new Date(q.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                    <small className="text-[#666688] font-mono text-[8px] opacity-40">
                      {new Date(q.ts).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                
                <div className="p-8 relative bg-black/20">
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-[#666688] opacity-20">RAW_DATA_LOG</div>
                  <p className="text-lg text-white leading-relaxed font-semibold whitespace-pre-wrap">
                    "{q.question}"
                  </p>
                </div>

                <div className="p-4 bg-black/40 border-t border-[#2a2a4e] flex justify-end space-x-4">
                  <button 
                    onClick={() => handleDone(q.id)}
                    className="tech-button px-6 py-2 text-[10px] rounded-sm bg-transparent border-[#00BFFF] text-[#00BFFF] hover:bg-[#00BFFF] hover:text-black"
                  >
                    RESOLVE
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    className="px-4 py-2 border border-[#8B0000] text-[#C0392B] orbitron font-black text-[10px] tracking-widest uppercase hover:bg-[#8B0000] hover:text-white transition-all duration-300 rounded-sm"
                  >
                    PURGE
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
      alert('ACCESS_DENIED: INVALID_CREDENTIALS');
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
          <main className="min-h-screen relative overflow-hidden bg-[#0A0810]">
            <div className="bg-[#1a1a2e] border-b border-[#2a2a4e] px-4 py-3 flex justify-between items-center shadow-2xl sticky top-0 z-[100]">
              <Link to="/" className="text-[#00BFFF] orbitron font-black tracking-widest text-[10px] hover:underline">← EXIT_TERMINAL</Link>
              <div className="flex items-center">
                <span className="mr-6 text-[10px] text-[#666688] font-bold tracking-widest italic hidden sm:block">USER_AUTH: {user?.username}</span>
                <button onClick={signOut} className="tech-button px-4 py-1.5 text-[9px] rounded-sm">LOCK_STATION</button>
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
      <div className="container flex items-center justify-center min-h-screen px-4 bg-[#0A0810]">
        <div className="w-full max-w-md z-10">
          <div className="glass-card p-1 rounded-sm shadow-[0_0_60px_rgba(0,191,255,0.1)]">
            <div className="bg-[#1a1a2e] p-10 rounded-sm text-center">
              <h1 className="text-3xl font-black mb-8 text-white orbitron tracking-tighter">ACCESS_PORTAL</h1>
              <form onSubmit={handleLocalLogin} className="space-y-8">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="[ENTER_PASSCODE]"
                  className="tech-input w-full p-4 rounded-sm font-bold text-sm tracking-widest text-center"
                />
                <button type="submit" className="tech-button w-full py-4 text-xs">INITIATE_AUTH</button>
              </form>
              <Link to="/" className="text-[#666688] font-bold text-[10px] tracking-widest hover:underline mt-8 block opacity-60">← TERMINATE_SESSION</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0A0810]">
      <div className="bg-[#1a1a2e] border-b border-[#2a2a4e] px-4 py-3 flex justify-between items-center shadow-2xl sticky top-0 z-[100]">
        <Link to="/" className="text-[#00BFFF] orbitron font-black tracking-widest text-[10px] hover:underline">← EXIT_TERMINAL</Link>
        <button onClick={handleLogout} className="tech-button px-4 py-1.5 text-[9px] rounded-sm">LOCK_STATION</button>
      </div>
      <AdminContent />
    </main>
  );
}

export default Admin;
