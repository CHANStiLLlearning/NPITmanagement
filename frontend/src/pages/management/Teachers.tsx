import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Pencil, Trash2, Eye, Upload, FileSpreadsheet,
  X, User, Phone, MapPin, Briefcase, GraduationCap, Star,
  QrCode, Filter, ChevronDown, BookOpen, Calendar, DollarSign,
  TrendingUp, Clock, Award, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { getMediaUrl } from '@/config/constants';

// ─── Types ───────────────────────────────────────────
interface Teacher {
  id: number;
  teacher_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  photo_url?: string;
  qr_code?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  join_date?: string;
  employment_type?: string;
  status: string;
  salary?: number;
  bank_account?: string;
  bank_name?: string;
  performance_rating?: number;
  performance_notes?: string;
}

const emptyForm: Partial<Teacher> = {
  first_name: '', last_name: '', date_of_birth: '', gender: '',
  email: '', phone: '', address: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  department: '', qualification: '', specialization: '',
  experience_years: 0, join_date: '', employment_type: '', status: 'active',
  salary: undefined, bank_account: '', bank_name: '',
  performance_rating: undefined, performance_notes: '',
};

const TABS = ['Personal', 'Professional', 'Salary & Bank', 'Performance'];

const DEPARTMENTS = [
  'Mathematics', 'Science', 'English', 'History', 'Geography',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education',
  'Arts', 'Music', 'Languages', 'Economics', 'Administration',
];

const statusConfig: Record<string, { label: string; color: string }> = {
  active:     { label: 'Active',      color: 'bg-emerald-100 text-emerald-700' },
  inactive:   { label: 'Inactive',    color: 'bg-slate-100 text-slate-600'       },
  on_leave:   { label: 'On Leave',    color: 'bg-amber-100 text-amber-700'     },
  terminated: { label: 'Terminated',  color: 'bg-red-100 text-red-700'         },
};

const employmentTypes = ['full_time', 'part_time', 'contract'];

// ─── Helpers ─────────────────────────────────────────
const fetchTeachers = async (params: Record<string, string>) => {
  const { data } = await axios.get('/teachers/', { params });
  return data as Teacher[];
};

function StarRating({ value }: { value?: number }) {
  const stars = Math.round(value ?? 0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      {value !== undefined && <span className="ml-1 text-xs text-slate-500">{Number(value).toFixed(1)}</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────
export default function Teachers() {
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState('');
  const [filterDept, setFilterDept]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm]       = useState(false);
  const [showProfile, setShowProfile] = useState<Teacher | null>(null);
  const [editTarget, setEditTarget]   = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [formTab, setFormTab]         = useState(0);
  const [formData, setFormData]       = useState<Partial<Teacher>>(emptyForm);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryParams: Record<string, string> = {};
  if (search)       queryParams.search     = search;
  if (filterDept)   queryParams.department = filterDept;
  if (filterStatus) queryParams.status     = filterStatus;

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', queryParams],
    queryFn: () => fetchTeachers(queryParams),
  });

  const createMutation = useMutation({
    mutationFn: (d: Partial<Teacher>) => axios.post('/teachers/', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); closeForm(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Teacher> }) => axios.put(`/teachers/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); closeForm(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/teachers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); setDeleteTarget(null); },
  });

  const avatarMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await axios.post(`/teachers/${id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data as { photo_url: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teachers'] }),
  });

  const openCreate = () => { setFormData(emptyForm); setEditTarget(null); setFormTab(0); setShowForm(true); };
  const openEdit   = (t: Teacher) => { setFormData({ ...t }); setEditTarget(t); setFormTab(0); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditTarget(null); };
  const handleField = (k: string, v: string | number) => setFormData(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    const payload = { ...formData };
    // Remove empty strings to prevent FastAPI validation errors on Dates and Enums
    Object.keys(payload).forEach(key => {
      const k = key as keyof Teacher;
      if (payload[k] === '') {
        delete payload[k];
      }
    });

    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: payload });
    else            createMutation.mutate(payload);
  };

  const exportCSV = async () => {
    const res = await axios.get('/teachers/export/csv', { responseType: 'blob' });
    const url  = URL.createObjectURL(new Blob([res.data]));
    const a    = document.createElement('a'); a.href = url; a.download = 'teachers.csv'; a.click();
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    await axios.post('/teachers/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
  };

  // Stats summary
  const active    = teachers.filter(t => t.status === 'active').length;
  const onLeave   = teachers.filter(t => t.status === 'on_leave').length;
  const avgRating = teachers.length
    ? (teachers.reduce((s, t) => s + (t.performance_rating ?? 0), 0) / teachers.length).toFixed(2)
    : '—';

  return (
    <Layout>
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">Teacher Management</h1>
            <p className="text-sm text-slate-500">{teachers.length} teachers in the system</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> Import CSV
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="mr-1.5 h-4 w-4" /> Add Teacher
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Teachers', value: teachers.length, icon: User,      color: 'from-violet-500 to-purple-600' },
            { label: 'Active',         value: active,           icon: TrendingUp, color: 'from-emerald-500 to-teal-600'  },
            { label: 'On Leave',       value: onLeave,          icon: Clock,      color: 'from-amber-500 to-orange-600'  },
            { label: 'Avg Rating',     value: avgRating,        icon: Star,       color: 'from-rose-500 to-pink-600'     },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-xl font-bold text-[#0a1f44] ">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, department…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 " />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
            <Filter className="mr-1.5 h-4 w-4" /> Filters <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 ">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Department</label>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm ">
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm ">
                  <option value="">All Statuses</option>
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setFilterDept(''); setFilterStatus(''); }}>Clear</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">Loading teachers…</div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
              <GraduationCap className="h-12 w-12 opacity-30" />
              <p className="text-sm">No teachers found. Add your first teacher!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 ">
                  <tr>
                    {['Teacher', 'ID', 'Department', 'Contact', 'Experience', 'Rating', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 ">
                  {teachers.map((t, idx) => (
                    <motion.tr key={t.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50 :bg-[#1c3a73]/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {t.photo_url ? (
                            <img src={getMediaUrl(t.photo_url)} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-violet-100 shrink-0" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white shrink-0">
                              {t.first_name[0]}{t.last_name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#0a1f44] ">{t.first_name} {t.last_name}</p>
                            <p className="text-xs text-slate-400 capitalize">{t.employment_type?.replace('_', ' ') || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-violet-600">{t.teacher_id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#122b59] ">{t.department || '—'}</p>
                        <p className="text-xs text-slate-400">{t.specialization || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[#1c3a73] ">{t.email || '—'}</p>
                        <p className="text-xs text-slate-400">{t.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[#1c3a73] ">{t.experience_years ?? 0} yrs</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StarRating value={t.performance_rating ?? undefined} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[t.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                          {statusConfig[t.status]?.label ?? t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowProfile(t)} title="View Profile"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(t)} title="Edit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t)} title="Delete"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Profile Modal ─── */}
        <AnimatePresence>
          {showProfile && (
            <Modal onClose={() => setShowProfile(null)} title="Teacher Profile" wide>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Left card */}
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-6">
                  <AvatarUpload
                    currentUrl={showProfile.photo_url}
                    name={`${showProfile.first_name} ${showProfile.last_name}`}
                    size={96}
                    onUpload={async (file) => {
                      await avatarMutation.mutateAsync({ id: showProfile.id, file });
                    }}
                  />
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#0a1f44]">{showProfile.first_name} {showProfile.last_name}</p>
                    <span className="font-mono text-xs font-semibold text-violet-600">{showProfile.teacher_id}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[showProfile.status]?.color}`}>
                    {statusConfig[showProfile.status]?.label}
                  </span>
                  {/* Star rating large */}
                  <div className="flex flex-col items-center gap-1 w-full rounded-xl bg-white/70 p-3">
                    <p className="text-xs text-slate-500 font-medium">Performance Rating</p>
                    <StarRating value={showProfile.performance_rating ?? undefined} />
                    {showProfile.performance_notes && (
                      <p className="mt-1 text-xs text-slate-500 text-center">{showProfile.performance_notes}</p>
                    )}
                  </div>
                  {/* QR Code */}
                  {showProfile.qr_code && (
                    <div className="flex flex-col items-center gap-1">
                      <QrCode className="h-4 w-4 text-slate-400" />
                      <img src={showProfile.qr_code} alt="QR Code" className="h-28 w-28 rounded-lg border p-1" />
                      <p className="text-xs text-slate-400">Attendance QR</p>
                    </div>
                  )}
                </div>

                {/* Right details */}
                <div className="space-y-4 sm:col-span-2">
                  <ProfileSection icon={User} title="Personal">
                    <ProfileRow label="Gender" value={showProfile.gender} />
                    <ProfileRow label="Date of Birth" value={showProfile.date_of_birth} />
                    <ProfileRow label="Email" value={showProfile.email} />
                    <ProfileRow label="Phone" value={showProfile.phone} />
                    <ProfileRow label="Address" value={showProfile.address} />
                  </ProfileSection>
                  <ProfileSection icon={Briefcase} title="Professional">
                    <ProfileRow label="Department" value={showProfile.department} />
                    <ProfileRow label="Specialization" value={showProfile.specialization} />
                    <ProfileRow label="Qualification" value={showProfile.qualification} />
                    <ProfileRow label="Experience" value={showProfile.experience_years !== undefined ? `${showProfile.experience_years} years` : undefined} />
                    <ProfileRow label="Join Date" value={showProfile.join_date} />
                    <ProfileRow label="Employment" value={showProfile.employment_type?.replace('_', ' ')} />
                  </ProfileSection>
                  <ProfileSection icon={DollarSign} title="Salary & Banking">
                    <ProfileRow label="Salary" value={showProfile.salary !== undefined ? `$${Number(showProfile.salary).toLocaleString()}` : undefined} />
                    <ProfileRow label="Bank" value={showProfile.bank_name} />
                    <ProfileRow label="Account" value={showProfile.bank_account} />
                  </ProfileSection>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* ─── Add / Edit Form Modal ─── */}
        <AnimatePresence>
          {showForm && (
            <Modal onClose={closeForm} title={editTarget ? 'Edit Teacher' : 'Add Teacher'} wide>
              {/* Tabs */}
              <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 ">
                {TABS.map((tab, i) => (
                  <button key={tab} onClick={() => setFormTab(i)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${formTab === i ? 'bg-white text-violet-600 shadow ' : 'text-slate-500 hover:text-[#1c3a73]'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {formTab === 0 && <>
                  <div className="sm:col-span-2 flex justify-center py-2">
                    <AvatarUpload
                      currentUrl={formData.photo_url}
                      name={`${formData.first_name || ''} ${formData.last_name || ''}`}
                      size={88}
                      disabled={!editTarget}
                      onUpload={async (file) => {
                        if (editTarget) {
                          const res = await avatarMutation.mutateAsync({ id: editTarget.id, file });
                          setFormData(p => ({ ...p, photo_url: res.photo_url }));
                        }
                      }}
                    />
                  </div>
                  <FormField label="First Name *" value={formData.first_name} onChange={v => handleField('first_name', v)} />
                  <FormField label="Last Name *"  value={formData.last_name}  onChange={v => handleField('last_name',  v)} />
                  <FormField label="Date of Birth" type="date" value={formData.date_of_birth} onChange={v => handleField('date_of_birth', v)} />
                  <FormSelect label="Gender" value={formData.gender} onChange={v => handleField('gender', v)} options={['male','female','other']} />
                  <FormField label="Email" type="email" value={formData.email} onChange={v => handleField('email', v)} />
                  <FormField label="Phone" value={formData.phone} onChange={v => handleField('phone', v)} />
                  <div className="sm:col-span-2"><FormField label="Address" value={formData.address} onChange={v => handleField('address', v)} /></div>
                </>}

                {formTab === 1 && <>
                  <FormSelect label="Department" value={formData.department} onChange={v => handleField('department', v)} options={DEPARTMENTS} />
                  <FormField label="Specialization" value={formData.specialization} onChange={v => handleField('specialization', v)} />
                  <div className="sm:col-span-2"><FormField label="Qualification" value={formData.qualification} onChange={v => handleField('qualification', v)} /></div>
                  <FormField label="Experience (years)" type="number" value={String(formData.experience_years ?? '')} onChange={v => handleField('experience_years', parseInt(v) || 0)} />
                  <FormField label="Join Date" type="date" value={formData.join_date} onChange={v => handleField('join_date', v)} />
                  <FormSelect label="Employment Type" value={formData.employment_type} onChange={v => handleField('employment_type', v)} options={employmentTypes} />
                  <FormSelect label="Status" value={formData.status} onChange={v => handleField('status', v)} options={Object.keys(statusConfig)} />
                </>}

                {formTab === 2 && <>
                  <FormField label="Monthly Salary ($)" type="number" value={String(formData.salary ?? '')} onChange={v => handleField('salary', parseFloat(v) || 0)} />
                  <FormField label="Bank Name" value={formData.bank_name} onChange={v => handleField('bank_name', v)} />
                  <FormField label="Bank Account Number" value={formData.bank_account} onChange={v => handleField('bank_account', v)} />
                </>}

                {formTab === 3 && <>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Performance Rating (0 – 5)</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min="0" max="5" step="0.1"
                        value={formData.performance_rating ?? 0}
                        onChange={e => handleField('performance_rating', parseFloat(e.target.value))}
                        className="flex-1 accent-violet-600" />
                      <span className="text-sm font-bold text-violet-600 w-8 text-right">
                        {Number(formData.performance_rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-5 w-5 ${i <= Math.round(formData.performance_rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2"><FormArea label="Performance Notes" value={formData.performance_notes} onChange={v => handleField('performance_notes', v)} /></div>
                </>}
              </div>

              <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                  {formTab > 0 && <Button variant="outline" onClick={() => setFormTab(t => t - 1)}>← Back</Button>}
                  {formTab < TABS.length - 1 && <Button onClick={() => setFormTab(t => t + 1)}>Next →</Button>}
                </div>
                {formTab === TABS.length - 1 && (
                  <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={createMutation.isPending || updateMutation.isPending}>
                    {editTarget ? 'Save Changes' : 'Create Teacher'}
                  </Button>
                )}
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* ─── Delete Confirm ─── */}
        <AnimatePresence>
          {deleteTarget && (
            <Modal onClose={() => setDeleteTarget(null)} title="Delete Teacher">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">
                    Are you sure you want to delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.teacher_id})? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                  <Button onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}

// ─── Sub-components ───────────────────────────────────
function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className={`relative z-10 w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl `}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0a1f44] ">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 :bg-[#1c3a73]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }: { label: string; value?: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 ">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 " />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 ">{label}</label>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 capitalize">
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  );
}

function FormArea({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 ">{label}</label>
      <textarea rows={3} value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 " />
    </div>
  );
}

function ProfileSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-[#122b59] ">{value || '—'}</p>
    </div>
  );
}
