import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Generate magical particles
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      duration: Math.random() * 10 + 10 + 's',
      delay: Math.random() * 10 + 's',
      size: Math.random() * 3 + 1 + 'px'
    }));
    setParticles(newParticles);
  }, []);

  const validate = () => {
    const errs = {};
    if (!courseSection.trim()) errs.courseSection = "House & Year is required";
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
        throw new Error('Failed to submit');
      }
    } catch (err) {
      setError('💀 Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center items-center py-10 px-4 bg-[var(--hp-black)]">
      {/* Background Particles */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle" 
          style={{ 
            left: p.left, 
            width: p.size, 
            height: p.size, 
            animation: `float ${p.duration} linear infinite`,
            animationDelay: p.delay,
            backgroundColor: 'var(--hp-gold-mid)'
          }} 
        />
      ))}

      <div className="w-full max-w-[550px] z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[var(--hp-gold-bright)] cinzel tracking-widest mb-2">
            🦉 The Owlery
          </h1>
          <p className="text-[var(--hp-ink)] cinzel text-sm tracking-[0.2em]">
            Send your question to the Professor
          </p>
          <div className="mt-4 text-[var(--hp-border)]">───✦───</div>
        </div>

        <div className="magic-border p-1 rounded-sm border-[var(--hp-gold-mid)]">
          <div className="magic-border-inner bg-[var(--hp-dark-wood)] p-8 rounded-sm shadow-[0_0_40px_rgba(255,215,0,0.15)] relative overflow-hidden">
            {/* Corner highlights */}
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[var(--hp-gold-bright)]/5 to-transparent pointer-events-none" />
            
            {success && (
              <div className="p-4 mb-8 bg-[var(--hp-green)]/10 border border-[var(--hp-green)] text-[var(--hp-parchment)] rounded text-center cinzel text-sm animate-pulse">
                🦉 Your owl has been sent! The Professor will answer shortly.
              </div>
            )}

            {error && (
              <div className="p-4 mb-8 bg-[var(--hp-red)]/20 border border-[var(--hp-red)] text-[var(--hp-parchment)] rounded text-center cinzel text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 relative">
              <div className="flex flex-col group">
                <label className="text-[var(--hp-gold-bright)] cinzel text-[10px] font-bold tracking-[0.2em] mb-2 flex justify-between">
                  <span>✦ YOUR NAME</span>
                  <span className="text-[var(--hp-ink)] font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name, or remain anonymous..."
                  className="ink-field p-4 rounded-sm w-full cinzel text-sm placeholder:text-[var(--hp-placeholder)]"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[var(--hp-gold-bright)] cinzel text-[10px] font-bold tracking-[0.2em] mb-2">
                  ✦ HOUSE & YEAR
                </label>
                <input
                  type="text"
                  value={courseSection}
                  onChange={(e) => setCourseSection(e.target.value)}
                  placeholder="e.g. Gryffindor, 3rd Year"
                  className={`ink-field p-4 rounded-sm w-full cinzel text-sm placeholder:text-[var(--hp-placeholder)] ${formErrors.courseSection ? 'border-[var(--hp-red)]' : ''}`}
                  disabled={loading}
                />
                {formErrors.courseSection && <span className="text-[var(--hp-red)] text-[10px] cinzel mt-2 tracking-wider">{formErrors.courseSection}</span>}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[var(--hp-gold-bright)] cinzel text-[10px] font-bold tracking-[0.2em]">
                    ✦ YOUR QUESTION TO THE PROFESSOR
                  </label>
                  <span className="text-[var(--hp-ink)] text-[10px] cinzel">{question.length} / 500 ✦</span>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Inscribe your inquiry here..."
                  className={`ink-field p-4 rounded-sm w-full min-h-[160px] cinzel text-sm placeholder:text-[var(--hp-placeholder)] resize-none ${formErrors.question ? 'border-[var(--hp-red)]' : ''}`}
                  disabled={loading}
                  maxLength={500}
                />
                {formErrors.question && <span className="text-[var(--hp-red)] text-[10px] cinzel mt-2 tracking-wider">{formErrors.question}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`wax-seal w-full py-4 cinzel font-black tracking-[0.3em] uppercase text-xs rounded-sm cursor-pointer shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-3">🦉</span> Sending owl...
                  </span>
                ) : (
                  '🪄 Send Owl'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center text-[var(--hp-ink)]/30 text-[10px] tracking-[0.5em] cinzel uppercase">
          ✦ Hogwarts School of Witchcraft and Wizardry ✦
        </div>
      </div>
    </div>
  );
}

export default Guest;
