import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { NPITLogo } from '@/components/common/NPITLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[800px]">
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-blue-100/80 max-h-[96vh] overflow-y-auto">
          <div>
            {/* Logo & Title */}
            <div className="flex flex-col items-center text-center">
              <div>
                <NPITLogo size={76} className="drop-shadow-md mb-2" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2269ff] leading-tight">
                វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#ec171c] uppercase tracking-widest mt-1">
                NPIT TECHO SEN INSTITUTE
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs sm:text-sm text-rose-700 font-bold overflow-hidden">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
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
              </div>

              {/* Password */}
              <div>
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
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2269ff] transition-colors"
                    tabIndex={-1}
                  >
                    <span>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-1">
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
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#ec171c] py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider text-white hover:bg-red-700 transition-colors shadow-md disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'ចូលគណនី (SIGN IN)'
                  )}
                </button>
              </div>
            </form>

            {/* Footer links */}
            <div className="mt-3.5 flex items-center justify-center gap-4 text-xs sm:text-sm font-bold">
              <Link to="/forgot-password" className="text-slate-500 hover:text-[#2269ff] hover:underline transition-colors">
                ភ្លេចពាក្យសម្ងាត់?
              </Link>
              <span className="text-slate-300">|</span>
              <Link to="/register" className="text-[#2269ff] hover:underline">
                បង្កើតគណនី
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

