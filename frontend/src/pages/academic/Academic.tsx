import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Layers, BookOpen, Users, Clock, Sun, Plus, Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Interfaces ────────────────────────────────────────
interface AcademicYear { id: number; name: string; start_date: string; end_date: string; is_current: boolean; }
interface Semester { id: number; academic_year_id: number; name: string; start_date: string; end_date: string; is_current: boolean; }
interface Section { id: number; grade_id: number; name: string; room_number?: string; capacity: number; }
interface Grade { id: number; name: string; level: number; description?: string; sections: Section[]; }
interface Subject { id: number; name: string; code: string; type: string; description?: string; }
interface TeacherAssignment { id: number; teacher_email: string; teacher_name: string; subject_id: number; grade_id?: number; section_id?: number; academic_year?: string; subject_name?: string; grade_name?: string; section_name?: string; }
interface TimetableEntry { id: number; day_of_week: string; period_number: number; start_time: string; end_time: string; grade_id: number; section_id?: number; subject_id: number; teacher_name?: string; room_number?: string; subject_name?: string; grade_name?: string; section_name?: string; }
interface Holiday { id: number; title: string; start_date: string; end_date: string; type: string; description?: string; }

const TABS = [
  { label: 'ឆ្នាំសិក្សា & ឆមាស (Academic Years)', icon: Calendar, path: '/academic-year' },
  { label: 'មុខវិជ្ជា (Subjects Curriculum)', icon: BookOpen, path: '/subjects' },
  { label: 'ការបែងចែកគ្រូបង្រៀន (Teacher Assignments)', icon: Users, path: '/teacher-assignments' },
  { label: 'កាលវិភាគសិក្សា (Timetable Matrix)', icon: Clock, path: '/timetable' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Academic() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  // Sync active tab with URL path
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.includes('classes')) setActiveTab(1);
    else if (pathname.includes('subjects')) setActiveTab(2);
    else if (pathname.includes('timetable')) setActiveTab(4);
    else setActiveTab(0);
  }, [location.pathname]);

  // ── Queries ──
  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/academic-years')).data,
  });

  const { data: semesters = [] } = useQuery<Semester[]>({
    queryKey: ['semesters'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/semesters')).data,
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['grades'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/grades')).data,
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/subjects')).data,
  });

  const { data: teacherAssignments = [] } = useQuery<TeacherAssignment[]>({
    queryKey: ['teacher-assignments'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/teacher-assignments')).data,
  });

  const { data: timetable = [] } = useQuery<TimetableEntry[]>({
    queryKey: ['timetable'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/timetable')).data,
  });

  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => (await axios.get('http://localhost:8000/academic/holidays')).data,
  });

  // ── Forms Modal States ──
  const [modalType, setModalType] = useState<string | null>(null);

  // Form states
  const [ayForm, setAyForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });
  const [semForm, setSemForm] = useState({ academic_year_id: 0, name: '', start_date: '', end_date: '', is_current: false });
  const [gradeForm, setGradeForm] = useState({ name: '', level: 1, description: '' });
  const [sectionForm, setSectionForm] = useState({ grade_id: 0, name: '', room_number: '', capacity: 30 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', type: 'Core', description: '' });
  const [assignForm, setAssignForm] = useState({ teacher_email: '', teacher_name: '', subject_id: 0, grade_id: 0, section_id: 0 });
  const [ttForm, setTtForm] = useState({ day_of_week: 'Monday', period_number: 1, start_time: '08:00', end_time: '08:45', grade_id: 0, section_id: 0, subject_id: 0, teacher_name: '', room_number: '' });
  const [holidayForm, setHolidayForm] = useState({ title: '', start_date: '', end_date: '', type: 'Public Holiday', description: '' });

  const sanitize = (data: any) => {
    const payload = { ...data };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === 0) {
        delete payload[key];
      }
    });
    return payload;
  };

  // ── Mutations ──
  const createAY = useMutation({
    mutationFn: (d: typeof ayForm) => axios.post('http://localhost:8000/academic/academic-years', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-years'] }); setModalType(null); },
  });
  const deleteAY = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/academic-years/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
  });

  const createSem = useMutation({
    mutationFn: (d: typeof semForm) => axios.post('http://localhost:8000/academic/semesters', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['semesters'] }); setModalType(null); },
  });
  const deleteSem = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/semesters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['semesters'] }),
  });

  const createGrade = useMutation({
    mutationFn: (d: typeof gradeForm) => axios.post('http://localhost:8000/academic/grades', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['grades'] }); setModalType(null); },
  });
  const deleteGrade = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/grades/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] }),
  });

  const createSection = useMutation({
    mutationFn: (d: typeof sectionForm) => axios.post('http://localhost:8000/academic/sections', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['grades'] }); setModalType(null); },
  });
  const deleteSection = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/sections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] }),
  });

  const createSubject = useMutation({
    mutationFn: (d: typeof subjectForm) => axios.post('http://localhost:8000/academic/subjects', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); setModalType(null); },
  });
  const deleteSubject = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/subjects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });

  const createAssignment = useMutation({
    mutationFn: (d: typeof assignForm) => axios.post('http://localhost:8000/academic/teacher-assignments', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] }); setModalType(null); },
  });
  const deleteAssignment = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/teacher-assignments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] }),
  });

  const createTT = useMutation({
    mutationFn: (d: typeof ttForm) => axios.post('http://localhost:8000/academic/timetable', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetable'] }); setModalType(null); },
  });
  const deleteTT = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/timetable/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  });

  const createHoliday = useMutation({
    mutationFn: (d: typeof holidayForm) => axios.post('http://localhost:8000/academic/holidays', sanitize(d)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['holidays'] }); setModalType(null); },
  });
  const deleteHoliday = useMutation({
    mutationFn: (id: number) => axios.delete(`http://localhost:8000/academic/holidays/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] }),
  });

  return (
    <Layout>
      <div className="space-y-6 pb-12 bg-white">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-blue-100 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2269ff]">គ្រប់គ្រងកិច្ចការសិក្សា (Academic Management)</h1>
            <p className="text-sm text-slate-500 font-medium">Configure NPIT academic years, semesters, grades, subjects, timetables &amp; holidays</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 rounded-2xl bg-blue-50/70 p-1.5 border border-blue-100 overflow-x-auto scrollbar-hide">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            return (
              <button key={t.label} onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
                  activeTab === i ? 'bg-[#2269ff] text-white shadow-sm' : 'text-[#1c3a73] hover:text-[#2269ff] hover:bg-white'
                }`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 0: Academic Years & Semesters ─── */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#2269ff]">ឆ្នាំសិក្សា (Academic Years)</h2>
              <Button onClick={() => setModalType('ay')} className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> បន្ថែមឆ្នាំសិក្សា (Add Academic Year)
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {years.map(y => (
                <div key={y.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-[#0a1f44] text-base">{y.name}</h3>
                    {y.is_current && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-black text-emerald-700">បច្ចុប្បន្ន (Current)</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 font-mono">{y.start_date} → {y.end_date}</p>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => deleteAY.mutate(y.id)} className="text-[#ec171c] hover:text-red-700 text-xs font-bold flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> លុប (Delete)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-blue-100">
              <h2 className="text-lg font-black text-[#2269ff]">ឆមាស (Semesters)</h2>
              <Button onClick={() => setModalType('sem')} className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> បន្ថែមឆមាស (Add Semester)
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {semesters.map(s => (
                <div key={s.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-[#0a1f44] text-base">{s.name}</h3>
                    {s.is_current && (
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-black text-[#2269ff]"> Current</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 font-mono">{s.start_date} → {s.end_date}</p>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => deleteSem.mutate(s.id)} className="text-[#ec171c] hover:text-red-700 text-xs font-bold flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 1: Subjects ─── */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#2269ff]">មុខវិជ្ជាសិក្សា (Subject Curriculum)</h2>
              <Button onClick={() => setModalType('subject')} className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> បន្ថែមមុខវិជ្ជា (Add Subject)
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(s => (
                <div key={s.id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-[#0a1f44] text-base">{s.name}</h3>
                      <p className="font-mono text-xs font-bold text-[#2269ff]">{s.code}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-black text-[#2269ff]">{s.type}</span>
                  </div>
                  {s.description && <p className="mt-2 text-xs text-slate-500 font-medium">{s.description}</p>}
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => deleteSubject.mutate(s.id)} className="text-[#ec171c] hover:text-red-700 text-xs font-bold flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 2: Teacher Assignments ─── */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#2269ff]">ការបែងចែកគ្រូបង្រៀន (Teacher Assignments)</h2>
              <Button onClick={() => setModalType('assignment')} className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> ចាត់តាំងគ្រូ (Assign Teacher)
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-50/60 text-[#2269ff] uppercase font-black tracking-wider border-b border-blue-100">
                  <tr>
                    {['លោកគ្រូ-អ្នកគ្រូ', 'មុខវិជ្ជា', 'ថ្នាក់ / បន្ទប់', 'សកម្មភាព'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-xs font-black uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-[#122b59]">
                  {teacherAssignments.map(ta => (
                    <tr key={ta.id} className="hover:bg-blue-50/30">
                      <td className="px-5 py-3.5 text-[#0a1f44] font-black">{ta.teacher_name} <span className="text-xs text-slate-400 block font-normal">{ta.teacher_email}</span></td>
                      <td className="px-5 py-3.5 text-[#2269ff] font-black">{ta.subject_name || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{ta.grade_name || '—'} {ta.section_name && `(${ta.section_name})`}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => deleteAssignment.mutate(ta.id)} className="text-[#ec171c] hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: Timetable ─── */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#2269ff]">កាលវិភាគសិក្សា (Class Timetable Matrix)</h2>
              <Button onClick={() => setModalType('tt')} className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> បន្ថែមម៉ោងសិក្សា (Add Period Slot)
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {DAYS.map(day => {
                const dayEntries = timetable.filter(t => t.day_of_week === day);
                return (
                  <div key={day} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
                    <h3 className="font-black text-[#2269ff] border-b border-blue-100 pb-2">{day}</h3>
                    <div className="mt-3 space-y-2">
                      {dayEntries.length === 0 ? <p className="text-xs text-slate-400 font-medium">គ្មានម៉ោងសិក្សា</p> : dayEntries.map(e => (
                        <div key={e.id} className="rounded-xl bg-blue-50/50 p-3 text-xs font-bold">
                          <div className="flex justify-between text-[#0a1f44]">
                            <span>Period {e.period_number}</span>
                            <button onClick={() => deleteTT.mutate(e.id)} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                          </div>
                          <p className="text-[#2269ff] font-black mt-1">{e.subject_name}</p>
                          <p className="text-slate-500 font-mono mt-0.5">{e.start_time} - {e.end_time}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{e.grade_name} {e.section_name} · Room {e.room_number || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── MODALS ─── */}
        <AnimatePresence>
          {modalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalType(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-100">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-black text-[#2269ff]">បន្ថែមទិន្នន័យ (Add New Item)</h2>
                  <button onClick={() => setModalType(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                </div>

                {/* AY Form */}
                {modalType === 'ay' && (
                  <div className="space-y-3 font-bold text-xs">
                    <input placeholder="ឈ្មោះឆ្នាំសិក្សា (ឧ. ២០២៥-២០២៦)" value={ayForm.name} onChange={e => setAyForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input type="date" value={ayForm.start_date} onChange={e => setAyForm(p => ({ ...p, start_date: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input type="date" value={ayForm.end_date} onChange={e => setAyForm(p => ({ ...p, end_date: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ayForm.is_current} onChange={e => setAyForm(p => ({ ...p, is_current: e.target.checked }))} /> ដាក់ជាឆ្នាំសិក្សាបច្ចុប្បន្ន (Set current)</label>
                    <Button onClick={() => createAY.mutate(ayForm)} className="w-full bg-[#2269ff] text-white font-bold">រក្សាទុក (Save Academic Year)</Button>
                  </div>
                )}

                {/* Semester Form */}
                {modalType === 'sem' && (
                  <div className="space-y-3 font-bold text-xs">
                    <select value={semForm.academic_year_id} onChange={e => setSemForm(p => ({ ...p, academic_year_id: parseInt(e.target.value) }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold">
                      <option value={0}>ជ្រើសរើសឆ្នាំសិក្សា (Select Academic Year)</option>
                      {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <input placeholder="ឈ្មោះឆមាស (ឧ. ឆមាសទី ១)" value={semForm.name} onChange={e => setSemForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input type="date" value={semForm.start_date} onChange={e => setSemForm(p => ({ ...p, start_date: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input type="date" value={semForm.end_date} onChange={e => setSemForm(p => ({ ...p, end_date: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <Button onClick={() => createSem.mutate(semForm)} className="w-full bg-[#2269ff] text-white font-bold">រក្សាទុក (Save Semester)</Button>
                  </div>
                )}

                {/* Grade Form */}
                {modalType === 'grade' && (
                  <div className="space-y-3 font-bold text-xs">
                    <input placeholder="ឈ្មោះកម្រិតថ្នាក់ (ឧ. ថ្នាក់ទី ១០)" value={gradeForm.name} onChange={e => setGradeForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input type="number" placeholder="លេខកម្រិត (ឧ. 10)" value={gradeForm.level} onChange={e => setGradeForm(p => ({ ...p, level: parseInt(e.target.value) || 1 }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <Button onClick={() => createGrade.mutate(gradeForm)} className="w-full bg-[#2269ff] text-white font-bold">រក្សាទុក (Save Grade)</Button>
                  </div>
                )}

                {/* Section Form */}
                {modalType === 'section' && (
                  <div className="space-y-3 font-bold text-xs">
                    <select value={sectionForm.grade_id} onChange={e => setSectionForm(p => ({ ...p, grade_id: parseInt(e.target.value) }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold">
                      <option value={0}>ជ្រើសរើសថ្នាក់ (Select Grade)</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <input placeholder="ឈ្មោះបន្ទប់ (ឧ. ថ្នាក់ 10A)" value={sectionForm.name} onChange={e => setSectionForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input placeholder="លេខបន្ទប់ (ឧ. 302)" value={sectionForm.room_number} onChange={e => setSectionForm(p => ({ ...p, room_number: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <Button onClick={() => createSection.mutate(sectionForm)} className="w-full bg-[#2269ff] text-white font-bold">រក្សាទុក (Save Section)</Button>
                  </div>
                )}

                {/* Subject Form */}
                {modalType === 'subject' && (
                  <div className="space-y-3 font-bold text-xs">
                    <input placeholder="ឈ្មោះមុខវិជ្ជា (ឧ. មេកានិច)" value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <input placeholder="កូដមុខវិជ្ជា (ឧ. MECH101)" value={subjectForm.code} onChange={e => setSubjectForm(p => ({ ...p, code: e.target.value }))} className="w-full rounded-xl border border-blue-200 p-2.5 text-xs font-bold" />
                    <Button onClick={() => createSubject.mutate(subjectForm)} className="w-full bg-[#2269ff] text-white font-bold">រក្សាទុក (Save Subject)</Button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
