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
    // Generate magical gold particles
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
    if (!courseSection.trim()) errs.courseSection = "Target House/Year is required";
    if (!question.trim()) errs.question = "Inquiry is required";
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
      setError('⚡ MAGIC INTERRUPTED. RETRY TRANSMISSION.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center items-center py-10 px-4 bg-[#0A0800]">
      {/* Magical Background Particles */}
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
            🦉 The Owlery
          </h1>
          <p className="text-[#FFD700] font-semibold tracking-[0.2em] uppercase text-xs cinzel">
            Hogwarts — The Great Hall
          </p>
          <div className="mt-4 text-[#B8860B]">───✦───</div>
        </div>

        <div className="magic-border p-1 rounded-sm">
          <div className="magic-border-inner bg-[#1A1200]/95 backdrop-blur-md p-8 rounded-sm shadow-[0_0_40px_rgba(255,215,0,0.2)] relative overflow-hidden">
            {/* Corner highlights */}
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#FFD700]/10 to-transparent pointer-events-none" />
            
            {success && (
              <div className="p-4 mb-8 bg-[#FFD700]/10 border border-[#FFD700] text-[#FFFDF0] rounded text-center cinzel text-sm">
                🦉 Your owl has been sent to the Great Hall!
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
                  placeholder="Enter name, or remain anonymous..."
                  className="ink-field p-4 rounded-sm w-full cinzel text-sm placeholder:text-[#C8A951]/40"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[#FFD700] cinzel text-[10px] font-bold tracking-[0.2em] mb-2">
                  ✦ HOUSE & YEAR
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
                    ✦ YOUR INQUIRY TO THE PROFESSOR
                  </label>
                  <span className="text-[#C8A951] text-[10px] cinzel">{question.length} / 500 ✦</span>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Inscribe your inquiry here..."
                  className={`ink-field p-4 rounded-sm w-full min-h-[160px] cinzel text-sm placeholder:text-[#C8A951]/40 resize-none ${formErrors.question ? 'border-[#FF4444]' : ''}`}
                  disabled={loading}
                  maxLength={500}
                />
                {formErrors.question && <span className="text-[#FF4444] text-[10px] cinzel mt-2 tracking-wider font-bold">{formErrors.question}</span>}
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

        <div className="mt-12 text-center text-[#C8A951]/40 text-[10px] tracking-[0.5em] cinzel uppercase">
          ✦ HOGWARTS — THE GREAT HALL ✦
        </div>
      </div>
    </div>
  );
}

export default Guest;
