import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRealtimeQuestions } from '../hooks/useRealtimeQuestions';

const VITE_API_URL = import.meta.env.VITE_API_URL;

function Guest() {
  const [text, setText] = useState('');
  const [myQuestion, setMyQuestion] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useRealtimeQuestions([]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${VITE_API_URL}/questions/approved`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const approvedList = Array.isArray(data) ? data : (data.questions || data.data || []);
      setQuestions(approvedList.map(q => ({ ...q, status: 'approved' })));
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setQuestions([]); // Fallback to empty array to avoid .map error
    }
  };

  const fetchMyQuestion = async () => {
    const id = localStorage.getItem('myQuestionId');
    if (id) {
      try {
        const res = await fetch(`${VITE_API_URL}/questions/approved`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const approvedList = Array.isArray(data) ? data : (data.questions || data.data || []);
        const q = approvedList.find(x => x.id === id);
        if (q) setMyQuestion({ ...q, status: 'approved' });
      } catch (err) {
        console.error('Failed to fetch my question:', err);
      }
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchMyQuestion();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${VITE_API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('myQuestionId', data.id);
        setMyQuestion({ ...data, status: 'pending' });
        setText('');
        fetchQuestions();
      } else if (data.error === 'PROFANITY') {
        setToast('Please keep your questions professional');
        setTimeout(() => setToast(null), 3000);
      } else if (data.error === 'TOO_LONG') {
        setToast('Question must be under 280 characters');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(data.error || 'Failed to submit');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast('Network error');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Q&A Session</h1>
        <Link to="/admin" className="text-blue-600 hover:underline">Admin</Link>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Submit Your Question</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your anonymous question here..."
            className="w-full min-h-[100px] p-3 border rounded mb-3"
            maxLength={280}
            disabled={loading}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{text.length}/280</span>
            <button type="submit" disabled={loading || !text.trim()} className="btn">
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>

      {myQuestion && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Your Question</h2>
          <div className="p-4 bg-gray-100 rounded">
            <p>{myQuestion.txt}</p>
            <span className={`badge badge-${myQuestion.stat || 'pending'}`}>
              {myQuestion.stat === 'apprv' ? 'Live' : 'Pending Approval'}
            </span>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Live Questions</h2>
        {questions.length === 0 ? (
          <p className="text-gray-500">No questions yet.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded">
                <p>{q.txt}</p>
                <small className="text-gray-500">{new Date(q.ts).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Guest;
