import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, UserPlus, Search, ShieldCheck, Mail, Trash2, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserItem {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
}

export default function UsersManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('teacher');

  const { data: users = [], isLoading, refetch } = useQuery<UserItem[]>({
    queryKey: ['users', search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:8000/users/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      return await axios.post('http://localhost:8000/users/', {
        email, password, first_name: firstName, last_name: lastName, role, is_active: true
      }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEmail(''); setPassword(''); setFirstName(''); setLastName('');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('access_token');
      return await axios.delete(`http://localhost:8000/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  return (
    <Layout>
      <div className="space-y-6 pb-12 bg-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-[#2269ff]">គ្រប់គ្រងអ្នកប្រើប្រាស់ (User Management)</h1>
            <p className="text-xs text-slate-500 font-medium">Manage NPIT user accounts, security roles, and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> ធ្វើបច្ចុប្បន្នភាព
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold" size="sm">
              <UserPlus className="mr-1.5 h-4 w-4" /> បន្ថែមអ្នកប្រើប្រាស់ថ្មី (Add User)
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម អ៊ីមែល ឬ ឈ្មោះ... (Search users)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-blue-200 pl-10 pr-4 py-2 text-xs font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-blue-200 px-4 py-2 text-xs font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none">
            <option value="">គ្រប់តួនាទីទាំងអស់ (All Roles)</option>
            <option value="super_admin">Super Admin</option>
            <option value="principal">Principal</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-50/60 text-[#2269ff] uppercase font-black tracking-wider border-b border-blue-100">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">ឈ្មោះពេញ (Full Name)</th>
                <th className="px-6 py-3.5">អ៊ីមែល (Email)</th>
                <th className="px-6 py-3.5">តួនាទី (Role)</th>
                <th className="px-6 py-3.5">ស្ថានភាព (Status)</th>
                <th className="px-6 py-3.5 text-right">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-[#122b59]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500">#{u.id}</td>
                  <td className="px-6 py-4 text-[#0a1f44]">
                    {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#2269ff]">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                      u.role === 'super_admin' ? 'bg-red-50 text-[#ec171c] border border-red-200' :
                      u.role === 'teacher' ? 'bg-blue-50 text-[#2269ff] border border-blue-200' :
                      'bg-amber-50 text-[#ca8a04] border border-amber-200'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-black border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteUserMutation.mutate(u.id)}
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-100">
              <h3 className="text-base font-black text-[#2269ff] mb-4">បន្ថែមអ្នកប្រើប្រាស់ថ្មី (Create New User)</h3>
              <form onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1c3a73] mb-1">អ៊ីមែល (Email)</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold focus:border-[#2269ff] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1c3a73] mb-1">ពាក្យសម្ងាត់ (Password)</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold focus:border-[#2269ff] focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1c3a73] mb-1">នាមខ្លួន (First Name)</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold focus:border-[#2269ff] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1c3a73] mb-1">គោត្តនាម (Last Name)</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold focus:border-[#2269ff] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1c3a73] mb-1">តួនាទី (Role)</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold focus:border-[#2269ff] focus:outline-none">
                    <option value="super_admin">Super Admin</option>
                    <option value="principal">Principal</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>បោះបង់ (Cancel)</Button>
                  <Button type="submit" className="bg-[#2269ff] text-white font-bold">បង្កើត (Create)</Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
