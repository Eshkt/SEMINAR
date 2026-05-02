import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function Guest() {
  const [question, setQuestion] = useState('');
  const [myQuestion, setMyQuestion] = useState(null);
  const [liveQuestions, setLiveQuestions] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/questions`);
      const data = await res.json();
      setLiveQuestions(data);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const fetchMyQuestion = async () => {
    const stored = localStorage.getItem('myQuestionId');
    if (stored) {
      try {
        const res = await fetch(`${API_URL}/questions/${stored}`);
        if (res.ok) {
          const data = await res.json();
          setMyQuestion(data);
        }
      } catch (err) {
        console.error('Failed to fetch my question:', err);
      }
    }
  };

  useEffect(() => {
    fetchLiveQuestions();
    fetchMyQuestion();
    const interval = setInterval(() => {
      fetchLiveQuestions();
      fetchMyQuestion();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('myQuestionId', data.id);
        setMyQuestion(data);
        setQuestion('');
        fetchLiveQuestions();
      } else if (res.status === 400 && data.error === 'Profanity detected') {
        setToast(data.message);
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(data.error || 'Failed to submit question');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast('Network error. Please try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <h1>Q&A Session</h1>
        <Link to="/admin">Admin Login</Link>
      </div>

      <div className="form-container">
        <h2>Submit Your Question</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your anonymous question here..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !question.trim()}>
            {loading ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>
      </div>

      {myQuestion && (
        <div className="form-container">
          <h2>Your Question Status</h2>
          <div className={`question-card ${myQuestion.status}`}>
            <p>{myQuestion.text}</p>
            <span className={`status-badge status-${myQuestion.status}`}>
              {myQuestion.status === 'pending' ? 'Pending Approval' : 'Live'}
            </span>
          </div>
        </div>
      )}

      <div className="form-container">
        <h2>Live Questions</h2>
        {liveQuestions.length === 0 ? (
          <p>No questions yet. Be the first to ask!</p>
        ) : (
          <div className="questions-list">
            {liveQuestions.map((q) => (
              <div key={q.id} className="question-card approved">
                <p>{q.text}</p>
                <small>Upvotes: {q.upvotes}</small>
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
