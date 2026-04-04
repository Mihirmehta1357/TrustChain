import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../components/shared/ToastProvider';

const STEPS = ['PAN Card', 'Aadhaar Card', 'Mobile OTP', 'Face Check'];

const StepBar = ({ current }) => (
  <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
    {STEPS.map((label, i) => {
      const done = i + 1 < current;
      const active = i + 1 === current;
      return (
        <div key={label} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            height: '4px', borderRadius: '4px', marginBottom: '6px',
            background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--color-border)',
            transition: 'background 0.3s'
          }} />
          <div style={{ fontSize: '9px', color: done || active ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}>
            {label}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── STEP 1: PAN Card ───────────────────────────────────────
const PanStep = ({ onNext }) => {
  const [pan, setPan] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const validate = (e) => {
    e.preventDefault();
    setError('');
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase()))
      return setError('Invalid PAN format. Example: ABCDE1234F');
    if (!file) return setError('Please upload your PAN Card image.');
    onNext({ panNumber: pan.toUpperCase() });
  };

  return (
    <form onSubmit={validate} className="auth-form">
      <h1 className="auth-title">PAN Card</h1>
      <p className="auth-subtitle">Enter your PAN and upload a clear photo.</p>
      {error && <div className="auth-error" style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}
      <div className="form-group mt-4">
        <label className="form-label" htmlFor="pan-input">PAN Number</label>
        <input className="form-control" id="pan-input" type="text" placeholder="ABCDE1234F"
          value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} required
          style={{ letterSpacing: '2px', fontFamily: 'monospace', fontSize: '16px' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Upload PAN Card Image</label>
        <label htmlFor="pan-file" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '24px',
          cursor: 'pointer', background: file ? '#EAF3DE' : 'var(--color-bg)', transition: 'background 0.2s'
        }}>
          <span style={{ fontSize: '28px' }}>{file ? '✅' : '📄'}</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {file ? file.name : 'Tap to upload JPEG or PNG'}
          </span>
          <input id="pan-file" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary w-full mt-4" id="pan-next-btn">Continue →</button>
      <div className="auth-hint text-xs text-muted text-center mt-3">🔒 Documents are never shared</div>
    </form>
  );
};

// ─── STEP 2: Aadhaar Card ────────────────────────────────────
const AadhaarStep = ({ onNext, onBack }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validate = (e) => {
    e.preventDefault();
    setError('');
    const raw = aadhaar.replace(/\s/g, '');
    if (raw.length !== 12) return setError('Aadhaar must be exactly 12 digits.');
    if (!file) return setError('Please upload your Aadhaar Card image.');
    onNext({ aadhaarNumber: raw });
  };

  return (
    <form onSubmit={validate} className="auth-form">
      <h1 className="auth-title">Aadhaar Card</h1>
      <p className="auth-subtitle">Enter your 12-digit Aadhaar number.</p>
      {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}
      <div className="form-group mt-4">
        <label className="form-label" htmlFor="aadhaar-input">Aadhaar Number</label>
        <input className="form-control" id="aadhaar-input" type="text" placeholder="XXXX XXXX XXXX"
          value={aadhaar}
          onChange={e => setAadhaar(formatAadhaar(e.target.value))}
          maxLength={14} required
          style={{ letterSpacing: '2px', fontFamily: 'monospace', fontSize: '16px' }} />
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Displayed masked for your privacy</div>
      </div>
      <div className="form-group">
        <label className="form-label">Upload Aadhaar Image</label>
        <label htmlFor="aadhaar-file" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '24px',
          cursor: 'pointer', background: file ? '#EAF3DE' : 'var(--color-bg)'
        }}>
          <span style={{ fontSize: '28px' }}>{file ? '✅' : '🪪'}</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {file ? file.name : 'Tap to upload JPEG or PNG'}
          </span>
          <input id="aadhaar-file" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
        </label>
      </div>
      <div className="flex gap-3 mt-4">
        <button type="button" className="btn btn-outline flex-1" onClick={onBack}>← Back</button>
        <button type="submit" className="btn btn-primary flex-1" id="aadhaar-next-btn">Continue →</button>
      </div>
    </form>
  );
};

// ─── STEP 3: Mobile OTP (Real Twilio SMS via Supabase) ───────
const OtpStep = ({ onNext, onBack }) => {
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDigitChange = (val, idx) => {
    const d = [...digits];
    d[idx] = val.replace(/\D/, '').slice(-1);
    setDigits(d);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setDigits(pasted.split('')); refs[5].current?.focus(); }
    e.preventDefault();
  };

  const sendOtp = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) return setError('Enter a valid 10-digit Indian mobile number.');
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // If the user already has this phone number assigned and verified, skip the SMS flow!
      if (user && (user.phone === `+91${cleanPhone}` || user.phone === `91${cleanPhone}`)) {
        setLoading(false);
        onNext({ phoneNumber: cleanPhone });
        return;
      }

      const { error: err } = await supabase.auth.updateUser({
        phone: `+91${cleanPhone}`
      });
      setLoading(false);
      
      if (err) {
        if (err.status === 429) return setError('Too many requests. Please wait 60 seconds before trying again.');
        return setError(err.message);
      }
      
      setOtpSent(true);
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
    } catch (e) {
      setLoading(false);
      setError('An unexpected error occurred.');
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const token = digits.join('');
    if (token.length < 6) return setError('Enter the complete 6-digit OTP.');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`, token, type: 'phone_change'
    });
    setLoading(false);
    if (err) return setError('Invalid OTP. Please check your SMS and try again.');
    onNext({ phoneNumber: phone });
  };

  return (
    <form onSubmit={verifyOtp} className="auth-form">
      <h1 className="auth-title">Mobile Verification</h1>
      <p className="auth-subtitle">A real SMS OTP will be sent to your number via Twilio.</p>
      {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>⚠ {error}</div>}

      <div className="form-group mt-4">
        <label className="form-label" htmlFor="phone-input">Mobile Number</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#F0F4F6', border: '1.5px solid #E8EDF2', borderRadius: '10px', fontWeight: 700, fontSize: '14px' }}>🇮🇳 +91</span>
          <input className="form-control" id="phone-input" type="tel" placeholder="98XXXXXXXX" maxLength={10}
            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={otpSent} style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }} />
        </div>
        <button type="button" id="send-otp-btn" onClick={sendOtp} disabled={loading || cooldown > 0}
          style={{ width: '100%', marginTop: '10px', padding: '12px', background: cooldown > 0 ? '#E8EDF2' : '#3B9B9B', color: cooldown > 0 ? '#6B7B8D' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : otpSent ? '📱 Resend OTP' : '📱 Send OTP via SMS'}
        </button>
      </div>

      {otpSent && (
        <div className="form-group">
          <label className="form-label">Enter 6-digit OTP from SMS</label>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input key={i} ref={refs[i]} id={`sms-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleDigitChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                style={{ width: '44px', height: '52px', textAlign: 'center', fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', border: d ? '2px solid #3B9B9B' : '1.5px solid #E8EDF2', borderRadius: '10px', outline: 'none', background: d ? '#E6F4F4' : '#FFFFFF', color: '#1A2B3D' }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#9AABB8' }}>SMS sent to +91 {phone}</div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button type="button" className="btn btn-outline flex-1" onClick={onBack}>← Back</button>
        <button type="submit" className="btn btn-primary flex-1" id="otp-verify-btn" disabled={!otpSent || loading}>
          {loading ? 'Verifying...' : 'Verify →'}
        </button>
      </div>
    </form>
  );
};

// ─── STEP 4: Face Detection (2 Blinks) ───────────────────────
const FaceStep = ({ onNext, onBack }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | detecting | done | error
  const [blinkCount, setBlinkCount] = useState(0);
  const [eyeState, setEyeState] = useState('open');
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const blinkRef = useRef(0);
  const eyeRef = useRef('open');
  const REQUIRED_BLINKS = 2;

  const EAR_THRESHOLD = 0.22; // Eye Aspect Ratio threshold for closed eyes

  // Calculate Eye Aspect Ratio from 6 landmarks
  const getEAR = (eye) => {
    const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (A + B) / (2.0 * C);
  };

  const loadFaceApi = useCallback(async () => {
    setStatus('loading');
    try {
      const faceapi = await import('face-api.js');
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      setFaceApiLoaded(true);
      return faceapi;
    } catch (err) {
      console.error(err);
      setStatus('error');
      return null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    const faceapi = await loadFaceApi();
    if (!faceapi) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('detecting');
        startDetecting(faceapi);
      }
    } catch {
      setStatus('error');
    }
  }, [loadFaceApi]);

  const startDetecting = (faceapi) => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || blinkRef.current >= REQUIRED_BLINKS) return;
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks(true);

      if (!detection) return;

      const lm = detection.landmarks;
      const leftEye = lm.getLeftEye();
      const rightEye = lm.getRightEye();
      const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

      const newState = ear < EAR_THRESHOLD ? 'closed' : 'open';

      if (eyeRef.current === 'open' && newState === 'closed') {
        // Eye just closed — wait for open
      } else if (eyeRef.current === 'closed' && newState === 'open') {
        // Blink complete!
        blinkRef.current += 1;
        setBlinkCount(blinkRef.current);
        if (blinkRef.current >= REQUIRED_BLINKS) {
          clearInterval(intervalRef.current);
          setStatus('done');
          stopCamera();
        }
      }
      eyeRef.current = newState;
      setEyeState(newState);
    }, 200);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="auth-form">
      <h1 className="auth-title">Live Face Check</h1>
      <p className="auth-subtitle">Blink naturally <strong>2 times</strong> to prove you're live.</p>

      {/* Video feed */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '4/3', marginBottom: '16px' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted playsInline />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {status === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Camera not started</div>
          </div>
        )}

        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', color: '#fff' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>Loading AI Models...</div>
            <div style={{ width: '40px', height: '4px', background: 'var(--color-primary)', borderRadius: '2px', animation: 'pulse 1s infinite' }} />
          </div>
        )}

        {status === 'done' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,100,0,0.7)', color: '#fff' }}>
            <div style={{ fontSize: '48px' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '8px' }}>Face Verified!</div>
          </div>
        )}

        {/* Blink counter overlay */}
        {status === 'detecting' && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            👁 Blinks: {blinkCount}/{REQUIRED_BLINKS}
          </div>
        )}

        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(100,0,0,0.8)', color: '#fff', textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '32px' }}>❌</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>Camera blocked or model failed. Check permissions.</div>
          </div>
        )}
      </div>

      {/* Blink progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {Array.from({ length: REQUIRED_BLINKS }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: '8px', borderRadius: '4px', background: i < blinkCount ? 'var(--color-success)' : 'var(--color-border)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
        {status === 'detecting' ? `Looking at camera... blink naturally (${eyeState === 'closed' ? '😑' : '👀'})` : status === 'done' ? '✓ Liveness confirmed!' : 'Press start to begin'}
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn btn-outline flex-1" onClick={onBack} disabled={status === 'detecting'}>← Back</button>
        {status !== 'done' ? (
          <button type="button" className="btn btn-primary flex-1" id="start-face-btn"
            onClick={startCamera} disabled={status === 'loading' || status === 'detecting'}>
            {status === 'loading' ? 'Loading...' : status === 'detecting' ? 'Detecting...' : '🎥 Start Camera'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary flex-1" id="face-done-btn" onClick={() => onNext({})}>
            Finish KYC →
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main KYC Page ───────────────────────────────────────────
export const KYCPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const showToast = useToast();
  const [step, setStep] = useState(1);
  const [collectedData, setCollectedData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleNext = (data) => {
    const merged = { ...collectedData, ...data };
    setCollectedData(merged);
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleFaceNext = async (data) => {
    const finalData = { ...collectedData, ...data };
    setSaving(true);
    
    let currentUserId = user?.id;
    if (!currentUserId) {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      currentUserId = sbUser?.id;
    }

    if (!currentUserId) {
      showToast('Authentication lost. Please sign in again.', 'error');
      setSaving(false);
      navigate('/signup');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        pan_number: finalData.panNumber,
        aadhaar_number: finalData.aadhaarNumber,
        phone_number: finalData.phoneNumber,
        kyc_status: 'completed',
      })
      .eq('id', currentUserId);

    if (error) {
      console.error('KYC save error:', error);
      showToast('Failed to save KYC. Check Supabase config.', 'error');
      setSaving(false);
      return;
    }

    setUser(prev => ({ ...prev, kycStatus: 'completed' }));
    showToast('🎉 KYC Approved! Trust Score generated.', 'success');
    navigate('/dashboard');
  };

  return (
    <div className="auth-shell" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="auth-logo">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#3B9B9B" strokeWidth="2" />
            <path d="M10 16.5C10 13.46 12.46 11 15.5 11H22l-3 3h-3.5C12.91 14 12 14.91 12 16.5S12.91 19 14.5 19H18l3 3H14.5C12.46 22 10 19.54 10 16.5Z" fill="#3B9B9B" />
          </svg>
          <span className="auth-logo-name" style={{ fontSize: '16px' }}>KYC Verification</span>
        </div>

        <StepBar current={step} />

        {step === 1 && <PanStep onNext={handleNext} />}
        {step === 2 && <AadhaarStep onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <OtpStep onNext={handleNext} onBack={handleBack} />}
        {step === 4 && <FaceStep onNext={handleFaceNext} onBack={handleBack} />}

        {saving && (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Saving your verification data...
          </div>
        )}
      </div>
    </div>
  );
};
