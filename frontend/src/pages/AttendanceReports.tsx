import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bar, Line, Doughnut,
} from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import {
  Calendar, Users, UserCheck, UserX, Clock, TrendingUp,
  Download, Printer, BarChart2, Filter, RefreshCw, School,
  ChevronDown, AlertTriangle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler);

// ─── Types ────────────────────────────────────────────
interface DailyRow { date: string; present: number; late: number; absent: number; excused: number; total: number; rate: number; }
interface WeeklyRow { week: string; present: number; late: number; absent: number; excused: number; total: number; rate: number; }
interface MonthlyRow { month: string; present: number; late: number; absent: number; excused: number; total: number; rate: number; }
interface ClassRow { class_name: string; present: number; late: number; absent: number; excused: number; total: number; rate: number; }
interface StudentRow { student_sid: string; student_name: string; class_name: string; present: number; late: number; absent: number; excused: number; total: number; rate: number; }
interface HeatCell { date: string; rate: number; total: number; present: number; late: number; absent: number; }
interface Summary { total: number; present: number; late: number; absent: number; excused: number; rate: number; unique_students: number; unique_days: number; }

const CLASSES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const VIEW_TABS = ['Daily', 'Weekly', 'Monthly', 'By Class', 'By Student', 'Heatmap'];

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, labels: { padding: 14, font: { size: 12 } } } },
  scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } },
};

// ─── Heatmap Cell ─────────────────────────────────────
function heatColor(rate: number | null): string {
  if (rate === null) return '#f3f4f6';
  if (rate >= 95) return '#059669';
  if (rate >= 85) return '#10b981';
  if (rate >= 75) return '#34d399';
  if (rate >= 60) return '#f59e0b';
  if (rate >= 40) return '#f97316';
  return '#ef4444';
}

// ─── Print helper ─────────────────────────────────────
function printReport(title: string, html: string) {
  const win = window.open('', '_blank')!;
  win.document.write(`<html><head><title>${title}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:32px;color:#1f2937;max-width:900px;margin:auto}
      h1{font-size:22px;font-weight:800;color:#4f46e5;margin-bottom:4px}
      .meta{color:#6b7280;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
      th{background:#f9fafb;padding:8px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;font-size:11px;text-transform:uppercase}
      td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
      .rate-good{color:#059669;font-weight:700}
      .rate-mid{color:#f59e0b;font-weight:700}
      .rate-bad{color:#ef4444;font-weight:700}
      @media print{body{padding:12px}}
    </style></head><body>${html}
    <script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
  win.document.close();
}

// ─── Main Component ───────────────────────────────────
export default function AttendanceReports() {
  const [viewTab,     setViewTab]     = useState(0);
  const [fromDate,    setFromDate]    = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [toDate,      setToDate]      = useState(() => new Date().toISOString().split('T')[0]);
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [classFilter, setClassFilter] = useState('');

  // ── Queries ──────────────────────────────────────────
  const summaryQ = useQuery<Summary>({
    queryKey: ['att-summary', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/summary', { params: p });
      return data;
    },
  });

  const dailyQ = useQuery<DailyRow[]>({
    queryKey: ['att-daily', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/daily', { params: p });
      return data;
    },
    enabled: viewTab === 0,
  });

  const weeklyQ = useQuery<WeeklyRow[]>({
    queryKey: ['att-weekly', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/weekly', { params: p });
      return data;
    },
    enabled: viewTab === 1,
  });

  const monthlyQ = useQuery<MonthlyRow[]>({
    queryKey: ['att-monthly', year, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { year: String(year) };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/monthly', { params: p });
      return data;
    },
    enabled: viewTab === 2,
  });

  const byClassQ = useQuery<ClassRow[]>({
    queryKey: ['att-by-class', fromDate, toDate],
    queryFn: async () => {
      const { data } = await axios.get('/attendance/reports/by-class', { params: { from_date: fromDate, to_date: toDate } });
      return data;
    },
    enabled: viewTab === 3,
  });

  const byStudentQ = useQuery<StudentRow[]>({
    queryKey: ['att-by-student', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/by-student', { params: p });
      return data;
    },
    enabled: viewTab === 4,
  });

  const heatmapQ = useQuery<HeatCell[]>({
    queryKey: ['att-heatmap', year, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { year: String(year) };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/heatmap', { params: p });
      return data;
    },
    enabled: viewTab === 5,
  });

  const s = summaryQ.data;

  // Export CSV
  const exportCSV = async () => {
    const p = new URLSearchParams({ from_date: fromDate, to_date: toDate });
    if (classFilter) p.append('class_name', classFilter);
    const res = await axios.get(`/attendance/export/csv?${p}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
  };

  // ── Chart helpers ─────────────────────────────────────
  const makeStackedBar = (labels: string[], data: {present:number;late:number;absent:number}[]) => ({
    labels,
    datasets: [
      { label: 'Present', data: data.map(d => d.present), backgroundColor: 'rgba(16,185,129,.85)', borderRadius: 4 },
      { label: 'Late',    data: data.map(d => d.late),    backgroundColor: 'rgba(245,158,11,.85)', borderRadius: 4 },
      { label: 'Absent',  data: data.map(d => d.absent),  backgroundColor: 'rgba(239,68,68,.75)',  borderRadius: 4 },
    ],
  });

  const makeRateLine = (labels: string[], rates: number[]) => ({
    labels,
    datasets: [{
      label: 'Attendance Rate %',
      data: rates,
      borderColor: 'rgb(99,102,241)',
      backgroundColor: 'rgba(99,102,241,.1)',
      tension: 0.4, fill: true,
      pointBackgroundColor: 'rgb(99,102,241)', pointRadius: 4,
    }],
  });

  const daily   = dailyQ.data   ?? [];
  const weekly  = weeklyQ.data  ?? [];
  const monthly = monthlyQ.data ?? [];
  const byClass = byClassQ.data ?? [];
  const byStudent = byStudentQ.data ?? [];
  const heatmap = heatmapQ.data ?? [];

  // Build heatmap grid (by week × day-of-week)
  const heatmapGrid = useMemo(() => {
    const map: Record<string, HeatCell> = {};
    heatmap.forEach(h => { map[h.date] = h; });
    const start = new Date(`${year}-01-01`);
    const end   = new Date(`${year}-12-31`);
    const weeks: (HeatCell | null)[][] = [];
    let week: (HeatCell | null)[] = Array(start.getDay()).fill(null);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().split('T')[0];
      week.push(map[ds] ?? { date: ds, rate: -1, total: 0, present: 0, late: 0, absent: 0 });
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
    return weeks;
  }, [heatmap, year]);

  // Print daily report
  const printDaily = () => {
    const rows = daily.map(d => {
      const rateClass = d.rate >= 85 ? 'rate-good' : d.rate >= 60 ? 'rate-mid' : 'rate-bad';
      return `<tr><td>${d.date}</td><td>${d.present}</td><td>${d.late}</td><td>${d.absent}</td><td>${d.excused}</td><td>${d.total}</td><td class="${rateClass}">${d.rate}%</td></tr>`;
    }).join('');
    printReport('Daily Attendance Report', `
      <h1>Daily Attendance Report</h1>
      <div class="meta">${fromDate} to ${toDate}${classFilter ? ' · '+classFilter : ''} · Generated ${new Date().toLocaleDateString()}</div>
      <table><thead><tr><th>Date</th><th>Present</th><th>Late</th><th>Absent</th><th>Excused</th><th>Total</th><th>Rate</th></tr></thead>
      <tbody>${rows}</tbody></table>`);
  };

  const printByStudent = () => {
    const rows = byStudent.map((s, i) => {
      const rateClass = s.rate >= 85 ? 'rate-good' : s.rate >= 60 ? 'rate-mid' : 'rate-bad';
      return `<tr><td>${i+1}</td><td>${s.student_name}</td><td>${s.student_sid}</td><td>${s.class_name}</td><td>${s.present}</td><td>${s.late}</td><td>${s.absent}</td><td class="${rateClass}">${s.rate}%</td></tr>`;
    }).join('');
    printReport('Student Attendance Report', `
      <h1>Student Attendance Report</h1>
      <div class="meta">${fromDate} to ${toDate}${classFilter ? ' · '+classFilter : ''}</div>
      <table><thead><tr><th>#</th><th>Name</th><th>ID</th><th>Class</th><th>Present</th><th>Late</th><th>Absent</th><th>Rate</th></tr></thead>
      <tbody>${rows}</tbody></table>`);
  };

  const rateCell = (rate: number) => (
    <span className={`font-bold ${rate >= 85 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
  );

  const DAYS = ['S','M','T','W','T','F','S'];
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <Layout>
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">Attendance Reports</h1>
            <p className="text-sm text-slate-500">Comprehensive attendance analytics &amp; exports</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={viewTab === 0 ? printDaily : printByStudent}>
              <Printer className="mr-1.5 h-4 w-4" /> Print PDF
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] " />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] " />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Year (heatmap/monthly)</label>
            <input type="number" min={2020} max={2030} value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] " />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Class</label>
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] ">
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {[
            { label: 'Attendance Rate', value: `${s?.rate ?? 0}%`, icon: TrendingUp, color: 'from-[#2269ff] to-violet-600', sub: 'Overall rate' },
            { label: 'Present',         value: s?.present ?? 0,   icon: UserCheck,  color: 'from-emerald-500 to-teal-600', sub: 'Total scans' },
            { label: 'Late',            value: s?.late ?? 0,      icon: Clock,      color: 'from-amber-500 to-orange-600', sub: 'Late arrivals' },
            { label: 'Absent',          value: s?.absent ?? 0,    icon: UserX,      color: 'from-rose-500 to-red-600',    sub: 'Total absences' },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-md`}>
                <c.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold text-[#0a1f44] ">{c.value}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Excused',          value: s?.excused ?? 0           },
            { label: 'Unique Students',  value: s?.unique_students ?? 0   },
            { label: 'School Days',      value: s?.unique_days ?? 0       },
            { label: 'Total Records',    value: s?.total ?? 0             },
          ].map(c => (
            <div key={c.label} className="rounded-xl bg-white p-3 border border-slate-100 shadow-sm text-center ">
              <p className="text-xl font-bold text-[#122b59] ">{c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>

        {/* View Tabs */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-xl bg-slate-100 p-1 ">
            {VIEW_TABS.map((tab, i) => (
              <button key={tab} onClick={() => setViewTab(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                  viewTab === i ? 'bg-white text-[#2269ff] shadow ' : 'text-slate-500 hover:text-[#122b59]'
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Daily ─── */}
        {viewTab === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Daily Attendance (Stacked)</h3>
                <div className="h-64">
                  {daily.length > 0
                    ? <Bar data={makeStackedBar(daily.map(d => d.date.slice(5)), daily)} options={{ ...chartOpts, scales: { ...chartOpts.scales, x: { stacked: true, grid: { display: false } }, y: { stacked: true } } }} />
                    : <Empty />}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Daily Rate Trend</h3>
                <div className="h-64">
                  {daily.length > 0
                    ? <Line data={makeRateLine(daily.map(d => d.date.slice(5)), daily.map(d => d.rate))} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
                    : <Empty />}
                </div>
              </div>
            </div>
            <DataTable
              headers={['Date', 'Present', 'Late', 'Absent', 'Excused', 'Total', 'Rate']}
              rows={daily.map(d => [d.date, d.present, d.late, d.absent, d.excused, d.total, rateCell(d.rate)])} />
          </div>
        )}

        {/* ─── Weekly ─── */}
        {viewTab === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Weekly Attendance</h3>
                <div className="h-64">
                  {weekly.length > 0
                    ? <Bar data={makeStackedBar(weekly.map(w => w.week), weekly)} options={{ ...chartOpts, scales: { ...chartOpts.scales, x: { stacked: true, grid: { display: false } }, y: { stacked: true } } }} />
                    : <Empty />}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Weekly Rate %</h3>
                <div className="h-64">
                  {weekly.length > 0
                    ? <Line data={makeRateLine(weekly.map(w => w.week), weekly.map(w => w.rate))} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
                    : <Empty />}
                </div>
              </div>
            </div>
            <DataTable
              headers={['Week', 'Present', 'Late', 'Absent', 'Excused', 'Total', 'Rate']}
              rows={weekly.map(w => [w.week, w.present, w.late, w.absent, w.excused, w.total, rateCell(w.rate)])} />
          </div>
        )}

        {/* ─── Monthly ─── */}
        {viewTab === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Monthly Attendance ({year})</h3>
                <div className="h-64">
                  {monthly.length > 0
                    ? <Bar data={makeStackedBar(monthly.map(m => m.month), monthly)} options={{ ...chartOpts, scales: { ...chartOpts.scales, x: { stacked: true, grid: { display: false } }, y: { stacked: true } } }} />
                    : <Empty />}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Monthly Rate Trend</h3>
                <div className="h-64">
                  {monthly.length > 0
                    ? <Line data={makeRateLine(monthly.map(m => m.month), monthly.map(m => m.rate))} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
                    : <Empty />}
                </div>
              </div>
            </div>
            <DataTable
              headers={['Month', 'Present', 'Late', 'Absent', 'Excused', 'Total', 'Rate']}
              rows={monthly.map(m => [m.month, m.present, m.late, m.absent, m.excused, m.total, rateCell(m.rate)])} />
          </div>
        )}

        {/* ─── By Class ─── */}
        {viewTab === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Attendance by Class</h3>
                <div className="h-72">
                  {byClass.length > 0
                    ? <Bar data={makeStackedBar(byClass.map(c => c.class_name), byClass)} options={{ ...chartOpts, indexAxis: 'y' as const, scales: { x: { stacked: true }, y: { stacked: true, grid: { display: false } } } }} />
                    : <Empty />}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Rate by Class</h3>
                <div className="h-72">
                  {byClass.length > 0 && (
                    <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
                      {[...byClass].sort((a, b) => b.rate - a.rate).map(c => (
                        <div key={c.class_name} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-xs text-slate-600 ">{c.class_name}</span>
                          <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-5 rounded-full transition-all ${c.rate >= 85 ? 'bg-emerald-500' : c.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${c.rate}%` }} />
                          </div>
                          <span className={`w-12 text-right text-xs font-bold ${c.rate >= 85 ? 'text-emerald-600' : c.rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{c.rate}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DataTable
              headers={['Class', 'Present', 'Late', 'Absent', 'Excused', 'Total', 'Rate']}
              rows={byClass.map(c => [c.class_name, c.present, c.late, c.absent, c.excused, c.total, rateCell(c.rate)])} />
          </div>
        )}

        {/* ─── By Student ─── */}
        {viewTab === 4 && (
          <div className="space-y-4">
            {byStudent.length === 0 ? <Empty /> : (
              <>
                {/* Top/bottom performers */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 ">
                    <h3 className="mb-3 text-sm font-semibold text-rose-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> At Risk (Lowest Attendance)</h3>
                    <div className="space-y-2">
                      {byStudent.slice(0, 5).map((s, i) => (
                        <div key={s.student_sid} className="flex items-center gap-2">
                          <span className="text-lg">{['🔴','🟠','🟡','🟡','🟡'][i]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-[#122b59] ">{s.student_name}</p>
                            <p className="text-xs text-slate-400">{s.class_name} · {s.student_sid}</p>
                          </div>
                          <span className="font-bold text-red-600">{s.rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 ">
                    <h3 className="mb-3 text-sm font-semibold text-emerald-600 flex items-center gap-1.5"><UserCheck className="h-4 w-4" /> Perfect Attendance (Highest)</h3>
                    <div className="space-y-2">
                      {[...byStudent].sort((a, b) => b.rate - a.rate).slice(0, 5).map((s, i) => (
                        <div key={s.student_sid} className="flex items-center gap-2">
                          <span className="text-lg">{['🥇','🥈','🥉','⭐','⭐'][i]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-[#122b59] ">{s.student_name}</p>
                            <p className="text-xs text-slate-400">{s.class_name} · {s.student_sid}</p>
                          </div>
                          <span className="font-bold text-emerald-600">{s.rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DataTable
                  headers={['#', 'Student', 'ID', 'Class', 'Present', 'Late', 'Absent', 'Excused', 'Total', 'Rate']}
                  rows={byStudent.map((s, i) => [i+1, s.student_name, s.student_sid, s.class_name, s.present, s.late, s.absent, s.excused, s.total, rateCell(s.rate)])} />
              </>
            )}
          </div>
        )}

        {/* ─── Heatmap ─── */}
        {viewTab === 5 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-[#122b59] ">Attendance Heatmap — {year}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-500" /> Low</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-amber-500" /> Mid</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> High</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-slate-200" /> No data</span>
                </div>
              </div>

              {/* Month labels */}
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="mb-1 flex pl-6 text-xs text-slate-400">
                    {MONTH_LABELS.map(m => <span key={m} className="flex-1 text-center">{m}</span>)}
                  </div>
                  <div className="flex gap-0.5">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-0.5 pr-1">
                      {DAYS.map((d, i) => (
                        <span key={i} className="h-3 w-4 text-right text-[9px] text-slate-400 leading-3">{i % 2 === 1 ? d : ''}</span>
                      ))}
                    </div>
                    {/* Weeks */}
                    {heatmapGrid.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {week.map((cell, di) => (
                          <div key={di}
                            style={{ backgroundColor: cell && cell.rate >= 0 ? heatColor(cell.rate) : '#f3f4f6' }}
                            className="h-3 w-3 rounded-sm cursor-default transition-transform hover:scale-125"
                            title={cell ? `${cell.date}: ${cell.rate >= 0 ? cell.rate + '%' : 'No school'}` : ''} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Doughnut */}
            {heatmap.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  { label: 'High (≥85%)',  count: heatmap.filter(h => h.rate >= 85).length, color: 'text-emerald-600', dot: 'bg-emerald-500' },
                  { label: 'Mid (60-84%)', count: heatmap.filter(h => h.rate >= 60 && h.rate < 85).length, color: 'text-amber-600', dot: 'bg-amber-500' },
                  { label: 'Low (<60%)',   count: heatmap.filter(h => h.rate < 60).length, color: 'text-red-600', dot: 'bg-red-500' },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 text-center">
                    <div className={`flex items-center justify-center gap-2 mb-2 text-xs font-semibold ${c.color}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />{c.label}
                    </div>
                    <p className={`text-3xl font-bold ${c.color}`}>{c.count}</p>
                    <p className="text-xs text-slate-400 mt-1">school days</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}

// ─── Reusable sub-components ──────────────────────────
function Empty() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
      <BarChart2 className="h-8 w-8 opacity-30" />
      <p className="text-xs">No data for this filter range</p>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-slate-100 bg-slate-50 ">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 ">
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="px-5 py-10 text-center text-slate-400">No data</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 :bg-[#1c3a73]/40">
                {row.map((cell, j) => (
                  <td key={j} className="px-5 py-3 text-[#1c3a73] ">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
