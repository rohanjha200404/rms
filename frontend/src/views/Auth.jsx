import { useEffect, useState } from 'react';
import Captcha from '../components/Captcha';
import { api } from '../services/api';

export default function Auth({ onLogin, notify }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({});
  const [captcha, setCaptcha] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => api('/captcha').then(setCaptcha);
  useEffect(() => {
    let active = true;
    refresh().catch((requestError) => {
      if (active) setError(requestError.message);
    });
    return () => { active = false; };
  }, []);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const path = mode === 'login' ? '/auth/login' : mode === 'register' ? '/auth/register' : '/auth/forgot-password';
      const result = await api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, captchaId: captcha.id, captchaAnswer: captcha.answer }) });
      if (mode === 'forgot') {
        notify(result.message);
      } else if (mode === 'register') {
        notify('Account created successfully. Please sign in.');
        setMode('login');
        setForm({});
        refresh();
      } else {
        onLogin(result);
        notify('Signed in successfully.');
      }
    } catch (requestError) { setError(requestError.message); notify(requestError.message, 'error'); refresh(); } finally { setBusy(false); }
  };
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <main className="auth-shell"><section className="brand-panel"><div className="brand-mark"><img src="/gs-logo.png" alt="GS Insurance" /></div><p className="eyebrow">GS INSURANCE</p><h1>Renew with confidence.</h1><p className="brand-copy">A calmer, clearer way to keep every customer protected and every renewal on track.</p><div className="trust-row"><span>●</span> Secure workspace for insurance teams</div></section><section className="auth-card"><div className="mobile-brand"><div className="brand-mark small"><img src="/gs-logo.png" alt="" /></div><strong>GS Insurance</strong></div><p className="eyebrow">WELCOME BACK</p><h2>{mode === 'login' ? 'Sign in to your workspace' : mode === 'register' ? 'Create your account' : 'Reset your password'}</h2><p className="subtitle">{mode === 'login' ? 'Manage renewals with clarity and control.' : mode === 'register' ? 'Start your secure renewal workspace today.' : 'Enter your email and we’ll help you get back in.'}</p>{error && <div className="alert">{error}</div>}<form onSubmit={submit}>{mode === 'register' && <label>Full name<input required value={form.name || ''} onChange={update('name')} placeholder="Rohan Jha" /></label>}<label>Email address<input required type="email" value={form.email || ''} onChange={update('email')} placeholder="you@company.com" /></label>{mode !== 'forgot' && <label>Password<input required minLength="8" type="password" value={form.password || ''} onChange={update('password')} placeholder="At least 8 characters" /></label>}<Captcha value={captcha} onChange={(answer) => setCaptcha({ ...captcha, answer })} refresh={refresh} /><button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'} <span>→</span></button></form><div className="auth-links">{mode === 'login' && <><button onClick={() => setMode('forgot')}>Forgot password?</button><span>·</span><button onClick={() => setMode('register')}>Create an account</button></>}{mode !== 'login' && <button onClick={() => setMode('login')}>← Back to sign in</button>}</div></section></main>;
}
