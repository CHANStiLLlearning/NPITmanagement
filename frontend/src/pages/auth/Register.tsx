import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Users, UserCheck, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { NPITLogo } from '@/components/common/NPITLogo';
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'student' | 'teacher' | 'admin' | 'parent';

function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/10 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const PARTICLES = [
  { x: 8,  y: 15, size: 10, delay: 0,   duration: 4 },
  { x: 22, y: 75, size: 14, delay: 1,   duration: 5 },
  { x: 55, y: 8,  size: 6,  delay: 0.5, duration: 3.5 },
  { x: 80, y: 50, size: 10, delay: 1.5, duration: 6 },
  { x: 90, y: 20, size: 18, delay: 0.8, duration: 4.5 },
  { x: 65, y: 90, size: 7,  delay: 2,   duration: 5.5 },
  { x: 38, y: 45, size: 12, delay: 0.3, duration: 3.8 },
  { x: 95, y: 85, size: 9,  delay: 1.2, duration: 4.2 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const TABS: { role: Role; label: string; labelKh: string; icon: React.ElementType; color: string; accent: string }[] = [
  { role: 'student', label: 'Student',  labelKh: 'សិស្ស',      icon: GraduationCap, color: 'text-[#2269ff]',  accent: 'bg-[#2269ff]' },
  { role: 'teacher', label: 'Teacher',  labelKh: 'គ្រូបង្រៀន',  icon: UserCheck,     color: 'text-amber-500',  accent: 'bg-amber-500' },
  { role: 'admin',   label: 'Admin',    labelKh: 'អ្នកគ្រប់គ្រង', icon: ShieldCheck,   color: 'text-emerald-500',accent: 'bg-emerald-500' },
  { role: 'parent',  label: 'Parent',   labelKh: 'មាតាបិតា',   icon: Users,         color: 'text-[#ec171c]',  accent: 'bg-[#ec171c]' },
];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('student');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/auth/register', {
        email:      form.email,
        password:   form.password,
        first_name: form.first_name,
        last_name:  form.last_name,
        role,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeTab = TABS.find(t => t.role === role)!;

  return (
    <div
      className="relative flex min-h-screen w-screen overflow-hidden items-center justify-center bg-[#0a1f44] bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" />

      {/* Particles */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* Pulsing rings */}
      <motion.div className="absolute rounded-full border border-white/10 pointer-events-none" style={{ width: 600, height: 600 }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.04, 0.12] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[520px]"
      >
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-blue-100/80">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Logo */}
            <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
              >
                <NPITLogo size={64} className="drop-shadow-md mb-2" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2269ff] leading-tight">
                បង្កើតគណនី (Create Account)
              </h1>
              <p className="text-xs font-bold text-[#ec171c] uppercase tracking-widest mt-0.5">
                NPIT TECHO SEN INSTITUTE
              </p>
            </motion.div>

            {/* Role Tabs */}
            <motion.div variants={itemVariants} className="mt-5 flex rounded-2xl bg-slate-100 p-1 gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = tab.role === role;
                return (
                  <motion.button
                    key={tab.role}
                    type="button"
                    onClick={() => { setRole(tab.role); setError(''); setSuccess(''); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                      isActive ? `${tab.accent} text-white shadow-md` : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.labelKh} ({tab.label})</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-bold overflow-hidden"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 font-bold overflow-hidden"
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {/* Name row */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">នាមខ្លួន (First Name)</label>
                  <input required value={form.first_name} onChange={set('first_name')} placeholder="បញ្ចូលនាមខ្លួន..."
                    className="w-full border-b-2 border-slate-300 py-2 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">នាមត្រកូល (Last Name)</label>
                  <input required value={form.last_name} onChange={set('last_name')} placeholder="បញ្ចូលនាមត្រកូល..."
                    className="w-full border-b-2 border-slate-300 py-2 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">អ៊ីមែល (Email)</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក..."
                  className="w-full border-b-2 border-slate-300 py-2 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">ពាក្យសម្ងាត់ (Password)</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                    placeholder="យ៉ាងតិច ៦ តួអក្សរ..."
                    className="w-full border-b-2 border-slate-300 py-2 pr-10 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
                  <motion.button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2269ff] transition-colors">
                    <AnimatePresence mode="wait">
                      <motion.span key={showPass ? 'off' : 'on'}
                        initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}>
                        {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">បញ្ជាក់ពាក្យសម្ងាត់ (Confirm Password)</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} required value={form.confirm_password} onChange={set('confirm_password')}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ម្ដងទៀត..."
                    className="w-full border-b-2 border-slate-300 py-2 pr-10 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
                  <motion.button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2269ff] transition-colors">
                    <AnimatePresence mode="wait">
                      <motion.span key={showConfirm ? 'off' : 'on'}
                        initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}>
                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <motion.button type="submit" disabled={loading || !!success}
                  whileHover={loading || success ? {} : { scale: 1.02, boxShadow: activeTab.role === 'student' ? '0 8px 24px rgba(34,105,255,0.35)' : '0 8px 24px rgba(236,23,28,0.35)' }}
                  whileTap={loading || success ? {} : { scale: 0.97 }}
                  className={`mt-2 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors shadow-md disabled:opacity-70 ${activeTab.accent} ${activeTab.role === 'student' ? 'hover:bg-blue-700' : 'hover:bg-red-700'}`}
                >
                  {loading ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 className="h-5 w-5" />
                    </motion.span>
                  ) : `ចុះឈ្មោះជា ${activeTab.labelKh} (${activeTab.label.toUpperCase()})`}
                </motion.button>
              </motion.div>
            </form>

            {/* Footer links */}
            <motion.div variants={itemVariants} className="mt-4 flex items-center justify-center gap-4 text-xs font-bold">
              <Link to="/login" className="flex items-center gap-1 text-[#2269ff] hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> ត្រឡប់ទៅការចូលគណនី (Back to Login)
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
