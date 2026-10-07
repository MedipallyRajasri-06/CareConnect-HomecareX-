import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Spinner } from '../components/ui';

const ROLE_HOME = {
  admin: '/admin',
  operations_manager: '/admin',
  support_agent: '/support',
  provider: '/provider',
  customer: '/customer',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-x-hidden bg-[#1F2421]">
      {/* Full-Screen Background Photo (Plumber servicing fixtures) */}
      <img
        src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1920&q=80"
        alt="Plumber servicing plumbing fixtures"
        className="fixed inset-0 w-screen h-screen object-cover object-center pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {/* Dark overlay gradient from new navbar color #1F2421 (~45-65% opacity) */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background:
            'linear-gradient(135deg, rgba(31, 36, 33, 0.48) 0%, rgba(31, 36, 33, 0.65) 100%)',
        }}
      />

      {/* Centered Floating Card (~420-480px max width) */}
      <div className="relative z-10 w-full max-w-[460px] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/40 p-8 sm:p-10 my-8">
        {/* HomeCareX Logo / Wordmark inside the card */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="flex flex-col items-center group">
            <img
              src="/homecarex-logo.png"
              alt="HomeCareX"
              className="h-16 w-auto max-w-[220px] object-contain mb-2 drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center text-2xl font-['Space_Grotesk'] font-bold tracking-tight">
              <span className="text-[#152238]">HomeCare</span>
              <span className="text-[#2F8F5B]">X</span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Trusted Home Services. All in One Place.
            </p>
          </Link>
        </div>

        <h2 className="font-display text-2xl font-bold text-[#1F2421]">Sign in</h2>
        <p className="text-sm text-gray-600 mt-1">Enter your credentials to access your account.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={16} className="text-white" /> : 'Sign in'}
          </Button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          New here?{' '}
          <Link to="/register" className="text-[#D98C2B] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
