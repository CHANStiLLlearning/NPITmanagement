import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Save, Send, CheckCircle2, XCircle, Clock, Eye, Search,
  FileText, Paperclip, X, Trash2, ChevronDown, ChevronRight,
  Download, Printer, Filter, RotateCcw, AlertTriangle, ThumbsUp,
  ThumbsDown, BookOpen, User, Calendar, School, Target,
  Lightbulb, Users, Activity, HelpCircle, Wrench, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────
interface Attachment {
  name: string;
  file_type: string;
  url: string;
}

interface TeachingReport {
  id: number;
  teacher_email: string;
  teacher_name: string;
  report_date: string;
  class_name?: string;
  subject?: string;
  lesson_title?: string;
  lesson_objective?: string;
  teaching_method?: string;
  activities?: string;
  homework?: string;
  student_participation?: string;
  problems_faced?: string;
  solutions_applied?: string;
  next_lesson_plan?: string;
  attachments: Attachment[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  created_at: string;
  updated_at: string;
}

const emptyForm: Partial<TeachingReport> = {
  report_date: new Date().toISOString().split('T')[0],
  class_name: '', subject: '', lesson_title: '',
  lesson_objective: '', teaching_method: '', activities: '',
  homework: '', student_participation: '', problems_faced: '',
  solutions_applied: '', next_lesson_plan: '', attachments: [],
  status: 'draft',
};

const statusConfig: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  draft:     { label: 'Draft',     badge: 'bg-slate-100 text-slate-600',   icon: Save         },
  submitted: { label: 'Submitted', badge: 'bg-blue-100 text-blue-700',   icon: Clock        },
  approved:  { label: 'Approved',  badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  badge: 'bg-red-100 text-red-700',     icon: XCircle      },
};

const TEACHING_METHODS = [
  'Lecture', 'Discussion', 'Problem-Based Learning', 'Project-Based Learning',
  'Cooperative Learning', 'Demonstration', 'Inquiry-Based', 'Flipped Classroom',
  'Direct Instruction', 'Blended Learning', 'Socratic Method', 'Other',
];



// ─── Auto-save hook ───────────────────────────────────
function useAutoSave(
  reportId: number | null,
  formData: Partial<TeachingReport>,
  isDirty: boolean,
  onSave: () => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!isDirty || !reportId || formData.status !== 'draft') return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await axios.put(`/teaching-reports/${reportId}`, formData);
        setLastSaved(new Date());
        onSave();
      } finally {
        setSaving(false);
      }
    }, 2500);
    return () => clearTimeout(timerRef.current);
  }, [formData, isDirty]);

  return { saving, lastSaved };
}

// ─── Print PDF helper ─────────────────────────────────
function printReport(report: TeachingReport) {
  const win = window.open('', '_blank')!;
  win.document.write(`
    <html><head><title>Teaching Report – ${report.lesson_title}</title>
    <style>
      body{font-family:sans-serif;padding:32px;color:#111;max-width:800px;margin:auto;}
      h1{font-size:22px;font-weight:bold;margin-bottom:4px;}
      .meta{color:#6b7280;font-size:13px;margin-bottom:24px;}
      .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;}
      .section{margin-bottom:16px;}
      .label{font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;}
      .value{font-size:14px;white-space:pre-wrap;background:#f9fafb;border-radius:8px;padding:10px;border:1px solid #e5e7eb;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
      @media print{body{padding:16px;}}
    </style></head><body>
    <h1>${report.lesson_title || 'Teaching Report'}</h1>
    <div class="meta">${report.teacher_name} · ${report.class_name || ''} · ${report.subject || ''} · ${report.report_date}</div>
    <div class="grid">
      <div class="section"><div class="label">Date</div><div class="value">${report.report_date}</div></div>
      <div class="section"><div class="label">មុខវិជ្ជា (Subject)</div><div class="value">${report.subject || report.class_name || '—'}</div></div>
      <div class="section"><div class="label">Teaching Method</div><div class="value">${report.teaching_method || '—'}</div></div>
    </div>
    ${[
      ['Lesson Objective', report.lesson_objective],
      ['Activities', report.activities],
      ['Homework', report.homework],
      ['Student Participation', report.student_participation],
      ['Problems Faced', report.problems_faced],
      ['Solutions Applied', report.solutions_applied],
      ['Next Lesson Plan', report.next_lesson_plan],
    ].map(([label, val]) => `<div class="section"><div class="label">${label}</div><div class="value">${val || '—'}</div></div>`).join('')}
    ${report.review_note ? `<div class="section"><div class="label">Review Note</div><div class="value">${report.review_note}</div></div>` : ''}
    <script>window.onload=()=>{window.print();window.close();}<\/script>
    </body></html>
  `);
  win.document.close();
}

// ─── TABS ─────────────────────────────────────────────
const TABS = ['Write Report', 'All Reports', 'Pending Approval'];

// ─── Main Component ───────────────────────────────────
export default function TeachingReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isReviewer = ['super_admin', 'admin', 'principal'].includes(user?.role ?? '');

  const [activeTab, setActiveTab]     = useState(0);
  const [formData, setFormData]       = useState<Partial<TeachingReport>>(emptyForm);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [isDirty, setIsDirty]         = useState(false);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewReport, setViewReport]   = useState<TeachingReport | null>(null);
  const [reviewTarget, setReviewTarget] = useState<TeachingReport | null>(null);
  const [reviewNote, setReviewNote]   = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const { data: dbSubjects = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['subjects'],
    queryFn: async () => (await axios.get('/academic/subjects')).data,
  });

  const subjectOptions = dbSubjects.length > 0 ? dbSubjects.map(s => s.name) : ['General'];
  const { data: reports = [], refetch } = useQuery<TeachingReport[]>({
    queryKey: ['teaching-reports', search, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get('/teaching-reports/', { params });
      return data;
    },
  });

  const pendingReports = reports.filter(r => r.status === 'submitted');

  // Auto-save
  const handleAutoSave = useCallback(() => setIsDirty(false), []);
  const { saving, lastSaved } = useAutoSave(editingId, formData, isDirty, handleAutoSave);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: Partial<TeachingReport>) => axios.post('/teaching-reports/', { ...d, status: 'draft' }),
    onSuccess: (res) => {
      setEditingId(res.data.id);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['teaching-reports'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeachingReport> }) =>
      axios.put(`/teaching-reports/${id}`, data),
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['teaching-reports'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: number) => axios.post(`/teaching-reports/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-reports'] });
      resetForm();
      setActiveTab(1);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: string; note: string }) =>
      axios.post(`/teaching-reports/${id}/review`, { action, review_note: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching-reports'] });
      setReviewTarget(null);
      setReviewNote('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/teaching-reports/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teaching-reports'] }),
  });

  // Helpers
  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsDirty(false);
  };

  const setField = (k: string, v: string) => {
    setFormData(p => ({ ...p, [k]: v }));
    setIsDirty(true);
  };

  const handleSaveDraft = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSubmit = () => {
    if (!editingId) {
      createMutation.mutate(formData, {
        onSuccess: (res) => submitMutation.mutate(res.data.id),
      });
    } else {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => submitMutation.mutate(editingId),
      });
    }
  };

  const openEdit = (r: TeachingReport) => {
    setFormData({ ...r });
    setEditingId(r.id);
    setIsDirty(false);
    setActiveTab(0);
  };

  // File attachment handler
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const fileType = file.name.endsWith('.pdf') ? 'pdf'
        : file.name.match(/\.(pptx?|ppt)$/i) ? 'pptx'
        : file.name.match(/\.(docx?|doc)$/i) ? 'docx'
        : 'image';
      const url = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({ name: file.name, file_type: fileType, url });
    }
    const combined = [...(formData.attachments || []), ...newAttachments];
    setFormData(p => ({ ...p, attachments: combined }));
    setIsDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx: number) => {
    const updated = (formData.attachments || []).filter((_, i) => i !== idx);
    setFormData(p => ({ ...p, attachments: updated }));
    setIsDirty(true);
  };

  const fileIcon: Record<string, string> = { pdf: '📄', pptx: '📊', docx: '📝', image: '🖼️' };

  // ── Field sections for the form ──
  const formSections = [
    {
      title: 'Class Information',
      icon: School,
      fields: [
        { key: 'report_date', label: 'Date *', type: 'date', full: false },
        { key: 'subject', label: 'មុខវិជ្ជា (Subject) *', type: 'select', options: subjectOptions, full: false },
        { key: 'lesson_title', label: 'Lesson Title *', type: 'text', full: true },
      ],
    },
    {
      title: 'Lesson Content',
      icon: BookOpen,
      fields: [
        { key: 'lesson_objective', label: 'Lesson Objective', type: 'textarea', full: true },
        { key: 'teaching_method', label: 'Teaching Method', type: 'select', options: TEACHING_METHODS, full: false },
        { key: 'activities', label: 'Activities Conducted', type: 'textarea', full: true },
        { key: 'homework', label: 'Homework Assigned', type: 'textarea', full: true },
      ],
    },
    {
      title: 'Class Assessment',
      icon: Users,
      fields: [
        { key: 'student_participation', label: 'Student Participation & Engagement', type: 'textarea', full: true },
        { key: 'problems_faced', label: 'Problems / Challenges Faced', type: 'textarea', full: true },
        { key: 'solutions_applied', label: 'Solutions Applied', type: 'textarea', full: true },
      ],
    },
    {
      title: 'Next Steps',
      icon: ArrowRight,
      fields: [
        { key: 'next_lesson_plan', label: 'Next Lesson Plan', type: 'textarea', full: true },
      ],
    },
  ];

  const isEditable = !formData.status || formData.status === 'draft' || formData.status === 'rejected';

  return (
    <Layout>
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">Teaching Reports</h1>
            <p className="text-sm text-slate-500">Submit and manage your daily teaching logs</p>
          </div>
          <div className="flex gap-2">
            {activeTab !== 0 && (
              <Button onClick={() => { resetForm(); setActiveTab(0); }} className="bg-[#2269ff] hover:bg-[#2269ff] text-white" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> New Report
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`relative flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === i ? 'bg-white text-[#2269ff] shadow ' : 'text-slate-500 hover:text-[#122b59]'
              }`}>
              {tab}
              {tab === 'Pending Approval' && pendingReports.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingReports.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB 0: Write Report ─── */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Auto-save indicator */}
            <div className="flex items-center justify-between rounded-xl bg-white p-3 px-4 shadow-sm border border-slate-100 ">
              <div className="flex items-center gap-2 text-sm">
                {saving ? (
                  <><RotateCcw className="h-4 w-4 animate-spin text-[#2269ff]" /><span className="text-[#2269ff] font-medium">Auto-saving…</span></>
                ) : lastSaved ? (
                  <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-slate-500">Saved {lastSaved.toLocaleTimeString()}</span></>
                ) : (
                  <><Save className="h-4 w-4 text-slate-400" /><span className="text-slate-400">Draft — changes saved automatically</span></>
                )}
              </div>
              {editingId && formData.status && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[formData.status]?.badge}`}>
                  {statusConfig[formData.status]?.label}
                </span>
              )}
            </div>

            {/* Form sections */}
            {formSections.map((section) => (
              <div key={section.title} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 ">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 ">
                    <section.icon className="h-4 w-4 text-[#2269ff]" />
                  </div>
                  <h2 className="font-semibold text-[#122b59] ">{section.title}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.fields.map((f) => (
                    <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600 ">{f.label}</label>
                      {f.type === 'select' ? (
                        <select disabled={!isEditable} value={(formData as any)[f.key] || ''}
                          onChange={e => setField(f.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] disabled:opacity-60">
                          <option value="">— Select —</option>
                          {f.options?.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea disabled={!isEditable} rows={4} value={(formData as any)[f.key] || ''}
                          onChange={e => setField(f.key, e.target.value)}
                          placeholder={`Enter ${f.label.toLowerCase()}…`}
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] disabled:opacity-60" />
                      ) : (
                        <input disabled={!isEditable} type={f.type} value={(formData as any)[f.key] || ''}
                          onChange={e => setField(f.key, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] disabled:opacity-60" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Attachments */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 ">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 ">
                  <Paperclip className="h-4 w-4 text-[#2269ff]" />
                </div>
                <h2 className="font-semibold text-[#122b59] ">Attachments</h2>
                <span className="text-xs text-slate-400">(Images, PDF, PowerPoint, Word)</span>
              </div>

              {isEditable && (
                <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-400 hover:border-blue-400 hover:text-[#2269ff] transition-colors :border-[#2269ff]">
                  <Paperclip className="h-5 w-5" />
                  <span>Click to attach files</span>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.pptx,.ppt,.docx,.doc" className="hidden" onChange={handleFileAttach} />
                </label>
              )}

              {(formData.attachments || []).length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(formData.attachments || []).map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 ">
                      <span className="text-2xl">{fileIcon[a.file_type] || '📎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[#122b59] ">{a.name}</p>
                        <p className="text-xs text-slate-400 uppercase">{a.file_type}</p>
                      </div>
                      {isEditable && (
                        <button onClick={() => removeAttachment(idx)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {a.file_type === 'image' && (
                        <a href={a.url} target="_blank" className="rounded-lg p-1 text-slate-400 hover:bg-blue-50 hover:text-[#2269ff]">
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviewer note (read-only) */}
            {formData.status === 'rejected' && formData.review_note && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 ">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 ">Report Rejected</p>
                  <p className="mt-1 text-sm text-red-600 ">{formData.review_note}</p>
                  <p className="mt-1 text-xs text-red-400">By {formData.reviewed_by} · {formData.reviewed_at?.slice(0,10)}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {isEditable && (
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={handleSaveDraft} disabled={updateMutation.isPending || createMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Draft
                </Button>
                <Button onClick={handleSubmit} className="bg-[#2269ff] hover:bg-[#2269ff] text-white"
                  disabled={submitMutation.isPending || !formData.report_date || !formData.lesson_title}>
                  <Send className="mr-2 h-4 w-4" /> Submit for Approval
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 1: All Reports ─── */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {/* Search + filter */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff] " />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
                <option value="">All Status</option>
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <ReportTable reports={reports} onEdit={openEdit} onView={r => setViewReport(r)}
              onDelete={id => deleteMutation.mutate(id)} onPrint={printReport}
              isReviewer={isReviewer} onReview={r => { setReviewTarget(r); setReviewNote(''); }} />
          </div>
        )}

        {/* ─── TAB 2: Pending Approval (Principal/Admin) ─── */}
        {activeTab === 2 && (
          <div className="space-y-4">
            {!isReviewer && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-700">Only principals and admins can review and approve reports.</p>
              </div>
            )}
            <ReportTable reports={pendingReports} onEdit={openEdit} onView={r => setViewReport(r)}
              onDelete={id => deleteMutation.mutate(id)} onPrint={printReport}
              isReviewer={isReviewer} onReview={r => { setReviewTarget(r); setReviewNote(''); }} />
          </div>
        )}

        {/* ─── View Report Modal ─── */}
        <AnimatePresence>
          {viewReport && (
            <Modal onClose={() => setViewReport(null)} title="Teaching Report" wide>
              <div className="flex items-center justify-between mb-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[viewReport.status]?.badge}`}>
                  {statusConfig[viewReport.status]?.label}
                </span>
                <Button variant="outline" size="sm" onClick={() => printReport(viewReport)}>
                  <Printer className="mr-1.5 h-4 w-4" /> Print / Export PDF
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ['Teacher',              viewReport.teacher_name],
                  ['Date',                 viewReport.report_date],
                  ['មុខវិជ្ជា (Subject)',  viewReport.subject || viewReport.class_name],
                  ['Method',               viewReport.teaching_method],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-slate-50 p-3 ">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="text-sm font-medium text-[#122b59] ">{v || '—'}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {[
                  { icon: Target,     label: 'Lesson Objective',         value: viewReport.lesson_objective },
                  { icon: Activity,   label: 'Activities',               value: viewReport.activities },
                  { icon: BookOpen,   label: 'Homework',                 value: viewReport.homework },
                  { icon: Users,      label: 'Student Participation',    value: viewReport.student_participation },
                  { icon: HelpCircle, label: 'Problems Faced',           value: viewReport.problems_faced },
                  { icon: Wrench,     label: 'Solutions Applied',        value: viewReport.solutions_applied },
                  { icon: ArrowRight, label: 'Next Lesson Plan',         value: viewReport.next_lesson_plan },
                ].map(({ icon: Icon, label, value }) => value ? (
                  <div key={label} className="rounded-xl bg-slate-50 p-4 ">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#2269ff]">
                      <Icon className="h-3.5 w-3.5" />{label}
                    </div>
                    <p className="text-sm text-[#1c3a73] whitespace-pre-wrap">{value}</p>
                  </div>
                ) : null)}
              </div>

              {viewReport.review_note && (
                <div className={`mt-4 rounded-xl p-4 ${viewReport.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Review Note by {viewReport.reviewed_by}</p>
                  <p className="text-sm">{viewReport.review_note}</p>
                </div>
              )}

              {(viewReport.attachments || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {viewReport.attachments.map((a, i) => (
                      <span key={i} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-[#1c3a73] ">
                        {fileIcon[a.file_type]} {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* ─── Review Modal ─── */}
        <AnimatePresence>
          {reviewTarget && isReviewer && (
            <Modal onClose={() => setReviewTarget(null)} title="Review Report">
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4 ">
                  <p className="font-semibold text-[#122b59] ">{reviewTarget.lesson_title || 'Untitled'}</p>
                  <p className="text-sm text-slate-500">{reviewTarget.teacher_name} · {reviewTarget.subject || reviewTarget.class_name} · {reviewTarget.report_date}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Review Note (optional)</label>
                  <textarea rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                    placeholder="Add feedback or reason for rejection…"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] " />
                </div>
                <div className="flex justify-end gap-3">
                  <Button onClick={() => reviewMutation.mutate({ id: reviewTarget.id, action: 'reject', note: reviewNote })}
                    className="bg-red-600 hover:bg-red-700 text-white" disabled={reviewMutation.isPending}>
                    <ThumbsDown className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button onClick={() => reviewMutation.mutate({ id: reviewTarget.id, action: 'approve', note: reviewNote })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={reviewMutation.isPending}>
                    <ThumbsUp className="mr-2 h-4 w-4" /> Approve
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

// ─── Report Table ─────────────────────────────────────
function ReportTable({ reports, onEdit, onView, onDelete, onPrint, isReviewer, onReview }: {
  reports: TeachingReport[];
  onEdit: (r: TeachingReport) => void;
  onView: (r: TeachingReport) => void;
  onDelete: (id: number) => void;
  onPrint: (r: TeachingReport) => void;
  isReviewer: boolean;
  onReview: (r: TeachingReport) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 text-slate-400 ">
        <FileText className="h-12 w-12 opacity-30" />
        <p className="text-sm">No reports found.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 ">
            <tr>
              {['Report', 'Teacher', 'មុខវិជ្ជា (Subject)', 'Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 ">
            {reports.map((r, idx) => {
              const cfg = statusConfig[r.status];
              const Icon = cfg?.icon ?? FileText;
              const canEdit = r.status === 'draft' || r.status === 'rejected';
              return (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50 :bg-[#1c3a73]/40">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#0a1f44] truncate max-w-[200px]">{r.lesson_title || 'Untitled Report'}</p>
                    {(r.attachments || []).length > 0 && (
                      <p className="text-xs text-slate-400"><Paperclip className="inline h-3 w-3 mr-0.5" />{r.attachments.length} file(s)</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 ">{r.teacher_name}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-[#122b59] ">{r.subject || r.class_name || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{r.report_date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg?.badge}`}>
                      <Icon className="h-3 w-3" />{cfg?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onView(r)} title="View" className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[#2269ff]">
                        <Eye className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <button onClick={() => onEdit(r)} title="Edit" className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600">
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => onPrint(r)} title="Print PDF" className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600">
                        <Printer className="h-4 w-4" />
                      </button>
                      {isReviewer && r.status === 'submitted' && (
                        <button onClick={() => onReview(r)} title="Review" className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => onDelete(r.id)} title="Delete" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────
function Modal({ children, onClose, title, wide }: {
  children: React.ReactNode; onClose: () => void; title: string; wide?: boolean;
}) {
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
