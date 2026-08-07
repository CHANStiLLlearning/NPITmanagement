import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Pencil, Trash2, Eye, Upload,
  FileSpreadsheet, X, User, Phone, MapPin, BookOpen,
  QrCode, Filter, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/common/AvatarUpload';

// ──────────────── Types ────────────────
interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  photo_url?: string;
  qr_code?: string;
  email?: string;
  phone?: string;
  address?: string;
  class_name?: string;
  section?: string;
  enrollment_date?: string;
  status: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  medical_notes?: string;
}

const emptyForm: Partial<Student> = {
  first_name: '', last_name: '', gender: '', date_of_birth: '',
  email: '', phone: '', address: '', class_name: '', section: '',
  enrollment_date: '', status: 'active',
  guardian_name: '', guardian_phone: '', guardian_email: '', guardian_relationship: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
  blood_type: '', allergies: '', medical_conditions: '', medical_notes: '',
};

const TABS = ['Personal', 'Academic', 'Guardian'];
const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  transferred: 'bg-amber-100 text-amber-700',
  graduated: 'bg-blue-100 text-blue-700',
};

// ──────────────── Axios helpers ────────────────
const fetchStudents = async (params: Record<string, string>) => {
  const { data } = await axios.get('/students/', { params });
  return data as Student[];
};

// ──────────────── Main Component ────────────────
export default function Students() {
  const queryClient = useQueryClient();

  // filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // modals
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState<Student | null>(null);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [formTab, setFormTab] = useState(0);
  const [formData, setFormData] = useState<Partial<Student>>(emptyForm);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // query
  const queryParams: Record<string, string> = {};
  if (search) queryParams.search = search;
  if (filterClass) queryParams.class_name = filterClass;
  if (filterStatus) queryParams.status = filterStatus;

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', queryParams],
    queryFn: () => fetchStudents(queryParams),
  });

  // mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Student>) => axios.post('/students/', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); closeForm(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Student> }) => axios.put(`/students/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); closeForm(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/students/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); setDeleteTarget(null); },
  });

  const avatarMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await axios.post(`/students/${id}/avatar`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data as { photo_url: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  // helpers
  const openCreate = () => { setFormData(emptyForm); setEditTarget(null); setFormTab(0); setShowForm(true); };
  const openEdit = (s: Student) => { setFormData({ ...s }); setEditTarget(s); setFormTab(0); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };
  const handleField = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: formData });
    else createMutation.mutate(formData);
  };

  const exportCSV = async () => {
    const res = await axios.get('/students/export/csv', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    await axios.post('/students/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">Student Management</h1>
            <p className="text-sm text-slate-500">{students.length} students found</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> Import CSV
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={openCreate} className="bg-[#2269ff] hover:bg-[#2269ff] text-white">
              <Plus className="mr-1.5 h-4 w-4" /> Add Student
            </Button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, email…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] "
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
            <Filter className="mr-1.5 h-4 w-4" /> Filters <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* Filter dropdowns */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 "
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Class</label>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm ">
                  <option value="">All Classes</option>
                  {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm ">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="transferred">Transferred</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setFilterClass(''); setFilterStatus(''); }}>Clear</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">Loading students…</div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
              <User className="h-12 w-12 opacity-30" />
              <p className="text-sm">No students found. Add your first student!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 ">
                  <tr>
                    {['Student', 'ID', 'Class / Section', 'Contact', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 ">
                  {students.map((s, idx) => (
                    <motion.tr key={s.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50 :bg-[#1c3a73]/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {s.photo_url ? (
                            <img src={`http://localhost:8000${s.photo_url}`} alt="" className="h-9 w-9 rounded-full object-cover border-2 border-blue-100 shrink-0" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2269ff] to-violet-600 text-sm font-bold text-white shrink-0">
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#0a1f44] ">{s.first_name} {s.last_name}</p>
                            <p className="text-xs text-slate-400">{s.gender || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-[#2269ff]">{s.student_id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#122b59] ">{s.class_name || '—'}</p>
                        <p className="text-xs text-slate-400">Section: {s.section || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[#1c3a73] ">{s.email || '—'}</p>
                        <p className="text-xs text-slate-400">{s.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[s.status] || 'bg-slate-100 text-slate-600'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowProfile(s)} title="View Profile"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[#2269ff] transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(s)} title="Edit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(s)} title="Delete"
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

        {/* ─── Student Profile Modal ─── */}
        <AnimatePresence>
          {showProfile && (
            <Modal onClose={() => setShowProfile(null)} title="Student Profile" wide>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Left: Avatar + QR */}
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 p-6 sm:col-span-1">
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
                    <span className="font-mono text-xs text-[#2269ff] font-semibold">{showProfile.student_id}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[showProfile.status]}`}>
                    {showProfile.status}
                  </span>
                  {showProfile.qr_code && (
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <QrCode className="h-4 w-4 text-slate-400" />
                      <img src={showProfile.qr_code} alt="QR Code" className="h-28 w-28 rounded-lg border p-1" />
                      <p className="text-xs text-slate-400">Attendance QR</p>
                    </div>
                  )}
                </div>

                {/* Right: Details */}
                <div className="space-y-5 sm:col-span-2">
                  <ProfileSection icon={User} title="Personal Information">
                    <ProfileRow label="Gender" value={showProfile.gender} />
                    <ProfileRow label="Date of Birth" value={showProfile.date_of_birth} />
                    <ProfileRow label="Blood Type" value={showProfile.blood_type} />
                  </ProfileSection>
                  <ProfileSection icon={BookOpen} title="Academic">
                    <ProfileRow label="Class" value={showProfile.class_name} />
                    <ProfileRow label="Section" value={showProfile.section} />
                    <ProfileRow label="Enrolled" value={showProfile.enrollment_date} />
                  </ProfileSection>
                  <ProfileSection icon={Phone} title="Contact">
                    <ProfileRow label="Email" value={showProfile.email} />
                    <ProfileRow label="Phone" value={showProfile.phone} />
                    <ProfileRow label="Address" value={showProfile.address} />
                  </ProfileSection>
                  <ProfileSection icon={MapPin} title="Guardian">
                    <ProfileRow label="Name" value={showProfile.guardian_name} />
                    <ProfileRow label="Phone" value={showProfile.guardian_phone} />
                    <ProfileRow label="Relationship" value={showProfile.guardian_relationship} />
                  </ProfileSection>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* ─── Add / Edit Form Modal ─── */}
        <AnimatePresence>
          {showForm && (
            <Modal onClose={closeForm} title={editTarget ? 'Edit Student' : 'Add Student'} wide>
              {/* Tab Bar */}
              <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 ">
                {TABS.map((tab, i) => (
                  <button key={tab} onClick={() => setFormTab(i)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${formTab === i ? 'bg-white text-[#2269ff] shadow ' : 'text-slate-500 hover:text-[#1c3a73]'}`}>
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
                    {!editTarget && <p className="sr-only">Save student first to upload photo</p>}
                  </div>
                  <FormField label="First Name *" value={formData.first_name} onChange={v => handleField('first_name', v)} />
                  <FormField label="Last Name *" value={formData.last_name} onChange={v => handleField('last_name', v)} />
                  <FormField label="Date of Birth" type="date" value={formData.date_of_birth} onChange={v => handleField('date_of_birth', v)} />
                  <FormSelect label="Gender" value={formData.gender} onChange={v => handleField('gender', v)} options={['male','female','other']} />
                  <FormField label="Email" type="email" value={formData.email} onChange={v => handleField('email', v)} />
                  <FormField label="Phone" value={formData.phone} onChange={v => handleField('phone', v)} />
                  <div className="sm:col-span-2">
                    <FormField label="Address" value={formData.address} onChange={v => handleField('address', v)} />
                  </div>
                </>}

                {formTab === 1 && <>
                  <FormSelect label="Class" value={formData.class_name} onChange={v => handleField('class_name', v)}
                    options={['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']} />
                  <FormSelect label="Section" value={formData.section} onChange={v => handleField('section', v)} options={['A','B','C','D','E']} />
                  <FormField label="Enrollment Date" type="date" value={formData.enrollment_date} onChange={v => handleField('enrollment_date', v)} />
                  <FormSelect label="Status" value={formData.status} onChange={v => handleField('status', v)} options={['active','inactive','transferred','graduated']} />
                </>}
                {formTab === 2 && <>
                  <FormField label="Guardian Name" value={formData.guardian_name} onChange={v => handleField('guardian_name', v)} />
                  <FormField label="Relationship" value={formData.guardian_relationship} onChange={v => handleField('guardian_relationship', v)} />
                  <FormField label="Guardian Phone" value={formData.guardian_phone} onChange={v => handleField('guardian_phone', v)} />
                  <FormField label="Guardian Email" type="email" value={formData.guardian_email} onChange={v => handleField('guardian_email', v)} />
                </>}
              </div>

              <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                  {formTab > 0 && <Button variant="outline" onClick={() => setFormTab(t => t - 1)}>← Back</Button>}
                  {formTab < TABS.length - 1 && <Button onClick={() => setFormTab(t => t + 1)}>Next →</Button>}
                </div>
                {formTab === TABS.length - 1 && (
                  <Button onClick={handleSubmit} className="bg-[#2269ff] hover:bg-[#2269ff] text-white"
                    disabled={createMutation.isPending || updateMutation.isPending}>
                    {editTarget ? 'Save Changes' : 'Create Student'}
                  </Button>
                )}
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* ─── Delete Confirm ─── */}
        <AnimatePresence>
          {deleteTarget && (
            <Modal onClose={() => setDeleteTarget(null)} title="Delete Student">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">
                    Are you sure you want to permanently delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.student_id})?
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                  <Button onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-red-600 hover:bg-red-700 text-white">
                    Delete
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

// ──────────────── Sub-components ────────────────
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
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] " />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 ">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] ">
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FormArea({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 ">{label}</label>
      <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] resize-none" />
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
