import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'AUTH_FAILED');
        return;
      }

      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('ERR_NETWORK_FAILURE // CHECK_CONNECTION');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none transition-all placeholder:opacity-30';
  const labelClass =
    'block font-mono text-[10px] text-accent-primary uppercase mb-2 tracking-widest';

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase mb-3">
            SERVERSEAL // AUTH_TERMINAL
          </p>
          <h1 className="font-display text-7xl text-accent-primary tracking-tighter leading-none uppercase">
            SIGN_IN
          </h1>
          <p className="font-mono text-xs text-text-muted mt-3 tracking-[0.2em]">
            CREDENTIALS_REQUIRED // AUTHENTICATED_ACCESS_ONLY
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-status-danger bg-status-danger/10 p-3 font-mono text-status-danger text-xs mb-6">
            [!] {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              placeholder="operator@serverseal.io"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className={labelClass}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className={`btn-industrial w-full py-4 flex items-center justify-center transition-all duration-300
                ${(isSubmitting || !email || !password)
                  ? 'opacity-20 cursor-not-allowed grayscale scale-[0.98]'
                  : 'opacity-100 cursor-pointer active:scale-[0.97]'
                }`}
            >
              {isSubmitting ? (
                <span className="animate-pulse">AUTHENTICATING...</span>
              ) : (
                'ACCESS_SYSTEM'
              )}
            </button>
          </div>
        </form>

        <p className="font-mono text-[9px] text-text-muted text-center mt-8 tracking-widest">
          UNAUTHORIZED_ACCESS_PROHIBITED // ACTIONS_LOGGED
        </p>
      </div>
    </div>
  );
}
