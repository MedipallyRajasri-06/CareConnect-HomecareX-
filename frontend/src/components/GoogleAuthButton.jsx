import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner, Modal, Button } from './ui';
import { ShieldCheck, UserCheck, Sparkles, Check } from 'lucide-react';

const ROLE_HOME = {
  admin: '/admin',
  operations_manager: '/admin',
  support_agent: '/support',
  provider: '/provider',
  customer: '/customer',
};

// Preset demo Google accounts for frictionless 1-click testing & demo
const DEMO_GOOGLE_PROFILES = [
  {
    name: 'Alex Johnson',
    email: 'alex.johnson@gmail.com',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    googleId: 'g_alex_johnson_8892',
  },
  {
    name: 'Priyanshu Sharma',
    email: 'priyanshu.sharma@gmail.com',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    googleId: 'g_priyanshu_sharma_1042',
  },
];

export default function GoogleAuthButton({
  role = 'customer',
  mode = 'login', // 'login' | 'register'
  className = '',
  buttonText = null,
}) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState(role);

  const handleGoogleSuccess = async (profile) => {
    setLoading(true);
    setModalOpen(false);
    try {
      const user = await loginWithGoogle({
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        googleId: profile.googleId || `g_${Date.now()}`,
        role: selectedRole || role,
      });

      toast.success(`Signed in with Google as ${user.name.split(' ')[0]}!`);
      navigate(ROLE_HOME[user.role] || '/customer');
    } catch (err) {
      console.error('Google auth error:', err);
      toast.error(err.response?.data?.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) {
      toast.error('Please enter both name and email.');
      return;
    }
    handleGoogleSuccess({
      name: customName.trim(),
      email: customEmail.trim().toLowerCase(),
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName)}`,
      googleId: `g_${Date.now()}_custom`,
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => setModalOpen(true)}
        className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-150 shadow-xs hover:shadow cursor-pointer select-none active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Spinner size={18} />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>
          {buttonText || (mode === 'register' ? 'Sign up with Google' : 'Continue with Google')}
        </span>
      </button>

      {/* Google Sign-In Selector Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sign in with Google"
        footer={null}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Secure 1-click Google OAuth verification simulated for instant access.</span>
          </div>

          {/* Account Role Selector if Registering */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    selectedRole === 'customer'
                      ? 'bg-amber-50/80 border-[#D98C2B] text-[#925611] font-semibold ring-1 ring-[#D98C2B]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Book Services (Customer)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('provider')}
                  className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    selectedRole === 'provider'
                      ? 'bg-amber-50/80 border-[#D98C2B] text-[#925611] font-semibold ring-1 ring-[#D98C2B]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Offer Services (Provider)
                </button>
              </div>
            </div>
          )}

          {/* Preset Google Accounts */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Choose a Google Account
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {DEMO_GOOGLE_PROFILES.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleGoogleSuccess(p)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                >
                  <img
                    src={p.picture}
                    alt={p.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-amber-400 transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  </div>
                  <Sparkles size={14} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Or Enter Custom Google Email */}
          <div className="pt-2 border-t border-slate-100">
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-700">Or use your own Google account:</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#D98C2B] outline-none"
                />
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#D98C2B] outline-none"
                />
              </div>
              <Button type="submit" className="w-full text-xs py-2">
                Continue with Custom Google Account
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
}
