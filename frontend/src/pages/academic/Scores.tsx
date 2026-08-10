import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Save, RefreshCw, Award, BookOpen, Star,
  BarChart2, FileText, Printer, X, Edit2, CheckCircle2,
  TrendingUp, Medal, ChevronUp, ChevronDown, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────
type CategoryType = 'assignment'|'quiz'|'midterm'|'final'|'practical'|'project'|'attendance'|'behavior'|'custom';

interface ScoreCategory {
  id: number;
  name: string;
  category_type: CategoryType;
  weight_percent: number;
  max_score: number;
  class_name?: string;
  subject?: string;
  term?: string;
}

interface StudentResult {
  student_sid: string;
  student_name: string;
  class_name?: string;
  scores: Record<string, number | null>;
  weighted_total: number;
  letter_grade: string;
  gpa: number;
  rank?: number;
}

interface GradeBook {
  categories: ScoreCategory[];
  students: StudentResult[];
}

interface ReportCard {
  id: number;
  student_sid: string;
  student_name: string;
  class_name?: string;
  subject?: string;
  term?: string;
  weighted_total?: number;
  letter_grade?: string;
  gpa?: number;
  rank?: number;
  teacher_comment?: string;
  principal_comment?: string;
  status: string;
}

// ─── Constants ─────────────────────────────────────────
const CATEGORY_TYPES: { value: CategoryType; label: string; color: string; emoji: string }[] = [
  { value: 'assignment',  label: 'Assignment',  color: 'bg-blue-100 text-blue-700',   emoji: '📝' },
  { value: 'quiz',        label: 'Quiz',        color: 'bg-violet-100 text-violet-700', emoji: '❓' },
  { value: 'midterm',     label: 'Midterm',     color: 'bg-amber-100 text-amber-700', emoji: '📋' },
  { value: 'final',       label: 'Final',       color: 'bg-red-100 text-red-700',     emoji: '🎯' },
  { value: 'practical',   label: 'Practical',   color: 'bg-emerald-100 text-emerald-700', emoji: '🔬' },
  { value: 'project',     label: 'Project',     color: 'bg-cyan-100 text-cyan-700',   emoji: '🏗️' },
  { value: 'attendance',  label: 'Attendance',  color: 'bg-green-100 text-green-700', emoji: '✅' },
  { value: 'behavior',    label: 'Behavior',    color: 'bg-pink-100 text-pink-700',   emoji: '⭐' },
  { value: 'custom',      label: 'Custom',      color: 'bg-slate-100 text-[#1c3a73]',   emoji: '🔧' },
];

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-500', 'A': 'bg-emerald-400', 'A-': 'bg-emerald-300',
  'B+': 'bg-blue-500',    'B': 'bg-blue-400',     'B-': 'bg-blue-300',
  'C+': 'bg-amber-500',   'C': 'bg-amber-400',    'C-': 'bg-amber-300',
  'D+': 'bg-orange-500',  'D': 'bg-orange-400',   'D-': 'bg-orange-300',
  'F':  'bg-red-500',
};


const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2', 'Annual'];

const TABS = ['Category Setup', 'Grade Book', 'Results & Rankings', 'Report Cards'];

// ─── Print Report Card ─────────────────────────────────
function printReportCard(card: ReportCard, categories: ScoreCategory[], studentResult?: StudentResult) {
  const win = window.open('', '_blank')!;
  const gradeColor = card.letter_grade ? (card.weighted_total ?? 0) >= 80 ? '#10b981' : (card.weighted_total ?? 0) >= 60 ? '#f59e0b' : '#ef4444' : '#6b7280';
  const scoreRows = categories.map(cat => {
    const raw = studentResult?.scores[String(cat.id)];
    const pct = raw !== null && raw !== undefined ? ((raw / cat.max_score) * 100).toFixed(1) : '—';
    return `<tr>
      <td>${cat.name}</td>
      <td>${cat.category_type}</td>
      <td>${raw ?? '—'} / ${cat.max_score}</td>
      <td>${pct}%</td>
      <td>${cat.weight_percent}%</td>
    </tr>`;
  }).join('');

  win.document.write(`<html><head><title>Report Card</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;padding:32px;color:#1f2937;max-width:700px;margin:auto}
    .header{text-align:center;margin-bottom:24px}
    .school-name{font-size:22px;font-weight:800;color:#4f46e5}
    .title{font-size:14px;color:#6b7280;margin-top:2px}
    .card{border:2px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:16px}
    .card-header{background:#4f46e5;color:white;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
    .grade-badge{font-size:36px;font-weight:900;color:${gradeColor}}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px}
    .info-item label{font-size:10px;font-weight:600;text-transform:uppercase;color:#9ca3af}
    .info-item p{font-size:14px;font-weight:600;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f9fafb;padding:8px 10px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb}
    td{padding:7px 10px;border-bottom:1px solid #f3f4f6}
    .totals{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px;background:#f9fafb}
    .total-item{text-align:center}
    .total-item .val{font-size:24px;font-weight:800}
    .total-item .lbl{font-size:10px;color:#6b7280;text-transform:uppercase}
    .comment{padding:12px 16px;border-top:1px solid #e5e7eb}
    .comment label{font-size:10px;font-weight:700;color:#4f46e5;text-transform:uppercase}
    .comment p{margin-top:4px;font-size:13px;color:#374151}
    .rank-badge{display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700}
    @media print{body{padding:12px}}
  </style></head><body>
  <div class="header">
    <div class="school-name">🏫 School Management System</div>
    <div class="title">Official Student Report Card · ${card.term || 'Term 1'}</div>
  </div>
  <div class="card">
    <div class="card-header">
      <div>
        <div style="font-size:18px;font-weight:800">${card.student_name}</div>
        <div style="font-size:12px;opacity:.8">${card.student_sid} · ${card.class_name || ''} · ${card.subject || ''}</div>
      </div>
      <span class="rank-badge">Rank #${card.rank ?? '—'}</span>
    </div>
    <div class="totals">
      <div class="total-item"><div class="val grade-badge">${card.letter_grade || '—'}</div><div class="lbl">Grade</div></div>
      <div class="total-item"><div class="val" style="color:#4f46e5">${card.weighted_total?.toFixed(1) ?? '—'}%</div><div class="lbl">Total Score</div></div>
      <div class="total-item"><div class="val" style="color:#10b981">${card.gpa?.toFixed(2) ?? '—'}</div><div class="lbl">GPA</div></div>
      <div class="total-item"><div class="val">#${card.rank ?? '—'}</div><div class="lbl">Rank</div></div>
    </div>
    ${categories.length > 0 ? `
    <table>
      <thead><tr><th>Component</th><th>Type</th><th>Score</th><th>Percentage</th><th>Weight</th></tr></thead>
      <tbody>${scoreRows}</tbody>
    </table>` : ''}
    ${card.teacher_comment ? `<div class="comment"><label>Teacher Comment</label><p>${card.teacher_comment}</p></div>` : ''}
    ${card.principal_comment ? `<div class="comment"><label>Principal Comment</label><p>${card.principal_comment}</p></div>` : ''}
  </div>
  <script>window.onload=()=>{window.print();window.close();}<\/script>
  </body></html>`);
  win.document.close();
}

// ─── Main Component ───────────────────────────────────
export default function Scores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isReviewer = ['super_admin', 'admin', 'principal'].includes(user?.role ?? '');

  const [activeTab, setActiveTab] = useState(0);
  const [selSubject, setSelSubject] = useState('');
  const [selTerm,    setSelTerm]    = useState('Term 1');

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', category_type: 'assignment' as CategoryType, weight_percent: 20, max_score: 100, description: '' });

  // Cell editing
  const [editingCell, setEditingCell] = useState<{ sid: string; catId: number } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Report card comment modal
  const [commentCard, setCommentCard] = useState<ReportCard | null>(null);
  const [tcComment, setTcComment] = useState('');
  const [pcComment, setPcComment] = useState('');

  // Queries
  const { data: dbSubjects = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['subjects'],
    queryFn: async () => (await axios.get('/academic/subjects')).data,
  });

  const subjectsList = useMemo(() => dbSubjects.map(s => s.name), [dbSubjects]);
  const { data: categories = [], isLoading: catsLoading } = useQuery<ScoreCategory[]>({
    queryKey: ['score-categories', selSubject, selTerm],
    queryFn: async () => {
      const p: Record<string,string> = {};
      if (selSubject) p.class_name = selSubject;
      if (selTerm)    p.term       = selTerm;
      const { data } = await axios.get('/scores/categories', { params: p });
      return data;
    },
    enabled: !!selSubject,
  });

  const { data: gradebook, isLoading: gbLoading, refetch: refetchGb } = useQuery<GradeBook>({
    queryKey: ['gradebook', selSubject, selTerm],
    queryFn: async () => {
      const p: Record<string,string> = { class_name: selSubject };
      if (selTerm) p.term = selTerm;
      const { data } = await axios.get('/scores/gradebook', { params: p });
      return data;
    },
    enabled: !!selSubject,
  });

  const { data: reportCards = [], refetch: refetchCards } = useQuery<ReportCard[]>({
    queryKey: ['report-cards', selSubject, selTerm],
    queryFn: async () => {
      const p: Record<string,string> = {};
      if (selSubject) p.class_name = selSubject;
      if (selTerm)    p.term       = selTerm;
      const { data } = await axios.get('/scores/report-cards', { params: p });
      return data;
    },
    enabled: !!selSubject && activeTab === 3,
  });

  // Mutations
  const createCatMutation = useMutation({
    mutationFn: (d: typeof catForm) => axios.post('/scores/categories', { ...d, class_name: selSubject, term: selTerm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['score-categories'] }); setShowCatForm(false); setCatForm({ name: '', category_type: 'assignment', weight_percent: 20, max_score: 100, description: '' }); },
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/scores/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['score-categories'] }); queryClient.invalidateQueries({ queryKey: ['gradebook'] }); },
  });

  const scoreMutation = useMutation({
    mutationFn: ({ catId, sid, score }: { catId: number; sid: string; score: number | null }) =>
      axios.post(`/scores/categories/${catId}/scores`, { student_sid: sid, score }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gradebook'] }),
  });

  const generateCardsMutation = useMutation({
    mutationFn: () => axios.post('/scores/report-cards/generate', null, { params: { class_name: selSubject, term: selTerm } }),
    onSuccess: () => { refetchCards(); queryClient.invalidateQueries({ queryKey: ['gradebook'] }); },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ReportCard> }) => axios.put(`/scores/report-cards/${id}`, data),
    onSuccess: () => { refetchCards(); setCommentCard(null); },
  });

  // Cell save with debounce
  const handleCellSave = (catId: number, sid: string, val: string) => {
    const key = `${sid}-${catId}`;
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      const numVal = val.trim() === '' ? null : parseFloat(val);
      scoreMutation.mutate({ catId, sid, score: numVal });
    }, 800);
  };

  // Weight total
  const totalWeight = categories.reduce((s, c) => s + c.weight_percent, 0);
  const weightOk    = Math.abs(totalWeight - 100) < 0.5;

  const getTypeConfig = (type: string) => CATEGORY_TYPES.find(t => t.value === type) ?? CATEGORY_TYPES[8];

  return (
    <Layout>
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">Score Management</h1>
            <p className="text-sm text-slate-500">Grade book, weighted scoring & report cards</p>
          </div>
        </div>

        {/* Subject (មុខវិជ្ជា) / Term Selector */}
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-500">មុខវិជ្ជា (Subject) *</label>
            <select value={selSubject} onChange={e => setSelSubject(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
              <option value="">— ជ្រើសរើសមុខវិជ្ជា (Select Subject) —</option>
              {subjectsList.map((s: string) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-medium text-slate-500">Term</label>
            <select value={selTerm} onChange={e => setSelTerm(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
              {TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {!selSubject ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-400">
            <BookOpen className="h-12 w-12 opacity-40" />
            <p className="text-sm font-medium">ជ្រើសរើសមុខវិជ្ជា (Select a Subject to begin)</p>
          </div>
        ) : (<>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`flex-1 min-w-max rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === i ? 'bg-white text-[#2269ff] shadow ' : 'text-slate-500 hover:text-[#122b59]'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ─── TAB 0: Category Setup ─── */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Weight bar */}
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-[#1c3a73] ">Weight Distribution</p>
                <span className={`text-sm font-bold ${weightOk ? 'text-emerald-600' : 'text-red-500'}`}>
                  {totalWeight.toFixed(0)}% / 100%
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100 flex">
                {categories.map(cat => {
                  const cfg = getTypeConfig(cat.category_type);
                  const colors = ['bg-blue-500','bg-violet-500','bg-amber-500','bg-red-500','bg-emerald-500','bg-cyan-500','bg-green-500','bg-pink-500','bg-slate-400'];
                  const ci = CATEGORY_TYPES.findIndex(t => t.value === cat.category_type);
                  return (
                    <div key={cat.id} className={`h-full ${colors[ci] ?? 'bg-slate-400'} transition-all`}
                      style={{ width: `${cat.weight_percent}%` }} title={`${cat.name}: ${cat.weight_percent}%`} />
                  );
                })}
              </div>
              {!weightOk && categories.length > 0 && (
                <p className="mt-1 text-xs text-red-500">⚠ Weights should total 100%. Currently: {totalWeight.toFixed(1)}%</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => {
                const cfg = getTypeConfig(cat.category_type);
                return (
                  <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cfg.emoji}</span>
                        <div>
                          <p className="font-semibold text-[#0a1f44] ">{cat.name}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteCatMutation.mutate(cat.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-blue-50 p-2 text-center ">
                        <p className="text-xl font-bold text-[#2269ff]">{cat.weight_percent}%</p>
                        <p className="text-xs text-slate-500">Weight</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2 text-center ">
                        <p className="text-xl font-bold text-[#1c3a73] ">{cat.max_score}</p>
                        <p className="text-xs text-slate-500">Max Score</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add category card */}
              <button onClick={() => setShowCatForm(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-slate-400 hover:border-blue-400 hover:text-[#2269ff] transition-colors :border-[#2269ff] min-h-[140px]">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Score Category</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 1: Grade Book ─── */}
        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{gradebook?.students.length ?? 0} students · {categories.length} components</p>
              <Button variant="outline" size="sm" onClick={() => refetchGb()}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
              </Button>
            </div>

            {!gradebook || categories.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                <Settings className="h-10 w-10 opacity-30" />
                <p className="text-sm">Set up score categories first (Tab 1)</p>
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl border border-slate-100 bg-white shadow-sm ">
                <table className="text-sm border-collapse min-w-full">
                  <thead>
                    <tr className="bg-slate-50 ">
                      <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 min-w-[180px]">
                        Student
                      </th>
                      {categories.map(cat => {
                        const cfg = getTypeConfig(cat.category_type);
                        return (
                          <th key={cat.id} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 min-w-[110px]">
                            <div className="flex flex-col items-center gap-1">
                              <span>{cfg.emoji} {cat.name}</span>
                              <span className="text-slate-400 font-normal">{cat.weight_percent}% · /{cat.max_score}</span>
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 ">
                    {gradebook.students.map((st, idx) => (
                      <motion.tr key={st.student_sid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50 :bg-[#1c3a73]/40">
                        <td className="sticky left-0 z-10 bg-white hover:bg-slate-50 px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#2269ff] to-violet-600 text-xs font-bold text-white">
                              {st.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-[#122b59] text-xs leading-tight">{st.student_name}</p>
                              <p className="font-mono text-[10px] text-[#2269ff]">{st.student_sid}</p>
                            </div>
                          </div>
                        </td>

                        {categories.map(cat => {
                          const key = `${st.student_sid}-${cat.id}`;
                          const isEditing = editingCell?.sid === st.student_sid && editingCell?.catId === cat.id;
                          const raw = st.scores[String(cat.id)];
                          const pct = raw !== null && raw !== undefined ? (raw / cat.max_score) * 100 : null;
                          const cellColor = pct === null ? '' : pct >= 80 ? 'bg-emerald-50' : pct >= 60 ? 'bg-amber-50' : 'bg-red-50';

                          return (
                            <td key={cat.id} className={`px-2 py-2.5 text-center ${cellColor}`}>
                              {isEditing ? (
                                <input autoFocus type="number" min={0} max={cat.max_score}
                                  value={cellValue}
                                  onChange={e => { setCellValue(e.target.value); handleCellSave(cat.id, st.student_sid, e.target.value); }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={e => e.key === 'Escape' && setEditingCell(null)}
                                  className="w-20 rounded-lg border border-blue-400 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff]" />
                              ) : (
                                <button onClick={() => { setEditingCell({ sid: st.student_sid, catId: cat.id }); setCellValue(String(raw ?? '')); }}
                                  className="w-20 rounded-lg px-2 py-1 text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 transition-all">
                                  {raw !== null && raw !== undefined ? (
                                    <span className="font-semibold text-[#122b59]">{raw}</span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}

                        <td className="px-4 py-2.5 text-center">
                          <span className="text-sm font-bold text-[#122b59] ">
                            {st.weighted_total.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center justify-center h-7 w-10 rounded-lg text-xs font-bold text-white ${GRADE_COLORS[st.letter_grade] ?? 'bg-slate-400'}`}>
                            {st.letter_grade}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: Results & Rankings ─── */}
        {activeTab === 2 && (
          <div className="space-y-4">
            {!gradebook || gradebook.students.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                <BarChart2 className="h-10 w-10 opacity-30" />
                <p className="text-sm">No grade data yet. Enter scores in the Grade Book tab first.</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Class Average', value: `${(gradebook.students.reduce((s, st) => s + st.weighted_total, 0) / gradebook.students.length).toFixed(1)}%`, icon: BarChart2, color: 'from-[#2269ff] to-violet-600' },
                    { label: 'Highest Score', value: `${Math.max(...gradebook.students.map(s => s.weighted_total)).toFixed(1)}%`, icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
                    { label: 'Lowest Score', value: `${Math.min(...gradebook.students.map(s => s.weighted_total)).toFixed(1)}%`, icon: ChevronDown, color: 'from-rose-500 to-red-600' },
                    { label: 'Pass Rate', value: `${Math.round(gradebook.students.filter(s => s.weighted_total >= 60).length / gradebook.students.length * 100)}%`, icon: CheckCircle2, color: 'from-amber-500 to-orange-600' },
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

                {/* Rankings table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm ">
                  <div className="border-b border-slate-100 px-5 py-3 bg-slate-50 ">
                    <h3 className="font-semibold text-[#122b59] ">Student Rankings</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-50 ">
                        {['Rank', 'Student', 'Weighted Total', 'Letter Grade', 'GPA', 'Performance'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 ">
                      {gradebook.students.map((st, idx) => {
                        const isTop3 = (st.rank ?? 99) <= 3;
                        const rankEmoji = st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `#${st.rank}`;
                        const barWidth = `${st.weighted_total}%`;
                        const barColor = st.weighted_total >= 80 ? 'bg-emerald-500' : st.weighted_total >= 60 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <motion.tr key={st.student_sid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                            className={`hover:bg-slate-50 :bg-[#1c3a73]/40 ${isTop3 ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-5 py-3 text-xl">{rankEmoji}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2269ff] to-violet-600 text-xs font-bold text-white">
                                  {st.student_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                                </div>
                                <div>
                                  <p className="font-medium text-[#0a1f44] ">{st.student_name}</p>
                                  <p className="font-mono text-xs text-[#2269ff]">{st.student_sid}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span className="font-bold text-[#122b59] ">{st.weighted_total.toFixed(1)}%</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center justify-center h-7 w-10 rounded-lg text-xs font-bold text-white ${GRADE_COLORS[st.letter_grade] ?? 'bg-slate-400'}`}>
                                {st.letter_grade}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="font-semibold text-[#1c3a73] ">{st.gpa.toFixed(2)}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <div className="flex-1 h-2 rounded-full bg-slate-100">
                                  <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: barWidth }} />
                                </div>
                                <span className="text-xs text-slate-500">{st.weighted_total.toFixed(0)}</span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── TAB 3: Report Cards ─── */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <p className="text-sm text-slate-500">{reportCards.length} report cards</p>
              <Button onClick={() => generateCardsMutation.mutate()}
                className="bg-[#2269ff] hover:bg-[#2269ff] text-white"
                disabled={generateCardsMutation.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${generateCardsMutation.isPending ? 'animate-spin' : ''}`} />
                Generate / Recalculate
              </Button>
            </div>

            {reportCards.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                <FileText className="h-10 w-10 opacity-30" />
                <p className="text-sm">No report cards yet. Click "Generate" after entering scores.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reportCards.map((card, idx) => {
                  const gradeBg = GRADE_COLORS[card.letter_grade ?? 'F'] ?? 'bg-slate-400';
                  const studentResult = gradebook?.students.find(s => s.student_sid === card.student_sid);
                  return (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow ">
                      {/* Card header */}
                      <div className="bg-gradient-to-r from-[#2269ff] to-violet-600 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{card.student_name}</p>
                            <p className="text-xs opacity-80 font-mono">{card.student_sid}</p>
                          </div>
                          <div className="text-center">
                            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${gradeBg} text-white text-lg font-black shadow`}>
                              {card.letter_grade ?? '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 divide-x divide-slate-100 ">
                        {[
                          { label: 'Score', value: `${(card.weighted_total ?? 0).toFixed(1)}%` },
                          { label: 'GPA', value: (card.gpa ?? 0).toFixed(2) },
                          { label: 'Rank', value: `#${card.rank ?? '—'}` },
                        ].map(s => (
                          <div key={s.label} className="py-3 text-center">
                            <p className="text-base font-bold text-[#122b59] ">{s.value}</p>
                            <p className="text-xs text-slate-400">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Comments preview */}
                      {card.teacher_comment && (
                        <div className="border-t border-slate-50 px-4 py-2 ">
                          <p className="text-xs text-slate-400">Teacher:</p>
                          <p className="text-xs text-slate-600 truncate">{card.teacher_comment}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 border-t border-slate-100 p-3 ">
                        <Button variant="outline" size="sm" className="flex-1"
                          onClick={() => { setCommentCard(card); setTcComment(card.teacher_comment ?? ''); setPcComment(card.principal_comment ?? ''); }}>
                          <Edit2 className="mr-1 h-3.5 w-3.5" /> Comments
                        </Button>
                        <Button size="sm" className="flex-1 bg-[#2269ff] hover:bg-[#2269ff] text-white"
                          onClick={() => printReportCard(card, categories, studentResult)}>
                          <Printer className="mr-1 h-3.5 w-3.5" /> Print PDF
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        </>)}

        {/* ─── Add Category Modal ─── */}
        <AnimatePresence>
          {showCatForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCatForm(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0a1f44] ">Add Score Category</h2>
                  <button onClick={() => setShowCatForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Category Name</label>
                    <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Midterm Exam"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] " />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORY_TYPES.map(t => (
                        <button key={t.value} onClick={() => setCatForm(p => ({ ...p, category_type: t.value }))}
                          className={`flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                            catForm.category_type === t.value
                              ? 'border-[#2269ff] bg-blue-50 text-[#2269ff]'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}>
                          <span>{t.emoji}</span> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Weight %</label>
                      <input type="number" min={0} max={100} value={catForm.weight_percent}
                        onChange={e => setCatForm(p => ({ ...p, weight_percent: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] " />
                      <p className="mt-1 text-xs text-slate-400">Current total: {(totalWeight + catForm.weight_percent).toFixed(0)}%</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Max Score</label>
                      <input type="number" min={1} value={catForm.max_score}
                        onChange={e => setCatForm(p => ({ ...p, max_score: parseFloat(e.target.value) || 100 }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] " />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCatForm(false)}>Cancel</Button>
                  <Button onClick={() => createCatMutation.mutate(catForm)}
                    className="bg-[#2269ff] hover:bg-[#2269ff] text-white"
                    disabled={!catForm.name || createCatMutation.isPending}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─── Comment Modal ─── */}
        <AnimatePresence>
          {commentCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCommentCard(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0a1f44] ">Add Comments</h2>
                  <button onClick={() => setCommentCard(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                </div>
                <div className="mb-2 rounded-xl bg-blue-50 p-3 ">
                  <p className="font-semibold text-[#122b59] ">{commentCard.student_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{commentCard.student_sid} · Grade: {commentCard.letter_grade ?? '—'}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Teacher Comment</label>
                    <textarea rows={3} value={tcComment} onChange={e => setTcComment(e.target.value)}
                      placeholder="Enter your comments about this student's performance…"
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] " />
                  </div>
                  {isReviewer && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">Principal Comment</label>
                      <textarea rows={3} value={pcComment} onChange={e => setPcComment(e.target.value)}
                        placeholder="Enter principal's comments…"
                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] " />
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setCommentCard(null)}>Cancel</Button>
                  <Button onClick={() => updateCardMutation.mutate({ id: commentCard.id, data: { teacher_comment: tcComment, principal_comment: pcComment } })}
                    className="bg-[#2269ff] hover:bg-[#2269ff] text-white" disabled={updateCardMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Comments
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
