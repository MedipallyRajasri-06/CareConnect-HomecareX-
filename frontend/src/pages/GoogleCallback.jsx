import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';

const ROLE_HOME = {
  admin: '/admin',
  operations_manager: '/admin',
  support_agent: '/support',
  provider: '/provider',
  customer: '/customer',
};

export default function GoogleCallback() {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processAuth = async () => {
      try {
        // Parse params from both hash (#access_token=...) and query string (?code=...)
        const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
        const queryParams = new URLSearchParams(location.search);

        const error = hashParams.get('error') || queryParams.get('error');
        if (error) {
          if (error === 'access_denied') {
            toast.info('Google sign-in was cancelled.');
          } else {
            const desc = hashParams.get('error_description') || queryParams.get('error_description') || error;
            toast.error(`Google authentication error: ${desc}`);
          }
          navigate('/login', { replace: true });
          return;
        }

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const idToken = hashParams.get('id_token') || queryParams.get('id_token');
        const code = queryParams.get('code');

        if (!accessToken && !idToken && !code) {
          setErrorMsg('No authentication token received from Google.');
          toast.error('No Google credentials found in the callback.');
          navigate('/login', { replace: true });
          return;
        }

        // Parse optional state (e.g. { role: 'customer' })
        let role = 'customer';
        const rawState = hashParams.get('state') || queryParams.get('state');
        if (rawState) {
          try {
            const decoded = JSON.parse(decodeURIComponent(rawState));
            if (decoded.role) role = decoded.role;
          } catch (e) {
            // state might be base64
            try {
              const decoded = JSON.parse(atob(rawState));
              if (decoded.role) role = decoded.role;
            } catch (err) {
              // ignore state parse errors
            }
          }
        }

        const user = await loginWithGoogle({
          accessToken: accessToken || undefined,
          idToken: idToken || undefined,
          code: code || undefined,
          role,
        });

        toast.success(`Signed in with Google as ${user.name}!`);
        navigate(ROLE_HOME[user.role] || '/', { replace: true });
      } catch (err) {
        console.error('[GoogleCallback] Authentication error:', err);
        const msg = err.response?.data?.message || 'Google authentication could not be completed.';
        setErrorMsg(msg);
        toast.error(msg);
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    processAuth();
  }, [location, loginWithGoogle, navigate, toast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#1F2421]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 text-center space-y-5">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs mb-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
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
          </div>
          <h2 className="font-display text-xl font-bold text-navy-900">
            {errorMsg ? 'Authentication Failed' : 'Signing in with Google...'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {errorMsg
              ? errorMsg
              : 'Verifying your official Google account credentials with CareConnect.'}
          </p>
        </div>

        {!errorMsg ? (
          <div className="py-4 flex justify-center">
            <Spinner size={32} className="text-[#D98C2B]" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 bg-[#152238] hover:bg-[#1f3150] text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Return to Sign In
          </button>
        )}
      </div>
    </div>
  );
}
