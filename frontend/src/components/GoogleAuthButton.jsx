import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner, Modal, Button } from './ui';
import { KeyRound, ExternalLink, AlertCircle } from 'lucide-react';

const ROLE_HOME = {
  admin: '/admin',
  operations_manager: '/admin',
  support_agent: '/support',
  provider: '/provider',
  customer: '/customer',
};

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
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  // Priority: 1) Vite env variable 2) LocalStorage runtime override
  const getGoogleClientId = () => {
    const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envId && !envId.includes('your-google-client-id') && envId.trim().length > 10) {
      return envId.trim();
    }
    const stored = localStorage.getItem('cc_google_client_id');
    if (stored && stored.trim().length > 10) {
      return stored.trim();
    }
    return null;
  };

  // Full-page redirect fallback (used if popup is blocked or requested)
  const startRedirectOAuth = (clientId) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const state = encodeURIComponent(JSON.stringify({ role, mode, from: window.location.pathname }));
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token%20id_token` +
      `&scope=openid%20email%20profile` +
      `&prompt=select_account` +
      `&nonce=${Math.random().toString(36).substring(2)}` +
      `&state=${state}`;

    window.location.href = authUrl;
  };

  // Ensure Google Identity Services script is loaded
  const loadGoogleScript = () => {
    return new Promise((resolve) => {
      if (window.google?.accounts?.oauth2) {
        return resolve(true);
      }
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        // If already loaded in head
        if (window.google?.accounts) return resolve(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      }
    });
  };

  const handleGoogleClick = async () => {
    const clientId = getGoogleClientId();

    // If client ID is missing, guide the developer/user to set VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setConfigModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const isLoaded = await loadGoogleScript();
      if (!isLoaded || !window.google?.accounts?.oauth2) {
        // Fallback to official Google OAuth 2.0 full-page redirect flow
        startRedirectOAuth(clientId);
        return;
      }

      // Initialize official Google Identity Services token client
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setLoading(false);
            if (tokenResponse.error === 'access_denied') {
              toast.info('Google sign-in was cancelled.');
            } else {
              toast.error(`Google authentication error: ${tokenResponse.error}`);
            }
            return;
          }

          try {
            // Verify access token with backend
            const user = await loginWithGoogle({
              accessToken: tokenResponse.access_token,
              role,
            });

            toast.success(`Signed in with Google as ${user.name}!`);
            navigate(ROLE_HOME[user.role] || '/customer');
          } catch (err) {
            console.error('Backend Google Auth error:', err);
            toast.error(err.response?.data?.message || 'Google authentication could not be completed.');
          } finally {
            setLoading(false);
          }
        },
        error_callback: (err) => {
          setLoading(false);
          if (err?.type === 'popup_closed') {
            toast.info('Google sign-in was cancelled.');
          } else if (err?.type === 'popup_blocked') {
            toast.warning('Google sign-in popup was blocked by your browser. Redirecting to Google...');
            startRedirectOAuth(clientId);
          } else {
            console.warn('Google GIS error:', err);
            // Fallback to full-page redirect
            startRedirectOAuth(clientId);
          }
        },
      });

      // Prompt real Google account chooser dialog
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err);
      // Fallback directly to full-page redirect
      startRedirectOAuth(clientId);
    }
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    if (!clientIdInput.trim() || clientIdInput.trim().length < 15) {
      toast.error('Please enter a valid Google Client ID from Google Cloud Console.');
      return;
    }
    localStorage.setItem('cc_google_client_id', clientIdInput.trim());
    setConfigModalOpen(false);
    toast.success('Google Client ID saved! Initiating Google Sign-In...');
    setTimeout(() => handleGoogleClick(), 300);
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleClick}
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

      {/* Developer Configuration Modal if Google Client ID is not yet provided */}
      <Modal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="Google OAuth Configuration"
        footer={null}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Google Client ID Required</p>
              <p className="text-amber-800 leading-relaxed">
                To initiate real Google OAuth sign-in, add your Google OAuth Client ID to your frontend environment or enter it below.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
            <p className="font-semibold text-navy-900 flex items-center gap-1.5">
              <KeyRound size={14} className="text-[#D98C2B]" />
              Setup in Google Cloud Console:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>
                Create an OAuth 2.0 Client ID at{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  Google Cloud Console <ExternalLink size={10} />
                </a>
              </li>
              <li>
                Add to <strong>Authorized JavaScript origins</strong>:
                <code className="block mt-1 p-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-navy-900">
                  {window.location.origin}
                </code>
              </li>
              <li>
                Add to <strong>Authorized redirect URIs</strong>:
                <code className="block mt-1 p-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-navy-900">
                  {window.location.origin}/auth/google/callback
                </code>
              </li>
            </ol>
          </div>

          <form onSubmit={handleSaveClientId} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Paste Google Client ID:
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#D98C2B] outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                You can also add <code className="text-navy-900 font-bold">VITE_GOOGLE_CLIENT_ID</code> to <code className="text-navy-900 font-bold">frontend/.env</code>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setConfigModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!clientIdInput.trim()}>
                Save & Continue to Google
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
