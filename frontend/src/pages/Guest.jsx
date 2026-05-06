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
  const [clouds, setClouds] = useState([]);

  useEffect(() => {
    // Generate tech storm particles
    const newClouds = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      top: Math.random() * 80 + '%',
      duration: Math.random() * 20 + 15 + 's',
      delay: Math.random() * 10 + 's',
      size: Math.random() * 200 + 100 + 'px'
    }));
    setClouds(newClouds);
  }, []);

  const validate = () => {
    const errs = {};
    if (!courseSection.trim()) errs.courseSection = "Target Section is required";
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
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError('⚡ CONNECTION INTERRUPTED. RETRY TRANSMISSION.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center items-center py-10 px-4 bg-[#0A0810]">
      {/* Tech Storm Background */}
      <div className="lightning-flash" />
      {clouds.map(c => (
        <div 
          key={c.id} 
          className="cloud-particle" 
          style={{ 
            top: c.top, 
            width: c.size, 
            height: c.size, 
            animation: `cloudDrift ${c.duration} linear infinite`,
            animationDelay: c.delay
          }} 
        />
      ))}

      <div className="w-full max-w-[550px] z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white orbitron tracking-tighter mb-2">
            CL<span className="text-[#00BFFF]">⚡</span>UDED
          </h1>
          <p className="text-[#00BFFF] font-semibold tracking-[0.3em] uppercase text-xs">
            Unlocking Cloud & Cybersecurity
          </p>
          <div className="mt-4 flex justify-center items-center space-x-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#8B0000]" />
            <span className="text-[10px] uppercase tracking-widest text-[#666688]">Ask the Cloud</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#8B0000]" />
          </div>
        </div>

        <div className="glass-card p-1 rounded-sm">
          <div className="bg-[#1a1a2e]/60 p-8 rounded-sm relative overflow-hidden">
            {/* HUD Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            
            {success && (
              <div className="p-4 mb-8 bg-[#00BFFF]/10 border border-[#00BFFF] text-white rounded text-center font-bold text-xs uppercase tracking-widest animate-pulse">
                ⚡ TRANSMISSION SUCCESSFUL. DATA UPLOADED TO CLOUD.
              </div>
            )}

            {error && (
              <div className="p-4 mb-8 bg-[#8B0000]/20 border border-[#8B0000] text-white rounded text-center font-bold text-xs uppercase tracking-widest">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 relative">
              <div className="flex flex-col group">
                <label className="text-[#666688] font-bold text-[10px] tracking-[0.2em] mb-2 flex justify-between uppercase">
                  <span>// IDENTITY_KEY</span>
                  <span className="text-[#8B0000] font-normal lowercase opacity-60">optional</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="[Anonymous User]"
                  className="tech-input p-4 rounded-sm w-full text-sm font-semibold placeholder:text-[#666688]/40"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[#666688] font-bold text-[10px] tracking-[0.2em] mb-2 uppercase">
                  <span>// TARGET_SECTOR</span>
                </label>
                <input
                  type="text"
                  value={courseSection}
                  onChange={(e) => setCourseSection(e.target.value)}
                  placeholder="e.g. BSIT 2-A / CYBER"
                  className={`tech-input p-4 rounded-sm w-full text-sm font-semibold placeholder:text-[#666688]/40 ${formErrors.courseSection ? 'border-[#8B0000]' : ''}`}
                  disabled={loading}
                />
                {formErrors.courseSection && <span className="text-[#8B0000] text-[10px] font-bold mt-2 tracking-wider uppercase">{formErrors.courseSection}</span>}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#666688] font-bold text-[10px] tracking-[0.2em] uppercase">
                    <span>// ENCRYPTED_INQUIRY</span>
                  </label>
                  <span className="text-[#666688] text-[10px] font-mono">{question.length} / 500</span>
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Input query for processing..."
                  className={`tech-input p-4 rounded-sm w-full min-h-[160px] text-sm font-semibold placeholder:text-[#666688]/40 resize-none ${formErrors.question ? 'border-[#8B0000]' : ''}`}
                  disabled={loading}
                  maxLength={500}
                />
                {formErrors.question && <span className="text-[#8B0000] text-[10px] font-bold mt-2 tracking-wider uppercase">{formErrors.question}</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`tech-button w-full py-4 font-black tracking-[0.3em] uppercase text-xs rounded-sm cursor-pointer shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-pulse mr-3">⚡</span> UPLOADING...
                  </span>
                ) : (
                  '⚡ EXECUTE TRANSMISSION'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center text-[#666688]/30 text-[10px] tracking-[0.4em] uppercase font-bold">
          [ CISCO NETWORKING ACADEMY GATEWAY ]
        </div>
      </div>
    </div>
  );
}

export default Guest;
