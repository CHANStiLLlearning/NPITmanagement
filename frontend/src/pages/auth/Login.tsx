import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, UserCheck, GraduationCap, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { NPITLogo } from '@/components/common/NPITLogo';
import { motion, AnimatePresence } from 'framer-motion';

// Floating particle component
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
  { x: 10, y: 20, size: 8,  delay: 0,   duration: 4 },
  { x: 25, y: 70, size: 14, delay: 1,   duration: 5 },
  { x: 50, y: 10, size: 6,  delay: 0.5, duration: 3.5 },
  { x: 75, y: 55, size: 10, delay: 1.5, duration: 6 },
  { x: 88, y: 25, size: 18, delay: 0.8, duration: 4.5 },
  { x: 60, y: 85, size: 7,  delay: 2,   duration: 5.5 },
  { x: 35, y: 40, size: 12, delay: 0.3, duration: 3.8 },
  { x: 92, y: 80, size: 9,  delay: 1.2, duration: 4.2 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5 },
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      formData.append('remember_me', rememberMe.toString());

      const response = await axios.post('http://localhost:8000/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      login(response.data.access_token, response.data.refresh_token);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Invalid username or password.');
      }
      setShakeKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden items-center justify-center bg-[#0a1f44] bg-cover bg-center px-4 py-4"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Darkened Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />

      {/* Floating Particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Animated pulsing rings behind the card */}
      <motion.div
        className="absolute rounded-full border border-white/10 pointer-events-none"
        style={{ width: 500, height: 500 }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full border border-white/10 pointer-events-none"
        style={{ width: 700, height: 700 }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.03, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Main Card */}
      <motion.div
        key={shakeKey}
        variants={shakeVariants}
        animate={error ? 'shake' : 'idle'}
        className="relative z-10 w-full max-w-[540px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-blue-100/80 max-h-[96vh] overflow-y-auto"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo & Title */}
            <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
              >
                <NPITLogo size={76} className="drop-shadow-md mb-2" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2269ff] leading-tight">
                វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#ec171c] uppercase tracking-widest mt-1">
                NPIT TECHO SEN INSTITUTE
              </p>
            </motion.div>



            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs sm:text-sm text-rose-700 font-bold overflow-hidden"
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs sm:text-sm font-bold text-[#2269ff] uppercase tracking-wider mb-1">
                  អ៊ីមែល (Email)
                </label>
                <input
                  type="email"
                  required
                  placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-b-2 border-slate-300 py-2.5 text-sm sm:text-base font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors"
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-xs sm:text-sm font-bold text-[#2269ff] uppercase tracking-wider mb-1">
                  ពាក្យសម្ងាត់ (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="បញ្ចូលពាក្យសម្ងាត់របស់អ្នក..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b-2 border-slate-300 py-2.5 pr-10 text-sm sm:text-base font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2269ff] transition-colors"
                    tabIndex={-1}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showPassword ? 'off' : 'on'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>

              {/* Remember Me */}
              <motion.div variants={itemVariants} className="flex items-center pt-1">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-xs sm:text-sm font-semibold text-[#1c3a73] cursor-pointer">
                  ចងចាំខ្ញុំ (Remember me)
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 8px 24px rgba(236,23,28,0.35)' }}
                  whileTap={loading ? {} : { scale: 0.97 }}
                  className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#ec171c] py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-md disabled:opacity-70"
                >
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="h-5 w-5" />
                    </motion.span>
                  ) : 'ចូលគណនី (SIGN IN)'}
                </motion.button>
              </motion.div>
            </form>

            {/* Footer links */}
            <motion.div variants={itemVariants} className="mt-3.5 flex items-center justify-center gap-4 text-xs sm:text-sm font-bold">
              <Link to="/forgot-password" className="text-slate-500 hover:text-[#2269ff] hover:underline transition-colors">
                ភ្លេចពាក្យសម្ងាត់?
              </Link>
              <span className="text-slate-300">|</span>
              <Link to="/register" className="text-[#2269ff] hover:underline">
                បង្កើតគណនី
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
