import { useState, useEffect } from 'react';
import { useRealtimeQuestions } from '../hooks/useRealtimeQuestions';

const API_URL = import.meta.env.VITE_API_URL || "https://d11ffcb0dwbou3.cloudfront.net";

function Guest() {
  const [name, setName] = useState('');
  const [courseSection, setCourseSection] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [particles, setParticles] = useState([]);
  const [approvedQuestions] = useRealtimeQuestions([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    // Generate magical gold particles
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      duration: Math.random() * 10 + 10 + 's',
      delay: Math.random() * 10 + 's',
      size: Math.random() * 3 + 1 + 'px'
    }));
    setParticles(newParticles);

    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedQuestion(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const validate = () => {
    const errs = {};
    if (!courseSection.trim()) errs.courseSection = "Year & Section is required";
    if (!question.trim()) errs.question = "Question is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || "",
          courseSection: courseSection.trim(),
          question: question.trim()
        })
      });

      if (res.ok) {
        setSuccess(true);
        setName('');
        setCourseSection('');
        setQuestion('');
        setFormErrors({});
        setTimeout(() => setSuccess(false), 5000);
      } else {
        throw new Error('Transmission failed');
      }
    } catch (err) {
      setError('⚡ CONNECTION INTERRUPTED. RETRY TRANSMISSION.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-20 px-4 bg-[#0A0800]">
      {/* Background Particles */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle" 
          style={{ 
            left: p.left, 
            width: p.size, 
            height: p.size, 
            animation: `floatUp ${p.duration} linear infinite`,
            animationDelay: p.delay
          }} 
        />
      ))}

      <div className="w-full max-w-[550px] z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#FFD700] cinzel tracking-widest mb-2">
            CL⚡UDED
          </h1>
          <p className="text-[#FFD700] font-semibold tracking-[0.2em] uppercase text-xs cinzel mb-1">
            Unlocking the Secrets of Cloud and Cybersecurity
          </p>
          <p className="text-[#FFD700] text-[10px] cinzel tracking-[0.3em] uppercase opacity-80">
            Presented by CNAG-CICS
          </p>
          <div className="mt-4 text-[#B8860B]">───✦───</div>
        </div>

        <div className="magic-border p-1 rounded-sm">
          <div className="magic-border-inner bg-[#1A1200]/95 backdrop-blur-md p-8 rounded-sm shadow-[0_0_40px_rgba(255,215,0,0.2)] relative overflow-hidden">
            {/* Corner highlights */}
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#FFD700]/10 to-transparent pointer-events-none" />
            
            {success && (
              <div className="p-4 mb-8 bg-[#FFD700]/10 border border-[#FFD700] text-[#FFFDF0] rounded text-center cinzel text-sm">
                ⚡ Your question has been sent to the cloud!
              </div>
            )}

            {error && (
              <div className="p-4 mb-8 bg-[#FF4444]/20 border border-[#FF4444] text-[#FF4444] rounded text-center cinzel text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 relative">
              <div className="flex flex-col group">
                <label className="text-[#FFD700] cinzel text-[10px] font-bold tracking-[0.2em] mb-2 flex justify-between">
                  <span>✦ YOUR NAME</span>
                  <span className="text-[#C8A951] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="ink-field p-4 rounded-sm w-full cinzel text-sm placeholder:text-[#C8A951]/40"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[#FFD700] cinzel text-[10px] font-bold tracking-[0.2em] mb-2">
                  ✦ YEAR & SECTION
                </label>
                <input
                  type="text"
                  value={courseSection}
                  onChange={(e) => setCourseSection(e.target.value)}
                  placeholder="1ITA"
                  className={`ink-field p-4 rounded-sm w-full cinzel text-sm placeholder:text-[#C8A951]/40 ${formErrors.courseSection ? 'border-[#FF4444]' : ''}`}
                  disabled={loading}
                />
                {formErrors.courseSection && <span className="text-[#FF4444] text-[10px] cinzel mt-2 tracking-wider font-bold">{formErrors.courseSection}</span>}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#FFD700] cinzel text-[10px] font-bold tracking-[0.2em]">
                    ✦ YOUR QUESTION
                  </label>
                  <span className="text-[#C8A951] text-[10px] cinzel">{question.length} / 500 ✦</span>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about Cloud or Cybersecurity..."
                  className={`ink-field p-4 rounded-sm w-full min-h-[160px] cinzel text-sm placeholder:text-[#C8A951]/40 resize-none ${formErrors.question ? 'border-[#FF4444]' : ''}`}
                  disabled={loading}
                  maxLength={500}
                />
                {formErrors.question && <span className="text-[#FF4444] text-[10px] cinzel mt-2 tracking-wider font-bold">{formErrors.question}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`wax-seal w-full py-4 cinzel font-black tracking-[0.3em] uppercase text-xs rounded-sm cursor-pointer shadow-lg ${loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-3">⚡</span> Connecting...
                  </span>
                ) : 'Submit Question ⚡'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-3">⚡</span> Connecting...
                  </span>
                ) : (
                  'Submit Question ⚡'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Questions Feed */}
        <div className="mt-20 space-y-8">
          <div className="text-center">
            <h2 className="text-[#FFD700] cinzel text-sm font-bold tracking-[0.4em] uppercase mb-4">
              ═══✦ Live Feed ✦═══
            </h2>
          </div>

          {approvedQuestions.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-[#FFD700] cinzel text-xs tracking-widest uppercase">
                No questions yet. Be the first to ask! ⚡
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {approvedQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className="parchment-scroll magic-border p-1 rounded-sm cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
                  onClick={() => setSelectedQuestion(q)}
                >
                  <div className="magic-border-inner bg-[#1A1200]/90 p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-[#FFFDF0] cinzel font-bold text-xs tracking-wider group-hover:text-[#FFD700] transition-colors">
                          {q.name || 'Anonymous Student'}
                        </h3>
                        <p className="text-[#FFD700] text-[10px] cinzel opacity-60">
                          {q.courseSection}
                        </p>
                      </div>
                      <span className="text-[#C8A951] text-[8px] cinzel opacity-40 uppercase">
                        {new Date(q.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#FFFDF0] text-sm italic font-serif leading-relaxed line-clamp-3">
                      "{q.question}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-24 text-center text-[#C8A951]/40 text-[10px] tracking-[0.5em] cinzel uppercase pb-20">
          ✦ EMPOWERING THE NEXT GENERATION OF IT PROFESSIONALS ✦
        </div>
      </div>

      {/* Question Modal */}
      {selectedQuestion && (
        <div className="modal-overlay" onClick={() => setSelectedQuestion(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedQuestion(null)}>✕</button>
            <div className="text-center">
              <p className="modal-question mb-12 text-center">
                "{selectedQuestion.question}"
              </p>
              <div className="mt-8 pt-8 border-t border-[#B8860B]/30">
                <h3 className="text-[#FFD700] cinzel font-black text-lg tracking-[0.2em] mb-2">
                  {selectedQuestion.name || 'Anonymous Student'}
                </h3>
                <p className="text-[#C8A951] text-xs cinzel font-bold uppercase tracking-[0.3em] opacity-80">
                  {selectedQuestion.courseSection}
                </p>
                <p className="text-[#C8A951] text-[10px] mt-6 opacity-30 uppercase tracking-[0.5em]">
                  {new Date(selectedQuestion.ts).toLocaleDateString()} · {new Date(selectedQuestion.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Guest;
