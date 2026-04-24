import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, Wrench, Lock, X, AlertCircle } from 'lucide-react';

const WORKER_PIN = '0000';

export default function UnifiedQR() {
  const { washroomId } = useParams<{ washroomId: string }>();
  const navigate = useNavigate();
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setPinError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      const fullPin = [...newPin.slice(0, 3), value.slice(-1)].join('');
      if (fullPin === WORKER_PIN) {
        navigate(`/cleaner/${washroomId}`);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f4ff 100%)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
          }}
        >
          <ShieldCheck size={28} color="white" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
          Civic<span style={{ color: '#2563eb' }}>Sync</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
          Smart Sanitation & Safety System
        </p>
      </div>

      {/* Main Card */}
      <div
        style={{
          width: '100%', maxWidth: '380px', background: 'white', borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid rgba(226, 232, 240, 0.8)', textAlign: 'center',
        }}
      >
        {/* Washroom Badge */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#f1f5f9', padding: '8px 16px', borderRadius: '12px',
            marginBottom: '24px', border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Washroom</span>
          <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#0f172a' }}>
            {washroomId}
          </span>
        </div>

        {!showPin ? (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              How can we help you?
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.5 }}>
              Please select your role to continue
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Municipal Worker */}
              <button
                onClick={() => { setShowPin(true); setTimeout(() => inputRefs.current[0]?.focus(), 100); }}
                style={{
                  width: '100%', padding: '20px', borderRadius: '16px',
                  border: '2px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'all 0.2s ease', textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff, #dbeafe)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}>
                  <Wrench size={22} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Municipal Worker</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Mark this washroom as cleaned</p>
                </div>
              </button>

              {/* Citizen Feedback */}
              <button
                onClick={() => navigate(`/feedback/${washroomId}`)}
                style={{
                  width: '100%', padding: '20px', borderRadius: '16px',
                  border: '2px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'all 0.2s ease', textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fffbeb, #fef3c7)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                }}>
                  <Star size={22} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Citizen Feedback</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Rate cleanliness & report issues</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          /* ── PIN Entry Screen ── */
          <>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}>
              <Lock size={22} color="white" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Enter Worker PIN
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              Enter the 4-digit access code provided by your supervisor
            </p>

            {/* PIN Inputs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: '56px', height: '64px', textAlign: 'center',
                    fontSize: '24px', fontWeight: 900,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderRadius: '14px',
                    border: `2px solid ${pinError ? '#ef4444' : digit ? '#3b82f6' : '#e2e8f0'}`,
                    background: pinError ? '#fef2f2' : digit ? '#eff6ff' : '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    color: '#0f172a',
                    animation: pinError ? 'shake 0.4s ease' : 'none',
                  }}
                />
              ))}
            </div>

            {pinError && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px',
              }}>
                <AlertCircle size={14} />
                Incorrect PIN. Try again.
              </div>
            )}

            <button
              onClick={() => { setShowPin(false); setPin(['', '', '', '']); setPinError(false); }}
              style={{
                padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: '12px', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px',
              }}
            >
              <X size={14} /> Go Back
            </button>

            <style>{`@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }`}</style>
          </>
        )}
      </div>

      {/* Footer */}
      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '24px', textAlign: 'center' }}>
        CivicSync • Smart City Initiative 🇮🇳
      </p>
    </div>
  );
}
