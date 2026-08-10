import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Search,
  User, CheckCircle2, XCircle, FileText, Sparkles, X, ChevronRight,
  Eye, Check, ListFilter
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
interface Summary { total: number; present: number; late: number; absent: number; excused: number; rate: number; unique_students: number; unique_days: number; }

const VIEW_TABS = ['ប្រចាំថ្ងៃ (Daily)', 'ប្រចាំសប្តាហ៍ (Weekly)', 'ប្រចាំខែ (Monthly)', 'សិស្សម្នាក់ៗ (Individual Student)', 'Heatmap'];

function heatColor(rate: number | null): string {
  if (rate === null) return '#f3f4f6';
  if (rate >= 95) return '#059669';
  if (rate >= 85) return '#10b981';
  if (rate >= 75) return '#34d399';
  if (rate >= 60) return '#f59e0b';
  if (rate >= 40) return '#f97316';
  return '#ef4444';
}

function printReport(title: string, html: string) {
  const win = window.open('', '_blank')!;
  win.document.write(`<html><head><title>${title}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:32px;color:#1f2937;max-width:900px;margin:auto}
      h1{font-size:22px;font-weight:800;color:#2269ff;margin-bottom:4px}
      .meta{color:#6b7280;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
      th{background:#f8fafc;padding:8px 12px;text-align:left;font-weight:600;color:#6b7280;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase}
      td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
      .rate-good{color:#059669;font-weight:700}
      .rate-mid{color:#f59e0b;font-weight:700}
      .rate-bad{color:#ef4444;font-weight:700}
      .card{background:#f8fafc;padding:16px;border-radius:12px;margin-bottom:16px;border:1px solid #e2e8f0}
      @media print{body{padding:12px}}
    </style></head><body>${html}
    <script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
  win.document.close();
}

export default function AttendanceReports() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Determine initial tab from URL or default to 0 (Daily)
  const initialTab = useMemo(() => {
    if (!tabParam) return 0;
    if (tabParam === 'daily' || tabParam === '0') return 0;
    if (tabParam === 'weekly' || tabParam === '1') return 1;
    if (tabParam === 'monthly' || tabParam === '2') return 2;
    if (tabParam === 'student' || tabParam === 'individual' || tabParam === '3') return 3;
    if (tabParam === 'heatmap' || tabParam === '4') return 4;
    return 0;
  }, [tabParam]);

  const [viewTab, setViewTab] = useState(initialTab);

  // Sync tab with URL
  const handleTabChange = (newTab: number) => {
    setViewTab(newTab);
    setSearchParams({ tab: String(newTab) });
  };

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [classFilter, setClassFilter] = useState('');

  // Daily Inspection Detail Date
  const [selectedDailyDate, setSelectedDailyDate] = useState<string | null>(null);

  // Monday to Friday Weekly Reference Date State
  const [weekRefDate, setWeekRefDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Individual Student Inspection State
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [studentTimeframe, setStudentTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  // Calculate Monday to Friday dates for weekRefDate
  const weekDays = useMemo(() => {
    const ref = weekRefDate ? new Date(weekRefDate) : new Date();
    const day = ref.getDay();
    const diffToMon = ref.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(ref.setDate(diffToMon));

    const dayLabels = [
      { name: 'ច័ន្ទ (Mon)', key: 'mon' },
      { name: 'អង្គារ (Tue)', key: 'tue' },
      { name: 'ពុធ (Wed)', key: 'wed' },
      { name: 'ព្រហស្បតិ៍ (Thu)', key: 'thu' },
      { name: 'សុក្រ (Fri)', key: 'fri' },
    ];

    return dayLabels.map((l, idx) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + idx);
      const iso = d.toISOString().split('T')[0];
      return {
        ...l,
        date: iso,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
      };
    });
  }, [weekRefDate]);

  // Read local submitted records from Students page for 100% instant sync
  const localSubmissions = useMemo(() => {
    try {
      const list = JSON.parse(localStorage.getItem('npit_attendance_records') || '[]');
      const todayStr = new Date().toISOString().split('T')[0];
      return list.filter((r: any) => r.date && r.date <= todayStr);
    } catch {
      return [];
    }
  }, [viewTab, fromDate, toDate, classFilter]);

  // Queries
  const { data: dbSubjectsData = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['subjects'],
    queryFn: async () => (await axios.get('/academic/subjects')).data,
  });
  const dbSubjectOptions = useMemo(() => dbSubjectsData.map((s: { id: number; name: string }) => s.name), [dbSubjectsData]);

  const summaryQ = useQuery<Summary>({
    queryKey: ['att-summary', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/summary', { params: p });
      return data;
    },
    refetchInterval: 3000,
  });

  const byDailyQ = useQuery<DailyRow[]>({
    queryKey: ['att-daily', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/daily', { params: p });
      return data;
    },
    refetchInterval: 3000,
  });

  const byWeeklyQ = useQuery<WeeklyRow[]>({
    queryKey: ['att-weekly', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/weekly', { params: p });
      return data;
    },
    refetchInterval: 3000,
  });

  const byMonthlyQ = useQuery<MonthlyRow[]>({
    queryKey: ['att-monthly', year, classFilter],
    queryFn: async () => {
      const p: Record<string,any> = { year };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/monthly', { params: p });
      return data;
    },
    refetchInterval: 3000,
  });

  const byStudentQ = useQuery<StudentRow[]>({
    queryKey: ['att-by-student', fromDate, toDate, classFilter],
    queryFn: async () => {
      const p: Record<string,string> = { from_date: fromDate, to_date: toDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/reports/by-student', { params: p });
      return data;
    },
    refetchInterval: 3000,
  });

  const dailyDetailQ = useQuery<any[]>({
    queryKey: ['att-detail-date', selectedDailyDate, classFilter],
    queryFn: async () => {
      if (!selectedDailyDate) return [];
      const p: Record<string, string> = { date: selectedDailyDate };
      if (classFilter) p.class_name = classFilter;
      const { data } = await axios.get('/attendance/', { params: p });
      return data;
    },
    enabled: !!selectedDailyDate,
    refetchInterval: 3000,
  });

  // Calculate dynamic summary incorporating local submissions
  const summary = useMemo(() => {
    const base = summaryQ.data || { total: 0, present: 0, late: 0, absent: 0, excused: 0, rate: 0, unique_students: 0, unique_days: 0 };
    if (!localSubmissions || localSubmissions.length === 0) return base;

    const localPresent = localSubmissions.filter((r: any) => r.status === 'present').length;
    const localAbsent = localSubmissions.filter((r: any) => r.status === 'absent').length;
    const total = base.total + localSubmissions.length;
    const present = base.present + localPresent;
    const absent = base.absent + localAbsent;
    const rate = Math.round((present / (total || 1)) * 100);

    return { ...base, total, present, absent, rate };
  }, [summaryQ.data, localSubmissions]);

  // Aggregate daily records incorporating local submissions
  const dailyRows = useMemo(() => {
    const list: DailyRow[] = byDailyQ.data ? [...byDailyQ.data] : [];
    const map = new Map<string, DailyRow>();
    list.forEach(r => map.set(r.date, { ...r }));

    localSubmissions.forEach((rec: any) => {
      const recDate = rec.date || new Date().toISOString().split('T')[0];
      const existing = map.get(recDate) || {
        date: recDate,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
        rate: 0,
      };

      if (rec.status === 'present') existing.present += 1;
      else if (rec.status === 'late') existing.late += 1;
      else if (rec.status === 'absent') existing.absent += 1;
      else if (rec.status === 'excused') existing.excused += 1;

      existing.total += 1;
      existing.rate = Math.round((existing.present / (existing.total || 1)) * 100);
      map.set(recDate, existing);
    });

    const result = Array.from(map.values());
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [byDailyQ.data, localSubmissions]);

  // Active records for selected date in Daily Tab (combining real-time API and local submissions)
  const activeDailyRecords = useMemo(() => {
    if (!selectedDailyDate) return [];
    const remote = dailyDetailQ.data || [];
    const locals = localSubmissions.filter((r: any) => r.date === selectedDailyDate);
    const map = new Map();
    remote.forEach((r: any) => map.set(r.student_sid || r.id, r));
    locals.forEach((r: any) => map.set(r.student_sid || r.id, r));
    return Array.from(map.values());
  }, [selectedDailyDate, dailyDetailQ.data, localSubmissions]);

  // Filter students based on search term & incorporate submitted attendance
  const filteredStudents = useMemo(() => {
    const list = byStudentQ.data ?? [];
    const map = new Map<string, StudentRow>();

    list.forEach(st => map.set(st.student_sid, { ...st }));

    // Apply local submission updates to student statistics
    localSubmissions.forEach((rec: any) => {
      const st = map.get(rec.student_sid);
      if (st) {
        if (rec.status === 'present') st.present += 1;
        else if (rec.status === 'absent') st.absent += 1;
        st.total += 1;
        st.rate = Math.round((st.present / (st.total || 1)) * 100);
      }
    });

    const studentList = Array.from(map.values());
    if (!studentSearchTerm.trim()) return studentList;

    return studentList.filter(
      (st) =>
        st.student_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        st.student_sid.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        st.class_name.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
  }, [byStudentQ.data, localSubmissions, studentSearchTerm]);

  // Helper to get student attendance status for a specific date (Monday to Friday)
  const getStudentStatusForDate = (studentSid: string, dateIso: string) => {
    const local = localSubmissions.find((r: any) => r.student_sid === studentSid && r.date === dateIso);
    if (local) return local.status;

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateIso > todayStr) return 'upcoming';

    return 'present';
  };

  // Generate Weekly & Monthly data breakdown for a selected student dynamically from real student record
  const studentBreakdown = useMemo(() => {
    if (!selectedStudent) return { weekly: [], monthly: [] };

    const totalPresent = selectedStudent.present || 0;
    const totalLate = selectedStudent.late || 0;
    const totalAbsent = selectedStudent.absent || 0;
    const totalExcused = selectedStudent.excused || 0;
    const grandTotal = selectedStudent.total || (totalPresent + totalLate + totalAbsent + totalExcused);
    const overallRate = selectedStudent.rate || (grandTotal > 0 ? Math.round(((totalPresent + totalLate) / grandTotal) * 100) : 0);

    const weeks = [
      { period: 'ទិន្នន័យជាក់ស្តែង (Real Attendance Record)', present: totalPresent, late: totalLate, absent: totalAbsent, excused: totalExcused, total: grandTotal, rate: overallRate }
    ];

    const months = [
      { period: 'ទិន្នន័យសរុប (Total Attendance Record)', present: totalPresent, late: totalLate, absent: totalAbsent, excused: totalExcused, total: grandTotal, rate: overallRate }
    ];

    return { weekly: weeks, monthly: months };
  }, [selectedStudent, localSubmissions]);

  // Export CSV
  const exportCSV = async () => {
    const p = new URLSearchParams({ from_date: fromDate, to_date: toDate });
    if (classFilter) p.append('class_name', classFilter);
    const res = await axios.get(`/attendance/export/csv?${p}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click();
  };

  const printSingleStudentReport = () => {
    if (!selectedStudent) return;
    const isWeekly = studentTimeframe === 'weekly';
    const rows = (isWeekly ? studentBreakdown.weekly : studentBreakdown.monthly).map(r => {
      const rateClass = r.rate >= 85 ? 'rate-good' : r.rate >= 60 ? 'rate-mid' : 'rate-bad';
      return `<tr><td>${r.period}</td><td>${r.present}</td><td>${r.absent}</td><td>${r.excused}</td><td>${r.total}</td><td class="${rateClass}">${r.rate}%</td></tr>`;
    }).join('');

    printReport(`Individual Attendance Report - ${selectedStudent.student_name}`, `
      <div class="card">
        <h1>វិទ្យាស្ថានជាតិ NPIT · របាយការណ៍វត្តមានសិស្សម្នាក់ៗ</h1>
        <div class="meta">
          <strong>ឈ្មោះសិស្ស:</strong> ${selectedStudent.student_name} | 
          <strong>អត្តលេខ:</strong> ${selectedStudent.student_sid} | 
          <strong>ថ្នាក់:</strong> ${selectedStudent.class_name} | 
          <strong>អត្រាវត្តមានសរុប:</strong> ${selectedStudent.rate}%
        </div>
      </div>
      <h2>របាយការណ៍វត្តមាន ${isWeekly ? 'ប្រចាំសប្តាហ៍ (Weekly)' : 'ប្រចាំខែ (Monthly)'}</h2>
      <table>
        <thead>
          <tr><th>កាលបរិច្ឆេទ/កំឡុងពេល</th><th>វត្តមាន</th><th>អវត្តមាន</th><th>ច្បាប់</th><th>សរុប</th><th>អត្រាវត្តមាន</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `);
  };

  const rateCell = (rate: number) => (
    <span className={`font-bold ${rate >= 85 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</span>
  );

  // Render Monday to Friday Student Attendance Table Component
  const renderMondayToFridayTable = () => (
    <div className="space-y-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-blue-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-[#0a1f44] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#2269ff]" />
            <span>បញ្ជីវត្តមានសិស្សប្រចាំសប្តាហ៍ (ច័ន្ទ ដល់ សុក្រ)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            បង្ហាញវត្តមានសិស្សតាមថ្ងៃនីមួយៗចាប់ពីថ្ងៃច័ន្ទ ដល់ថ្ងៃសុក្រ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Clock className="h-4 w-4 text-[#2269ff]" />
            <label className="text-xs font-bold text-slate-600">ជ្រើសរើសសប្តាហ៍:</label>
            <input
              type="date"
              value={weekRefDate}
              onChange={(e) => setWeekRefDate(e.target.value)}
              className="text-xs font-extrabold text-[#2269ff] bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none">
            <option value="">គ្រប់មុខវិជ្ជាទាំងអស់ (All Subjects)</option>
            {dbSubjectOptions.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-600">
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">ឈ្មោះសិស្ស</th>
                <th className="px-4 py-3.5">អត្តលេខ</th>
                <th className="px-4 py-3.5">មុខវិជ្ជា</th>
                {weekDays.map((d) => (
                  <th key={d.date} className="px-4 py-3.5 text-center min-w-[105px]">
                    <div className="font-extrabold text-[#0a1f44]">{d.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{d.dayNum}/{d.monthNum}</div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right">អត្រាវត្តមាន</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-slate-400 font-medium">
                    ពុំមានទិន្នន័យសិស្សឡើយ។
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, i) => (
                  <tr key={st.student_sid} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#0a1f44] flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[#2269ff] text-xs font-extrabold shrink-0">
                          {st.student_name[0]}
                        </div>
                        <span>{st.student_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[#2269ff]">{st.student_sid}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-600">{st.class_name}</td>
                    {weekDays.map((d) => {
                      const status = getStudentStatusForDate(st.student_sid, d.date);
                      return (
                        <td key={d.date} className="px-3 py-3.5 text-center">
                          {status === 'present' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> បានមក
                            </span>
                          ) : status === 'late' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-3 w-3 text-amber-600" /> យឺត
                            </span>
                          ) : status === 'absent' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                              <XCircle className="h-3 w-3 text-red-600" /> អវត្តមាន
                            </span>
                          ) : status === 'excused' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                              <FileText className="h-3 w-3 text-blue-600" /> ច្បាប់
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-right font-extrabold">{rateCell(st.rate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-blue-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2269ff] text-white shadow-md shadow-blue-500/20">
                <BarChart2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0a1f44]">
                  {user?.role === 'student' ? 'វត្តមានរបស់ខ្ញុំ (My Attendance Reports)' : 'របាយការណ៍វត្តមាន (Attendance Reports & Analytics)'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {user?.role === 'student' ? 'មើលរបាយការណ៍វត្តមានប្រចាំថ្ងៃ និងសប្តាហ៍ផ្ទាល់ខ្លួនរបស់ខ្ញុំ' : 'មើលរបាយការណ៍វត្តមានប្រចាំថ្ងៃ សប្តាហ៍ ខែ និងរបាយការណ៍វត្តមានសិស្សម្នាក់ៗ'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl border-slate-200 text-slate-700 font-semibold gap-1.5">
              <Download className="h-4 w-4 text-[#2269ff]" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
            <span className="text-xs font-bold text-slate-400">អត្រាវត្តមានសរុប</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#2269ff]">{summary?.rate ?? 0}%</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ល្អប្រសើរ</span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
            <span className="text-xs font-bold text-slate-400">វត្តមាន (Present)</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-600">{summary?.present ?? 0}</span>
              <span className="text-xs font-medium text-slate-400">ដង</span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
            <span className="text-xs font-bold text-slate-400">អវត្តមាន (Absent)</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-red-600">{summary?.absent ?? 0}</span>
              <span className="text-xs font-medium text-slate-400">ដង</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1 rounded-2xl bg-blue-50/70 p-1.5 border border-blue-100">
          {VIEW_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => handleTabChange(i)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                viewTab === i
                  ? 'bg-[#2269ff] text-white shadow-md'
                  : 'text-[#1c3a73] hover:bg-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── TAB 0: Daily Attendance Report (របាយការណ៍វត្តមានប្រចាំថ្ងៃ) ─── */}
        {viewTab === 0 && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2269ff]" />
                  <label className="text-xs font-bold text-slate-600">ចាប់ពីថ្ងៃ:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">ដល់ថ្ងៃ:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none">
                  <option value="">គ្រប់មុខវិជ្ជាទាំងអស់</option>
                  {dbSubjectOptions.map((s: string) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-bold text-[#2269ff] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                ទិន្នន័យសរុប {dailyRows.length} ថ្ងៃ
              </div>
            </div>

            {/* Daily Attendance Summary Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h3 className="text-base font-bold text-[#0a1f44] flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#2269ff]" />
                    <span>
                      {user?.role === 'student' ? 'វត្តមានរបស់ខ្ញុំប្រចាំថ្ងៃ (My Daily Attendance)' : 'របាយការណ៍វត្តមានប្រចាំថ្ងៃ (Daily Log Summary)'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Real-Time Sync (៣ វិនាទី)</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {user?.role === 'student' ? 'ចុចលើថ្ងៃនីមួយៗដើម្បីមើលវត្តមានលម្អិត' : 'ចុចលើថ្ងៃនីមួយៗដើម្បីមើលវត្តមានសិស្សលម្អិត'}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">កាលបរិច្ឆេទ (Date)</th>
                        <th className="px-6 py-4">វត្តមាន (Present)</th>
                        <th className="px-6 py-4">អវត្តមាន (Absent)</th>
                        <th className="px-6 py-4">ច្បាប់ (Excused)</th>
                        <th className="px-6 py-4">ចំនួនសរុប</th>
                        <th className="px-6 py-4">អត្រាវត្តមាន (%)</th>
                        <th className="px-6 py-4 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {dailyRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                            ពុំមានទិន្នន័យវត្តមានប្រចាំថ្ងៃឡើយ។
                          </td>
                        </tr>
                      ) : (
                        dailyRows.map((row, idx) => {
                          const isSelected = selectedDailyDate === row.date;
                          return (
                            <tr
                              key={row.date}
                              onClick={() => setSelectedDailyDate(row.date)}
                              className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/70 font-bold' : ''
                              }`}>
                              <td className="px-6 py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                              <td className="px-6 py-4 font-bold text-[#0a1f44]">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-[#2269ff]" />
                                  <span>{row.date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-emerald-600 font-semibold">{row.present} នាក់</td>
                              <td className="px-6 py-4 text-red-600 font-semibold">{row.absent} នាក់</td>
                              <td className="px-6 py-4 text-blue-600 font-semibold">{row.excused} នាក់</td>
                              <td className="px-6 py-4 font-bold text-slate-700">{row.total} នាក់</td>
                              <td className="px-6 py-4 font-bold">{rateCell(row.rate)}</td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); setSelectedDailyDate(row.date); }}
                                  className="rounded-lg text-xs font-bold text-[#2269ff] hover:bg-blue-100 gap-1">
                                  <span>មើលលម្អិត</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Selected Date Detail Inspection */}
            {selectedDailyDate && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/20 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0a1f44] flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span>បញ្ជីវត្តមានសិស្សលម្អិត សម្រាប់ថ្ងៃទី {selectedDailyDate}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      បង្ហាញវត្តមានសិស្សទាំងអស់ដែលបានកត់ត្រាសម្រាប់ថ្ងៃនេះ
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDailyDate(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {activeDailyRecords.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    ពុំមានបញ្ជីសិស្សលម្អិតក្នុងម៉ាស៊ីនសម្រាប់ថ្ងៃទី {selectedDailyDate} ឡើយ។
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeDailyRecords.map((rec: any, i: number) => (
                      <div
                        key={rec.id || i}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white text-xs ${
                            rec.status === 'present' ? 'bg-emerald-600' : 'bg-red-600'
                          }`}>
                            {rec.student_name ? rec.student_name[0] : 'S'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#0a1f44]">{rec.student_name}</h4>
                            <span className="font-mono text-[11px] font-bold text-[#2269ff]">{rec.student_sid}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {rec.status === 'present' ? 'បានមក (Present)' : 'មិនបានមក (Absent)'}
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{rec.scan_method || 'Manual Roll Call'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Monday to Friday Student Attendance Table */}
            {renderMondayToFridayTable()}
          </div>
        )}

        {/* ─── TAB 1: Weekly Attendance Report (ប្រចាំសប្តាហ៍) ─── */}
        {viewTab === 1 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#0a1f44] mb-4">របាយការណ៍វត្តមានប្រចាំសប្តាហ៍ (Weekly Summary)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                      <th className="px-6 py-4">សប្តាហ៍ (Week)</th>
                      <th className="px-6 py-4">វត្តមាន (Present)</th>
                      <th className="px-6 py-4">អវត្តមាន (Absent)</th>
                      <th className="px-6 py-4">ច្បាប់ (Excused)</th>
                      <th className="px-6 py-4">ចំនួនសរុប</th>
                      <th className="px-6 py-4 text-right">អត្រាវត្តមាន (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(byWeeklyQ.data ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">ពុំមានទិន្នន័យប្រចាំសប្តាហ៍ឡើយ។</td>
                      </tr>
                    ) : (
                      (byWeeklyQ.data ?? []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="px-6 py-4 font-bold text-[#0a1f44]">{row.week}</td>
                          <td className="px-6 py-4 text-emerald-600 font-semibold">{row.present}</td>
                          <td className="px-6 py-4 text-red-600 font-semibold">{row.absent}</td>
                          <td className="px-6 py-4 text-blue-600 font-semibold">{row.excused}</td>
                          <td className="px-6 py-4 font-bold">{row.total}</td>
                          <td className="px-6 py-4 text-right font-extrabold">{rateCell(row.rate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monday to Friday Student Attendance Table */}
            {renderMondayToFridayTable()}
          </div>
        )}

        {/* ─── TAB 2: Monthly Attendance Report (ប្រចាំខែ) ─── */}
        {viewTab === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#0a1f44] mb-4">របាយការណ៍វត្តមានប្រចាំខែ (Monthly Summary)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                      <th className="px-6 py-4">ខែ (Month)</th>
                      <th className="px-6 py-4">វត្តមាន (Present)</th>
                      <th className="px-6 py-4">អវត្តមាន (Absent)</th>
                      <th className="px-6 py-4">ច្បាប់ (Excused)</th>
                      <th className="px-6 py-4">ចំនួនសរុប</th>
                      <th className="px-6 py-4 text-right">អត្រាវត្តមាន (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(byMonthlyQ.data ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">ពុំមានទិន្នន័យប្រចាំខែឡើយ។</td>
                      </tr>
                    ) : (
                      (byMonthlyQ.data ?? []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="px-6 py-4 font-bold text-[#0a1f44]">{row.month}</td>
                          <td className="px-6 py-4 text-emerald-600 font-semibold">{row.present}</td>
                          <td className="px-6 py-4 text-red-600 font-semibold">{row.absent}</td>
                          <td className="px-6 py-4 text-blue-600 font-semibold">{row.excused}</td>
                          <td className="px-6 py-4 font-bold">{row.total}</td>
                          <td className="px-6 py-4 text-right font-extrabold">{rateCell(row.rate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: Individual Student Attendance Report (សិស្សម្នាក់ៗ ប្រចាំ week, month) ─── */}
        {viewTab === 3 && (
          <div className="space-y-6">
            {/* Student Search & Quick Selection Toolbar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="ស្វែងរកឈ្មោះសិស្ស ឬ អត្តលេខ (ID)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-[#2269ff] focus:bg-white focus:outline-none"
                  />
                  {studentSearchTerm && (
                    <button onClick={() => setStudentSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-bold text-slate-700 focus:border-[#2269ff] focus:outline-none">
                  <option value="">គ្រប់មុខវិជ្ជាទាំងអស់</option>
                  {dbSubjectOptions.map((s: string) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <Button
                  onClick={printSingleStudentReport}
                  className="rounded-xl bg-[#2269ff] hover:bg-blue-600 text-white font-semibold text-xs gap-1.5 shadow-sm">
                  <Printer className="h-4 w-4" />
                  <span>បោះពុម្ពរបាយការណ៍សិស្ស</span>
                </Button>
              )}
            </div>

            {/* Selected Student Detailed Inspection Card */}
            <AnimatePresence>
              {selectedStudent ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="space-y-6">
                  
                  {/* Selected Student Profile Banner */}
                  <div className="flex flex-col justify-between gap-4 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 p-6 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2269ff] text-2xl font-extrabold text-white shadow-md">
                        {selectedStudent.student_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-[#0a1f44]">{selectedStudent.student_name}</h2>
                          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-extrabold text-[#2269ff]">
                            {selectedStudent.class_name}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-bold text-[#2269ff] mt-0.5">
                          ID: {selectedStudent.student_sid}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          របាយការណ៍វត្តមានលម្អិតប្រចាំសប្តាហ៍ និងប្រចាំខែ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400">អត្រាវត្តមានសរុប</span>
                        <div className="text-3xl font-extrabold text-[#2269ff]">{selectedStudent.rate}%</div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                        title="បិទការមើលលម្អិត">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Timeframe Switcher: Weekly vs Monthly */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-white p-1 shadow-2xs">
                      <button
                        onClick={() => setStudentTimeframe('weekly')}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                          studentTimeframe === 'weekly' ? 'bg-[#2269ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        របាយការណ៍ប្រចាំសប្តាហ៍ (Weekly)
                      </button>
                      <button
                        onClick={() => setStudentTimeframe('monthly')}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                          studentTimeframe === 'monthly' ? 'bg-[#2269ff] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        របាយការណ៍ប្រចាំខែ (Monthly)
                      </button>
                    </div>

                    <span className="text-xs font-bold text-slate-500">
                      បង្ហាញទិន្នន័យ {studentTimeframe === 'weekly' ? 'ប្រចាំសប្តាហ៍' : 'ប្រចាំខែ'} សម្រាប់ {selectedStudent.student_name}
                    </span>
                  </div>

                  {/* Weekly or Monthly Breakdown Table */}
                  <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                            <th className="px-6 py-4">កំឡុងពេល ({studentTimeframe === 'weekly' ? 'សប្តាហ៍' : 'ខែ'})</th>
                            <th className="px-6 py-4">វត្តមាន (Present)</th>
                            <th className="px-6 py-4">មកយឺត (Late)</th>
                            <th className="px-6 py-4">អវត្តមាន (Absent)</th>
                            <th className="px-6 py-4">ច្បាប់ (Excused)</th>
                            <th className="px-6 py-4">ចំនួនថ្ងៃសរុប</th>
                            <th className="px-6 py-4 text-right">អត្រាវត្តមាន (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {(studentTimeframe === 'weekly' ? studentBreakdown.weekly : studentBreakdown.monthly).map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-[#0a1f44] flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[#2269ff]" />
                                <span>{row.period}</span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-emerald-600">{row.present} ថ្ងៃ</td>
                              <td className="px-6 py-4 font-semibold text-red-600">{row.absent} ថ្ងៃ</td>
                              <td className="px-6 py-4 font-semibold text-blue-600">{row.excused} ថ្ងៃ</td>
                              <td className="px-6 py-4 font-bold text-slate-700">{row.total} ថ្ងៃ</td>
                              <td className="px-6 py-4 text-right font-extrabold">
                                {rateCell(row.rate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* List of All Students with Quick Select */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0a1f44]">
                  បញ្ជីសិស្សទាំងអស់ ({filteredStudents.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">ចុចលើឈ្មោះសិស្សដើម្បីមើលរបាយការណ៍ប្រចាំសប្តាហ៍ និងប្រចាំខែ</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">ឈ្មោះសិស្ស</th>
                        <th className="px-6 py-4">អត្តលេខ (ID)</th>
                        <th className="px-6 py-4">មុខវិជ្ជា</th>
                        <th className="px-6 py-4">វត្តមាន</th>
                        <th className="px-6 py-4">អវត្តមាន</th>
                        <th className="px-6 py-4">អត្រាវត្តមាន</th>
                        <th className="px-6 py-4 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredStudents.map((st, i) => (
                        <tr
                          key={st.student_sid}
                          onClick={() => setSelectedStudent(st)}
                          className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                            selectedStudent?.student_sid === st.student_sid ? 'bg-blue-50/60 font-bold' : ''
                          }`}>
                          <td className="px-6 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#0a1f44] flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[#2269ff] text-xs font-extrabold">
                                {st.student_name[0]}
                              </div>
                              <span>{st.student_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-[#2269ff]">{st.student_sid}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">{st.class_name}</td>
                          <td className="px-6 py-4 text-emerald-600 font-semibold">{st.present}</td>
                          <td className="px-6 py-4 text-red-600 font-semibold">{st.absent}</td>
                          <td className="px-6 py-4 font-bold">{rateCell(st.rate)}</td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); setSelectedStudent(st); }}
                              className="rounded-lg text-xs font-bold text-[#2269ff] hover:bg-blue-100 gap-1">
                              <span>មើលរបាយការណ៍ (Week/Month)</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: Heatmap Calendar Grid ─── */}
        {viewTab === 4 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#0a1f44] mb-2">Heatmap វត្តមានសិស្សសរុប (Attendance Heatmap)</h3>
              <p className="text-xs text-slate-500 mb-6">កម្រិតព័ត៌មានអត្រាវត្តមានតាមកាលបរិច្ឆេទ</p>
              
              <div className="grid grid-cols-7 gap-2 sm:grid-cols-10 md:grid-cols-14">
                {dailyRows.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.rate}% (${d.present} វត្តមាន)`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 cursor-pointer transition-transform hover:scale-105"
                    style={{ backgroundColor: heatColor(d.rate) }}>
                    <span className="text-[10px] font-black text-white">{d.date.split('-').slice(1).join('/')}</span>
                    <span className="text-[11px] font-extrabold text-white">{d.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
