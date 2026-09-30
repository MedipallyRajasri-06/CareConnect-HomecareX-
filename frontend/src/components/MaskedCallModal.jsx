import { useState, useEffect, useRef } from 'react';
import { bookings as bookingsApi } from '../lib/endpoints';
import { useToast } from '../context/ToastContext';
import { Modal, Button, Avatar, Spinner } from './ui';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Lock,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export default function MaskedCallModal({
  open,
  onClose,
  bookingId,
  otherUser,
  otherRole = 'Professional',
}) {
  const toast = useToast();
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'connected' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callData, setCallData] = useState(null);
  const [loading, setLoading] = useState(false);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const ringOscRef = useRef(null);

  // Initialize Web Audio tone generator for synthesized ringing & tones
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440; // standard US ringtone 440Hz + 480Hz
      osc2.frequency.value = 480;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc1.start();
      osc2.start();

      ringOscRef.current = { osc1, osc2, gain, ctx };
    } catch (err) {
      console.warn('AudioContext not available:', err);
    }
  };

  const stopRingtone = () => {
    try {
      if (ringOscRef.current) {
        ringOscRef.current.osc1?.stop();
        ringOscRef.current.osc2?.stop();
        ringOscRef.current.ctx?.close();
        ringOscRef.current = null;
      }
    } catch (e) {
      // ignore cleanup errors
    }
  };

  const startMaskedCall = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.maskedCall(bookingId);
      setCallData(res.data);
      setCallState('calling');
      playRingtone();

      // Simulate connection after ~2.8 seconds
      setTimeout(() => {
        stopRingtone();
        setCallState('connected');
        setCallDuration(0);
      }, 2800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate masked call.');
      stopRingtone();
      setCallState('idle');
    } finally {
      setLoading(false);
    }
  };

  const endCall = () => {
    stopRingtone();
    setCallState('ended');
    clearInterval(timerRef.current);
    setTimeout(() => {
      setCallState('idle');
      onClose();
    }, 1200);
  };

  // Timer while connected
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  useEffect(() => {
    if (!open) {
      stopRingtone();
      setCallState('idle');
      setCallDuration(0);
      clearInterval(timerRef.current);
    }
  }, [open]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        stopRingtone();
        onClose();
      }}
      title="Private Masked Calling"
      footer={null}
    >
      <div className="space-y-4">
        {/* Privacy Banner */}
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200/80">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Your personal number is 100% hidden</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              CareConnect proxies all audio calls through an encrypted virtual bridge. Neither party sees your real contact number.
            </p>
          </div>
        </div>

        {callState === 'idle' ? (
          <div className="space-y-4 pt-1">
            {/* Target Contact Profile */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <Avatar
                name={otherUser?.name || otherRole}
                color={otherUser?.avatarColor}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-navy-900 truncate">
                    {otherUser?.name || `${otherRole}`}
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {otherRole}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Lock size={12} className="text-emerald-500" />
                  Protected by CareConnect Voice Masking
                </p>
              </div>
            </div>

            {/* Virtual Proxy Number Info */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-muted font-medium">Virtual Relay Line:</span>
                <span className="font-mono font-bold text-navy-900">+91 1800-CARE-829</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-muted font-medium">Private Extension PIN:</span>
                <span className="font-mono font-bold text-amber-700">#4082 (Auto-Connected)</span>
              </div>
            </div>

            {/* Start Call Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={startMaskedCall}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Spinner size={18} className="text-white" />
                ) : (
                  <>
                    <PhoneCall size={18} />
                    <span>Start Secure Web Call</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                Direct HD audio call directly inside your browser. No phone bill or carrier charges.
              </p>
            </div>
          </div>
        ) : (
          /* Active / Ringing Call Screen */
          <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-5 bg-gradient-to-b from-slate-900 to-[#152238] text-white rounded-2xl shadow-xl border border-slate-800">
            {/* Pulsing Avatar */}
            <div className="relative">
              {callState === 'calling' && (
                <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
              )}
              {callState === 'connected' && (
                <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
              )}
              <Avatar
                name={otherUser?.name || otherRole}
                color={otherUser?.avatarColor}
                size={76}
                className="ring-4 ring-white/20 shadow-xl"
              />
            </div>

            {/* Call Status & Recipient */}
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {otherUser?.name || otherRole}
              </h3>
              <p className="text-xs text-amber-400 font-medium uppercase tracking-wider mt-0.5">
                CareConnect Private Masked Line
              </p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
                {callState === 'calling' && (
                  <>
                    <Radio size={12} className="text-emerald-400 animate-spin" />
                    <span>Ringing private proxy...</span>
                  </>
                )}
                {callState === 'connected' && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono font-semibold text-emerald-300">
                      {formatTimer(callDuration)}
                    </span>
                  </>
                )}
                {callState === 'ended' && (
                  <>
                    <CheckCircle2 size={12} className="text-slate-400" />
                    <span>Call Ended</span>
                  </>
                )}
              </div>
            </div>

            {/* Audio Wave Visualizer Simulation */}
            {callState === 'connected' && (
              <div className="flex items-center gap-1.5 h-6">
                {[40, 75, 55, 95, 60, 85, 45, 100, 70, 50, 80].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1 bg-emerald-400 rounded-full animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* In-Call Controls */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isMuted ? 'bg-red-500/80 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff size={24} />
              </button>

              <button
                type="button"
                onClick={() => setIsSpeaker((s) => !s)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isSpeaker ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-slate-700 text-slate-400'
                }`}
                title={isSpeaker ? 'Speaker On' : 'Speaker Off'}
              >
                {isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
