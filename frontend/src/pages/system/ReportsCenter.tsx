import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, CalendarCheck, Users, GraduationCap, Award,
  BookOpen, Download, Printer, Filter, RefreshCw, BarChart2,
  CheckCircle2, AlertCircle, School, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchoolSummary {
  total_students: number;
  total_teachers: number;
  attendance_rate: number;
  total_attendance_scans: number;
  teaching_reports_count: number;
  approved_teaching_reports: number;
  report_cards_count: number;
  average_gpa: number;
  generated_at: string;
}

const REPORT_TYPES = [
  { id: 'attendance',       title: 'Attendance Report',     desc: 'Daily, weekly & monthly attendance rates per class and student', icon: CalendarCheck, color: 'text-[#2269ff] bg-blue-50 border-blue-200' },
  { id: 'teachers',         title: 'Teacher Report',        desc: 'Teacher ratings, qualification, performance ratings and activity logs', icon: Users, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'students',         title: 'Student Report',        desc: 'Active student directory, guardian contact details, and enrollments', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'teaching-reports', title: 'Teaching Log Report',   desc: 'Submitted lesson plans, objectives, homework, and principal approvals', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'scores',           title: 'Score Report',          desc: 'Weighted category scores, class averages, letter grades and rankings', icon: Award, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { id: 'report-cards',     title: 'Report Cards Generator', desc: 'Generated official student report cards with teacher/principal remarks', icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'school-summary',   title: 'School Summary',        desc: 'Executive summary KPI metrics and overall institutional performance', icon: School, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
];

const CLASSES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

export default function ReportsCenter() {
  const [selectedType, setSelectedType] = useState('attendance');
  const [selClass, setSelClass]         = useState('');
  const [fromDate, setFromDate]         = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate]             = useState(() => new Date().toISOString().split('T')[0]);

  // Query Summary Metrics
  const { data: summary, isLoading, refetch } = useQuery<SchoolSummary>({
    queryKey: ['school-summary'],
    queryFn: async () => (await axios.get('/reports-center/summary')).data,
  });

  // Export CSV
  const exportCSV = async () => {
    const params = new URLSearchParams();
    if (selClass) params.append('class_name', selClass);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate)   params.append('to_date', toDate);
    const res = await axios.get(`/reports-center/export/${selectedType}/csv?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = `${selectedType}_report.csv`; a.click();
  };

  // Print PDF View
  const printReport = () => {
    const win = window.open('', '_blank')!;
    const activeObj = REPORT_TYPES.find(r => r.id === selectedType);
    win.document.write(`<html><head><title>${activeObj?.title || 'School Report'}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;padding:32px;color:#1f2937;max-width:850px;margin:auto}
        h1{font-size:22px;font-weight:800;color:#4f46e5;margin-bottom:4px}
        .meta{color:#6b7280;font-size:13px;margin-bottom:24px}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
        .kpi{border:1px solid #e5e7eb;border-radius:12px;padding:12px;text-align:center;background:#f9fafb}
        .kpi-val{font-size:20px;font-weight:800;color:#4f46e5}
        .kpi-lbl{font-size:11px;color:#6b7280;text-transform:uppercase}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{background:#f3f4f6;padding:8px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;font-size:11px;text-transform:uppercase}
        td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
        @media print{body{padding:12px}}
      </style></head><body>
      <h1>🏫 ${activeObj?.title || 'School Management Report'}</h1>
      <div class="meta">Filter Range: ${fromDate} to ${toDate} ${selClass ? '· Class: ' + selClass : ''} · Generated on ${new Date().toLocaleDateString()}</div>
      
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-val">${summary?.total_students || 0}</div><div class="kpi-lbl">Total Students</div></div>
        <div class="kpi"><div class="kpi-val">${summary?.total_teachers || 0}</div><div class="kpi-lbl">Total Teachers</div></div>
        <div class="kpi"><div class="kpi-val">${summary?.attendance_rate || 0}%</div><div class="kpi-lbl">Attendance Rate</div></div>
        <div class="kpi"><div class="kpi-val">${summary?.average_gpa || 0}</div><div class="kpi-lbl">School Avg GPA</div></div>
      </div>

      <h3>Report Summary Details</h3>
      <p style="color:#6b7280;font-size:13px;margin-top:4px">Official institutional report output. Generated by School Management System.</p>
      
      <script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">Reports Center &amp; Exporter</h1>
            <p className="text-sm text-slate-500">Centralized reporting hub — Export PDF, Excel &amp; CSV reports across all modules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={printReport}>
              <Printer className="mr-1.5 h-4 w-4" /> Print / Export PDF
            </Button>
            <Button onClick={exportCSV} className="bg-[#2269ff] hover:bg-[#2269ff] text-white" size="sm">
              <Download className="mr-1.5 h-4 w-4" /> Export CSV / Excel
            </Button>
          </div>
        </div>

        {/* School Summary KPI Bar */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {[
            { label: 'Total Students',           value: summary?.total_students || 0,        icon: GraduationCap, color: 'from-[#2269ff] to-violet-600' },
            { label: 'Active Teachers',          value: summary?.total_teachers || 0,        icon: Users,         color: 'from-emerald-500 to-teal-600' },
            { label: 'Overall Attendance Rate',  value: `${summary?.attendance_rate || 0}%`, icon: CalendarCheck, color: 'from-amber-500 to-orange-600' },
            { label: 'School Average GPA',       value: summary?.average_gpa || 0,           icon: Award,         color: 'from-pink-500 to-rose-600' },
          ].map((c, idx) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-md`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold text-[#0a1f44] ">{c.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-medium text-slate-500">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] " />
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-medium text-slate-500">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] " />
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-slate-500">Class Filter</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] ">
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Report Types Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((rep) => {
            const Icon = rep.icon;
            const isSelected = selectedType === rep.id;
            return (
              <motion.div
                key={rep.id}
                onClick={() => setSelectedType(rep.id)}
                whileHover={{ scale: 1.01 }}
                className={`cursor-pointer rounded-2xl border p-5 transition-all shadow-sm ${
                  isSelected
                    ? 'border-[#2269ff] bg-blue-50/50 shadow-md ring-2 ring-[#2269ff]/20 '
                    : 'border-slate-100 bg-white hover:border-slate-200 '
                }`}>
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${rep.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isSelected && (
                    <span className="rounded-full bg-[#2269ff] p-1 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-bold text-[#0a1f44] text-base">{rep.title}</h3>
                <p className="mt-1 text-xs text-slate-500 ">{rep.desc}</p>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant={isSelected ? "default" : "outline"} onClick={(e) => { e.stopPropagation(); setSelectedType(rep.id); exportCSV(); }}
                    className={isSelected ? "bg-[#2269ff] text-white" : ""}>
                    <Download className="mr-1 h-3.5 w-3.5" /> CSV / Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedType(rep.id); printReport(); }}>
                    <Printer className="mr-1 h-3.5 w-3.5" /> Print PDF
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </Layout>
  );
}
