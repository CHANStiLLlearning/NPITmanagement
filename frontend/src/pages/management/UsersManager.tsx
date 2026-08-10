import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, UserPlus, Search, ShieldCheck, Mail, Trash2, Edit, RefreshCw, Camera, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { getMediaUrl } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';

interface UserItem {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  photo_url?: string;
}

export default function UsersManager() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('teacher');
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery<UserItem[]>({
    queryKey: ['users', search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`/users/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      return await axios.post('/users/', {
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
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      return await axios.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      // Filter out self user id
      const deletableIds = ids.filter(id => id !== currentUser?.id);
      return await Promise.all(
        deletableIds.map(id => axios.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const token = localStorage.getItem('access_token');
      const fd = new FormData(); fd.append('file', file);
      const { data } = await axios.post(`/users/${id}/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const [avatarUserId, setAvatarUserId] = useState<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const handleAvatarClick = (userId: number) => {
    setAvatarUserId(userId);
    setTimeout(() => avatarInputRef.current?.click(), 50);
  };
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarUserId) return;
    await avatarMutation.mutateAsync({ id: avatarUserId, file });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    setAvatarUserId(null);
  };

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

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-600 text-white text-xs font-black">
                {selectedIds.length}
              </span>
              <p className="text-xs font-bold text-rose-900">
                បានជ្រើសរើស {selectedIds.length} អ្នកប្រើប្រាស់ (Selected {selectedIds.length} Users)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds([])} className="text-xs font-bold">
                Deselect All
              </Button>
              <Button size="sm" onClick={() => setIsBulkDeleteOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-xs">
                <Trash2 className="h-4 w-4" />
                <span>លុបទាំងអស់ដែលបានជ្រើសរើស ({selectedIds.length})</span>
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-blue-100 bg-white shadow-2xs">
          {/* Hidden file input for per-row avatar upload */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-50/60 text-[#2269ff] uppercase font-black tracking-wider border-b border-blue-100">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={
                      users.filter(u => u.id !== currentUser?.id && u.email !== currentUser?.email).length > 0 &&
                      users.filter(u => u.id !== currentUser?.id && u.email !== currentUser?.email).every(u => selectedIds.includes(u.id))
                    }
                    onChange={() => {
                      const deletableUsers = users.filter(u => u.id !== currentUser?.id && u.email !== currentUser?.email);
                      if (deletableUsers.every(u => selectedIds.includes(u.id))) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(deletableUsers.map(u => u.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-blue-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">អ៊ីមែល (Email)</th>
                <th className="px-6 py-3.5">តួនាទី (Role)</th>
                <th className="px-6 py-3.5">ស្ថានភាព (Status)</th>
                <th className="px-6 py-3.5 text-right">សកម្មភាព (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-[#122b59]">
              {users.map((u) => {
                const isSelf = currentUser?.email === u.email || currentUser?.id === u.id;
                const isSelected = selectedIds.includes(u.id);
                return (
                  <tr key={u.id} className={`hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        disabled={isSelf}
                        checked={isSelected && !isSelf}
                        onChange={() => {
                          if (isSelf) return;
                          setSelectedIds(prev =>
                            prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className={`h-4 w-4 rounded border-blue-300 text-[#2269ff] focus:ring-[#2269ff] ${isSelf ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photo_url ? (
                          <img src={getMediaUrl(u.photo_url)} alt="" className="h-9 w-9 rounded-full object-cover border-2 border-blue-100 shrink-0" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2269ff] to-blue-800 text-xs font-black text-white shrink-0">
                            {u.first_name?.[0] ?? u.email[0].toUpperCase()}{u.last_name?.[0] ?? ''}
                          </div>
                        )}
                        <div>
                          <span className="text-[#0a1f44]">
                            {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'N/A'}
                          </span>
                          {isSelf && (
                            <span className="ml-2 rounded-full bg-blue-100 text-[#2269ff] px-2 py-0.5 text-[9px] font-black">
                              (You)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[#2269ff]">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase border ${
                        u.role === 'super_admin' ? 'bg-red-100 text-red-700 border-red-200' :
                        u.role === 'admin'       ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        u.role === 'principal'   ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        u.role === 'teacher'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        u.role === 'student'     ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        u.role === 'parent'      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleAvatarClick(u.id)}
                          title="Upload Photo"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[#2269ff] transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={isSelf}
                          title={isSelf ? "មិនអាចលុបគណនីផ្ទាល់ខ្លួនបានទេ (Cannot delete your own account)" : "Delete User"}
                          className={`rounded-lg p-1.5 transition-colors ${
                            isSelf
                              ? 'text-slate-300 cursor-not-allowed opacity-50'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

        {/* Delete User Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-base font-black">លុបគណនីអ្នកប្រើប្រាស់ (Delete User Account)</h3>
                </div>
                <button onClick={() => setDeleteTarget(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-600 mb-4">
                តើអ្នកប្រាកដជាចង់លុបគណនី <strong>{deleteTarget.email}</strong> ({deleteTarget.first_name || deleteTarget.last_name ? `${deleteTarget.first_name || ''} ${deleteTarget.last_name || ''}`.trim() : 'User'}) មែនទេ?
                <span className="block mt-1 text-rose-500 font-bold">សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានទេ! (This action cannot be undone)</span>
              </p>
              {deleteUserMutation.isError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  មិនអាចលុបអ្នកប្រើប្រាស់បានទេ (Failed to delete user)
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setDeleteTarget(null)}>
                  បោះបង់ (Cancel)
                </Button>
                <Button
                  onClick={() => deleteUserMutation.mutate(deleteTarget.id)}
                  disabled={deleteUserMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  {deleteUserMutation.isPending ? 'កំពុងលុប...' : 'លុបអ្នកប្រើប្រាស់ (Confirm Delete)'}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Bulk Delete User Confirmation Modal */}
        {isBulkDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-base font-black">លុបអ្នកប្រើប្រាស់ដែលបានជ្រើសរើស (Bulk Delete Users)</h3>
                </div>
                <button onClick={() => setIsBulkDeleteOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-600 mb-4">
                តើអ្នកប្រាកដជាចង់លុប <strong>{selectedIds.length} គណនីអ្នកប្រើប្រាស់</strong> ដែលបានជ្រើសរើសមែនទេ?
                <span className="block mt-1 text-rose-500 font-bold">សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានទេ! (This action cannot be undone)</span>
              </p>
              {bulkDeleteMutation.isError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  មិនអាចលុបអ្នកប្រើប្រាស់បានទេ (Failed to delete selected users)
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsBulkDeleteOpen(false)}>
                  បោះបង់ (Cancel)
                </Button>
                <Button
                  onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                  disabled={bulkDeleteMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  {bulkDeleteMutation.isPending ? 'កំពុងលុប...' : `លុបទាំង ${selectedIds.length} (Confirm Bulk Delete)`}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
