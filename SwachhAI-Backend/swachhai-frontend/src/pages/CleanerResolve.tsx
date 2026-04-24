import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, AlertTriangle, Sparkles, ShieldCheck, Droplet, Wind, ShieldAlert, User, ArrowRight } from 'lucide-react';

const API_BASE = '';

export default function CleanerResolve() {
  const { washroomId } = useParams<{ washroomId: string }>();
  const [status, setStatus] = useState<'name_entry' | 'idle' | 'loading' | 'success' | 'error'>('name_entry');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionDone, setActionDone] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [nameError, setNameError] = useState('');

  // Prevent zoom on mobile
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
  }, []);

  const handleNameSubmit = () => {
    if (!workerName.trim()) {
      setNameError('Please enter your name to continue');
      return;
    }
    setNameError('');
    setStatus('idle');
  };

  const handleResolve = async (action: string, actionLabel: string) => {
    setStatus('loading');
    setActionDone(actionLabel);
    try {
      await axios.post(`${API_BASE}/api/sensors/resolve`, {
        washroomId,
        action,
        workerName: workerName.trim(),
      });
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
          Civic<span style={{ color: '#2563eb' }}>Sync</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
          Worker Resolution Portal
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
              fontSize: '15px',
              fontWeight: 900,
              color: '#0f172a',
            }}
          >
            {washroomId}
          </span>
        </div>

        {/* ── Step 1: Name Entry ── */}
        {status === 'name_entry' && (
          <>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid #bfdbfe',
              }}
            >
              <User size={26} color="#2563eb" />
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              Who are you?
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '20px',
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              Enter your name so the Nodal Officer can see who resolved this issue.
            </p>

            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Your name, e.g. Ramesh Kumar"
              style={{
                width: '100%',
                padding: '13px 16px',
                fontSize: '14px',
                border: `2px solid ${nameError ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: '14px',
                outline: 'none',
                fontWeight: 600,
                color: '#0f172a',
                textAlign: 'left',
                boxSizing: 'border-box',
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.target.style.borderColor = nameError ? '#fca5a5' : '#e2e8f0'; }}
              autoFocus
            />

            {nameError && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px', fontWeight: 600, textAlign: 'left' }}>
                {nameError}
              </p>
            )}

            <button
              onClick={handleNameSubmit}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'white',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Step 2: Action Selection ── */}
        {status === 'idle' && (
          <>
            {/* Worker greeting */}
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <User size={14} color="#0284c7" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>
                Hello, {workerName}!
              </span>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: '20px',
                fontWeight: 500
              }}
            >
              What did you fix? Select the action below to update the system.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>

              {/* Odor / Ammonia */}
              <button
                onClick={() => handleResolve('clean_ammonia', 'Cleaned Washroom (Odor)')}
                className="action-btn text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200"
                style={actionBtnStyle}
              >
                <div style={{ ...iconWrapStyle, background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}><Wind size={20} color="white" /></div>
                Cleaned Odor
              </button>

              {/* Soap */}
              <button
                onClick={() => handleResolve('refill_soap', 'Refilled Soap')}
                className="action-btn text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                style={actionBtnStyle}
              >
                <div style={{ ...iconWrapStyle, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}><Sparkles size={20} color="white" /></div>
                Refilled Soap
              </button>

              {/* Water */}
              <button
                onClick={() => handleResolve('refill_water', 'Refilled Water')}
                className="action-btn text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
                style={actionBtnStyle}
              >
                <div style={{ ...iconWrapStyle, background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}><Droplet size={20} color="white" /></div>
                Refilled Water
              </button>

              {/* SOS */}
              <button
                onClick={() => handleResolve('resolve_sos', 'Resolved SOS Alert')}
                className="action-btn text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 w-full"
                style={actionBtnStyle}
              >
                <div style={{ ...iconWrapStyle, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><ShieldAlert size={20} color="white" /></div>
                Resolved Emergency / SOS
              </button>

              {/* Reset Everything */}
              <button
                onClick={() => handleResolve('reset_all', 'Fully Cleaned & Restocked')}
                className="action-btn text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 w-full mt-2"
                style={actionBtnStyle}
              >
                Reset Everything
              </button>

            </div>
            <style>{`
              .action-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
              .action-btn:active { transform: scale(0.97); }
            `}</style>
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
              Submitting by {workerName}...
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
              Task Resolved!
            </h2>
            <p style={{ fontSize: '14px', color: '#4ade80', fontWeight: 600 }}>
              <strong>{actionDone}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '8px' }}>
              Logged by <strong>{workerName}</strong> ✓
            </p>
            <p
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '16px',
              }}
            >
              The Nodal Officer has been updated. You can close this window or{' '}
              <span
                onClick={() => { setStatus('idle'); }}
                style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
              >
                log another action
              </span>.
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
              Failed to Update
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
        CivicSync • Smart City Initiative 🇮🇳
      </p>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  flex: '1 1 calc(50% - 6px)',
  padding: '14px 12px',
  fontSize: '13.5px',
  fontWeight: 700,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  letterSpacing: '-0.01em',
};

const iconWrapStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
