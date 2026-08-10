import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Users, UserCheck, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { NPITLogo } from '@/components/common/NPITLogo';

type Role = 'student' | 'teacher' | 'parent';

const TABS: { role: Role; label: string; labelKh: string; icon: React.ElementType; color: string; accent: string }[] = [
  { role: 'student', label: 'Student',  labelKh: 'សិស្ស',      icon: GraduationCap, color: 'text-[#2269ff]',  accent: 'bg-[#2269ff]' },
  { role: 'teacher', label: 'Teacher',  labelKh: 'គ្រូបង្រៀន',  icon: UserCheck,     color: 'text-amber-500',  accent: 'bg-amber-500' },
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
    const cleanEmail = form.email.trim();
    try {
      await axios.post('/auth/register', {
        email:      cleanEmail,
        password:   form.password,
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        role,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login', { state: { email: cleanEmail } }), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeTab = TABS.find(t => t.role === role)!;

  return (
    <div
      className="relative flex min-h-screen min-h-[100dvh] w-full overflow-y-auto items-center justify-center bg-[#0a1f44] bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[800px]">
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-blue-100/80">
          <div>
            {/* Logo */}
            <div className="flex flex-col items-center text-center">
              <div>
                <NPITLogo size={64} className="drop-shadow-md mb-2" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2269ff] leading-tight">
                បង្កើតគណនី (Create Account)
              </h1>
              <p className="text-xs font-bold text-[#ec171c] uppercase tracking-widest mt-0.5">
                NPIT TECHO SEN INSTITUTE
              </p>
            </div>

            {/* Role Tabs */}
            <div className="mt-5 flex rounded-2xl bg-slate-100 p-1 gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = tab.role === role;
                return (
                  <button
                    key={tab.role}
                    type="button"
                    onClick={() => { setRole(tab.role); setError(''); setSuccess(''); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                      isActive ? `${tab.accent} text-white shadow-md` : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.labelKh} ({tab.label})</span>
                  </button>
                );
              })}
            </div>

            {/* Success */}
            {success && (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-bold">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 font-bold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">អ៊ីមែល (Email)</label>
                <input type="email" required value={form.email} onChange={set('email')} placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក..."
                  className="w-full border-b-2 border-slate-300 py-2 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">ពាក្យសម្ងាត់ (Password)</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                    placeholder="យ៉ាងតិច ៦ តួអក្សរ..."
                    className="w-full border-b-2 border-slate-300 py-2 pr-10 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2269ff] transition-colors">
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">បញ្ជាក់ពាក្យសម្ងាត់ (Confirm Password)</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} required value={form.confirm_password} onChange={set('confirm_password')}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ម្ដងទៀត..."
                    className="w-full border-b-2 border-slate-300 py-2 pr-10 text-sm font-semibold text-[#0a1f44] placeholder-slate-400 focus:border-[#2269ff] focus:outline-none transition-colors" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2269ff] transition-colors">
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div>
                <button type="submit" disabled={loading || !!success}
                  className={`mt-2 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors shadow-md disabled:opacity-70 ${activeTab.accent} ${activeTab.role === 'student' ? 'hover:bg-blue-700' : 'hover:bg-red-700'}`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : `ចុះឈ្មោះជា ${activeTab.labelKh} (${activeTab.label.toUpperCase()})`}
                </button>
              </div>
            </form>

            {/* Footer links */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold">
              <Link to="/login" className="flex items-center gap-1 text-[#2269ff] hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> ត្រឡប់ទៅការចូលគណនី (Back to Login)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
