import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, AlertTriangle, ShieldCheck, Star } from 'lucide-react';

const API_BASE = '';

export default function FeedbackPortal() {
  const { washroomId } = useParams<{ washroomId: string }>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const ISSUES = ['No Soap', 'No Water', 'Bad Smell', 'Dirty Floor', 'Broken Flush', 'Not Working'];

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
  }, []);

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setErrorMsg('Please select a star rating.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await axios.post(`${API_BASE}/api/feedback/submit`, { washroomId, rating, issues: selectedIssues });
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        background: status === 'success'
          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f4ff 100%)',
        transition: 'background 0.6s ease',
      }}
    >
      {/* Header Branding */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
          }}
        >
          <ShieldCheck size={28} color="white" />
        </div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.025em',
          }}
        >
          Swachh<span style={{ color: '#2563eb' }}>-AI</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
          Public Citizen Feedback
        </p>
      </div>

      {/* Main Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'white',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          textAlign: 'center',
        }}
      >
        {/* Washroom ID Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f1f5f9',
            padding: '8px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Washroom</span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 900,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: '#0f172a',
            }}
          >
            {washroomId}
          </span>
        </div>

        {/* ── Idle State ── */}
        {status === 'idle' && (
          <>
            <p
              style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: '16px',
                fontWeight: 600
              }}
            >
              How was your experience?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <Star
                    size={36}
                    fill={(hoverRating || rating) >= star ? '#eab308' : 'transparent'}
                    color={(hoverRating || rating) >= star ? '#eab308' : '#cbd5e1'}
                  />
                </button>
              ))}
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', fontWeight: 500 }}>
              Any specific issues? (Optional)
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
              {ISSUES.map(issue => (
                <button
                  key={issue}
                  onClick={() => toggleIssue(issue)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedIssues.includes(issue) ? '#3b82f6' : '#e2e8f0',
                    background: selectedIssues.includes(issue) ? '#eff6ff' : 'white',
                    color: selectedIssues.includes(issue) ? '#2563eb' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {issue}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Submit Feedback
            </button>
          </>
        )}

        {/* ── Loading State ── */}
        {status === 'loading' && (
          <div style={{ padding: '20px 0' }}>
            <Loader2
              size={48}
              color="#2563eb"
              style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}
            />
            <p style={{ fontSize: '15px', color: '#64748b', fontWeight: 600 }}>
              Sending feedback...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Success State ── */}
        {status === 'success' && (
          <div style={{ padding: '12px 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '3px solid #86efac',
              }}
            >
              <CheckCircle size={36} color="#16a34a" />
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#15803d',
                margin: '0 0 8px 0',
              }}
            >
              Thank You!
            </h2>
            <p style={{ fontSize: '14px', color: '#16a34a', fontWeight: 500, lineHeight: 1.5 }}>
              Your feedback has been submitted to the authorities to help improve city sanitation.
            </p>
          </div>
        )}

        {/* ── Error State ── */}
        {status === 'error' && (
          <div style={{ padding: '12px 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '3px solid #fca5a5',
              }}
            >
              <AlertTriangle size={36} color="#dc2626" />
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#dc2626',
                margin: '0 0 8px 0',
              }}
            >
              Submission Failed
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              {errorMsg}
            </p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: '11px',
          color: '#94a3b8',
          marginTop: '24px',
          textAlign: 'center',
        }}
      >
        SwachhBharat Abhiyan • CivicSync 🇮🇳
      </p>
    </div>
  );
}
