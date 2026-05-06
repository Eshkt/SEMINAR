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
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate magical particles
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
      if (!token) throw new Error('No ID token available. Please sign in again.');
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
        setError('Session expired. Please refresh the page or sign in again.');
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
        throw new Error(`Failed to load: ${res.statusText}`);
      }
    } catch (err) {
      if (!isPolling) {
        setError(`Connection Error: ${err.message}`);
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
      if (res.status === 401) { setError('Session expired. Please sign in again.'); return; }
      if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) { alert('Action failed: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure, Professor? This scroll will be lost to the void.")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${VITE_API_URL}/questions/${id}`, { method: 'DELETE', headers });
      if (res.status === 401) { setError('Session expired. Please sign in again.'); return; }
      if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  if (loading) {
    return (
      <div className="container mt-40 text-center z-10 relative">
        <div className="animate-pulse cinzel text-xl text-[var(--hp-gold)] font-black tracking-widest">
          🪄 Unrolling scrolls...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-20 max-w-md mx-auto z-10 relative px-4">
        <div className="magic-border p-1 bg-[var(--hp-red)]/10">
          <div className="magic-border-inner bg-[var(--hp-dark-wood)] p-8 rounded-sm text-center">
            <h2 className="text-[var(--hp-red)] cinzel font-black mb-4 tracking-widest uppercase">Dark Magic Detected</h2>
            <p className="text-[var(--hp-parchment)] mb-6 cinzel text-sm">{error}</p>
            <button onClick={() => fetchQuestions()} className="wax-seal px-8 py-3 cinzel font-bold text-xs uppercase tracking-widest">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[800px] mx-auto py-10 px-4 relative z-10 bg-[var(--hp-black)]">
      {/* Background Particles */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.left, width: p.size, height: p.size, animation: `float ${p.duration} linear infinite`, animationDelay: p.delay, backgroundColor: 'var(--hp-gold-mid)' }} />
      ))}

      {isPollingError && (
        <div className="mb-8 bg-[var(--hp-red)]/20 border border-[var(--hp-red)] p-3 rounded flex items-center justify-between text-[var(--hp-parchment)] text-xs cinzel tracking-widest animate-pulse">
          <span className="flex items-center">
            <span className="mr-2">💀</span> The connection is fading...
          </span>
          <button onClick={() => fetchQuestions()} className="underline font-bold">Restore link</button>
        </div>
      )}

      <div className="sticky top-[60px] bg-[var(--hp-black)]/90 backdrop-blur-md z-30 pb-6 mb-10 border-b border-[var(--hp-border)]">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[var(--hp-gold-bright)] cinzel tracking-widest">
              🏰 Professor's Study
            </h1>
            <p className="text-[var(--hp-ink)] cinzel text-[10px] tracking-[0.3em] uppercase mt-2">
              Reviewing inquiries from students
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center text-[var(--hp-ink)] cinzel text-[10px] tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] mr-2 shadow-[0_0_8px_rgba(0,255,136,0.6)] animate-pulse"></span>
              <span className="animate-[flicker_2s_infinite]">🕯️ Watching for scrolls...</span>
            </div>
            <span className="px-3 py-1 bg-[var(--hp-gold-mid)] text-[var(--hp-black)] text-[10px] font-bold rounded-full border border-[var(--hp-gold-bright)] cinzel tracking-widest">
              {questions.length} scrolls pending
            </span>
          </div>
        </div>
      </div>

      <div className="text-center mb-12 text-[var(--hp-gold-mid)] cinzel text-xs tracking-[0.5em]">
        ═══✦ AWAITING ANSWERS ✦═══
      </div>

      {questions.length === 0 ? (
        <div className="py-32 text-center parchment-scroll magic-border p-1 bg-[var(--hp-dark-wood)]/30 rounded-sm">
          <span className="text-6xl block mb-6 animate-[flicker_3s_infinite]">🔮</span>
          <h2 className="text-xl font-black text-[var(--hp-gold-bright)] cinzel tracking-widest">The crystal ball is clear</h2>
          <p className="text-[var(--hp-ink)] mt-4 cinzel text-sm tracking-widest uppercase border-t border-[var(--hp-border)] pt-4">No inquiries from students right now</p>
        </div>
      ) : (
        <div className="space-y-10">
          {questions.map((q) => (
            <div key={q.id} className="parchment-scroll magic-border p-1 rounded-sm group hover:scale-[1.01] transition-transform duration-300 border-[var(--hp-gold-dark)] hover:border-[var(--hp-gold-bright)]">
              <div className="magic-border-inner bg-[var(--hp-dark-wood)] overflow-hidden shadow-xl border-l-4 border-l-[var(--hp-gold-bright)]">
                <div className="p-6 border-b border-[var(--hp-border)] bg-black/40 flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-[var(--hp-gold-bright)] cinzel tracking-widest text-lg flex items-center">
                      <span className="mr-3 text-sm opacity-60">🧑‍🎓</span> {q.name || 'Anonymous Student'}
                    </h3>
                    <p className="text-xs text-[var(--hp-ink)] cinzel tracking-widest mt-2 flex items-center opacity-80">
                      <span className="mr-3 opacity-60 italic">📚</span> {q.courseSection}
                    </p>
                  </div>
                  <div className="text-right">
                    <small className="text-[var(--hp-placeholder)] cinzel text-[10px] uppercase tracking-widest block">
                      {new Date(q.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                    <small className="text-[var(--hp-placeholder)] cinzel text-[8px] tracking-widest">
                      {new Date(q.ts).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                
                <div className="p-8 relative bg-[var(--hp-wood-light)]">
                  <p className="text-lg text-[var(--hp-question-text)] leading-relaxed italic font-serif whitespace-pre-wrap">
                    "{q.question}"
                  </p>
                </div>

                <div className="p-4 bg-black/60 border-t border-[var(--hp-border)] flex justify-end space-x-4">
                  <button 
                    onClick={() => handleDone(q.id)}
                    className="wax-seal px-6 py-2 cinzel font-black text-[10px] tracking-widest uppercase rounded-sm"
                  >
                    ✓ Answered
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    className="px-4 py-2 border-2 border-[var(--hp-red)] text-[#FF4444] cinzel font-black text-[10px] tracking-widest uppercase hover:bg-[var(--hp-red)] hover:text-white transition-all duration-300 rounded-sm"
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
      alert('Invalid incantation (password)');
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
          <main className="min-h-screen relative overflow-hidden bg-[var(--hp-black)]">
            <div className="bg-[var(--hp-dark-wood)] border-b border-[var(--hp-border)] px-4 py-3 flex justify-between items-center shadow-2xl sticky top-0 z-[100]">
              <Link to="/" className="text-[var(--hp-gold)] cinzel font-black tracking-widest text-xs hover:underline">← Home</Link>
              <div className="flex items-center">
                <span className="mr-6 text-[10px] text-[var(--hp-ink)] cinzel tracking-widest italic hidden sm:block">Logged in as {user?.username}</span>
                <button onClick={signOut} className="wax-seal px-4 py-1.5 cinzel font-black text-[9px] tracking-[0.2em] rounded-sm uppercase">Leave Study</button>
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
      <div className="container flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md z-10">
          <div className="magic-border p-1 rounded-sm shadow-[0_0_60px_rgba(201,168,76,0.1)]">
            <div className="magic-border-inner bg-[var(--hp-dark-wood)] p-10 rounded-sm text-center">
              <h1 className="text-3xl font-black mb-8 text-[var(--hp-gold)] cinzel tracking-[0.2em] uppercase">Admin Login</h1>
              <form onSubmit={handleLocalLogin} className="space-y-8">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret incantation..."
                  className="ink-field w-full p-4 rounded-sm cinzel text-sm placeholder:text-[var(--hp-ink)]/40 tracking-widest"
                />
                <button type="submit" className="wax-seal w-full py-4 cinzel font-black text-xs tracking-[0.3em] uppercase rounded-sm">Enter Study</button>
              </form>
              <Link to="/" className="text-[var(--hp-gold)] cinzel text-[10px] tracking-widest hover:underline mt-8 block font-medium opacity-60">Back toSite</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[var(--hp-black)]">
      <div className="bg-[var(--hp-dark-wood)] border-b border-[var(--hp-border)] px-4 py-3 flex justify-between items-center shadow-2xl sticky top-0 z-[100]">
        <Link to="/" className="text-[var(--hp-gold)] cinzel font-black tracking-widest text-xs hover:underline">← Home</Link>
        <button onClick={handleLogout} className="wax-seal px-4 py-1.5 cinzel font-black text-[9px] tracking-[0.2em] rounded-sm uppercase">Leave Study</button>
      </div>
      <AdminContent />
    </main>
  );
}

export default Admin;
