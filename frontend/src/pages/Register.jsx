import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Spinner, Select } from '../components/ui';
import GoogleAuthButton from '../components/GoogleAuthButton';

const ROLE_HOME = { provider: '/provider', customer: '/customer' };

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer';

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: initialRole, city: '', state: '', zip: '',
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'provider' || roleParam === 'customer') {
      setForm((f) => ({ ...f, role: roleParam }));
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        address: { city: form.city, state: form.state, zip: form.zip },
      };
      const user = await register(payload);
      toast.success(`Account created. Welcome, ${user.name.split(' ')[0]}!`);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-x-hidden bg-[#1F2421]">
      {/* Full-Screen Background Photo (Home cleaning specialist) */}
      <img
        src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80"
        alt="Residential deep cleaning specialist"
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

        <h2 className="font-display text-2xl font-bold text-[#1F2421]">Create your account</h2>
        <p className="text-sm text-gray-600 mt-1">Book trusted help, or offer your services as a provider.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Select label="I want to..." value={form.role} onChange={set('role')}>
            <option value="customer">Book home services (Customer)</option>
            <option value="provider">Offer my services (Provider)</option>
          </Select>
          <Input label="Full name" required value={form.name} onChange={set('name')} />
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Password" type="password" required minLength={6} value={form.password} onChange={set('password')} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
          <div className="grid grid-cols-3 gap-2">
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="State" value={form.state} onChange={set('state')} />
            <Input label="Pincode" value={form.zip} onChange={set('zip')} placeholder="Pincode" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner size={16} className="text-white" /> : 'Create account'}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-semibold tracking-wider">
              Or sign up with
            </span>
          </div>
        </div>

        <GoogleAuthButton mode="register" role={form.role} />

        <p className="text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#D98C2B] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
