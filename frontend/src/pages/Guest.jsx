import { useState } from 'react';

const VITE_API_URL = "https://d11ffcb0dwbou3.cloudfront.net";

function Guest() {
  const [name, setName] = useState('');
  const [courseSection, setCourseSection] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!courseSection.trim()) errs.courseSection = "Course & Section is required";
    if (!question.trim()) errs.question = "Question is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${VITE_API_URL}/questions`, {
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
        setTimeout(() => setSuccess(false), 4000);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center min-h-screen py-10 px-4">
      <div className="card w-full max-w-[500px] shadow-lg p-6 bg-white rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Submit Your Question</h1>
        
        {success && (
          <div className="p-4 mb-6 bg-green-100 border border-green-400 text-green-700 rounded text-center">
            Your question has been submitted! ✓
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="p-3 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-gray-700">Course & Section</label>
            <input
              type="text"
              value={courseSection}
              onChange={(e) => setCourseSection(e.target.value)}
              placeholder="e.g. BSIT 2-A"
              className={`p-3 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:outline-none ${formErrors.courseSection ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {formErrors.courseSection && <span className="text-red-500 text-sm mt-1">{formErrors.courseSection}</span>}
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1 text-gray-700">Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className={`p-3 border rounded-md w-full min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:outline-none ${formErrors.question ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {formErrors.question && <span className="text-red-500 text-sm mt-1">{formErrors.question}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-blue-600 text-white font-bold rounded-md transition-colors ${loading ? 'bg-blue-300' : 'hover:bg-blue-700'}`}
          >
            {loading ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Guest;
