import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, User, BadgeCheck, Camera } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-50 text-[#ec171c] border-red-200',
  admin: 'bg-orange-50 text-orange-700 border-orange-200',
  principal: 'bg-purple-50 text-purple-700 border-purple-200',
  teacher: 'bg-blue-50 text-[#2269ff] border-blue-200',
  student: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  parent: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();

  const handleAvatarUpload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    await axios.post('/users/me/avatar', fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    await refetchUser();
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="h-6 w-6 rounded-full border-2 border-[#2269ff] border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-semibold">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-[#0a1f44]">My Profile</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your personal information and profile photo</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-3xl bg-white border border-blue-100 shadow-lg overflow-hidden"
        >
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-[#2269ff] via-blue-500 to-violet-600 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar (overlapping banner) */}
            <div className="-mt-14 mb-4 flex items-end justify-between">
              <div className="ring-4 ring-white rounded-full shadow-xl">
                <AvatarUpload
                  currentUrl={user.photo_url}
                  name={fullName}
                  size={100}
                  onUpload={handleAvatarUpload}
                />
              </div>
              <span className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-wide ${ROLE_COLORS[user.role] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>

            {/* Name & email */}
            <h2 className="text-2xl font-black text-[#0a1f44] mb-1">{fullName}</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">{user.email}</p>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard icon={User} label="First Name" value={user.first_name || '—'} />
              <InfoCard icon={User} label="Last Name" value={user.last_name || '—'} />
              <InfoCard icon={Mail} label="Email" value={user.email} />
              <InfoCard icon={ShieldCheck} label="Role" value={ROLE_LABELS[user.role] ?? user.role} />
              <InfoCard icon={BadgeCheck} label="Account Status" value="Active" />
            </div>

            {/* Upload hint */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <Camera className="h-4 w-4 text-[#2269ff] shrink-0" />
              <p className="text-xs text-[#2269ff] font-semibold">
                Click your avatar above to upload a new profile photo (JPG, PNG, WEBP — max 5 MB)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0">
        <Icon className="h-4 w-4 text-[#2269ff]" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-[#0a1f44]">{value}</p>
      </div>
    </div>
  );
}
