import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import {
  QrCode, Camera, CameraOff, CheckCircle2, XCircle, AlertTriangle,
  Clock, Users, UserCheck, UserX, Download, Printer, X,
  BarChart2, Filter, RefreshCw, Search, ChevronDown, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Types ────────────────────────────────────────────
interface AttendanceRecord {
  id: number;
  student_sid: string;
  student_name: string;
  class_name?: string;
  section?: string;
  date: string;
  time_in?: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  scan_method: string;
  scanned_by?: string;
}

interface ScanFeedback {
  type: 'success' | 'error' | 'warning';
  message: string;
  studentName?: string;
  studentId?: string;
  status?: string;
  time?: string;
}

interface StudentQR {
  id: number;
  student_id: string;
  name: string;
  class_name?: string;
  section?: string;
  qr_code?: string;
}

interface Analytics {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  rate: number;
  daily_trend: { date: string; count: number }[];
}

const statusStyles: Record<string, { badge: string; icon: React.ElementType }> = {
  present: { badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  late:    { badge: 'bg-amber-100 text-amber-700',     icon: Clock        },
  absent:  { badge: 'bg-red-100 text-red-700',         icon: XCircle      },
  excused: { badge: 'bg-blue-100 text-blue-700',       icon: AlertTriangle },
};

const TABS = ['Scanner', 'Attendance Log', 'Analytics', 'QR Cards'];

// ─── Main Component ───────────────────────────────────
export default function QRAttendance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [scanning,  setScanning]  = useState(false);
  const [feedback,  setFeedback]  = useState<ScanFeedback | null>(null);
  const [lateAfter, setLateAfter] = useState('08:30');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showQRCards, setShowQRCards] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = 'html5qr-code-full-region';
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Fetch attendance ──────────────────────────────
  const { data: records = [], refetch: refetchRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', dateFilter, classFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { date: dateFilter };
      if (classFilter)  params.class_name = classFilter;
      if (statusFilter) params.status     = statusFilter;
      const { data } = await axios.get('/attendance/', { params });
      return data;
    },
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['attendance-analytics'],
    queryFn: async () => {
      const { data } = await axios.get('/attendance/analytics');
      return data;
    },
  });

  const { data: qrStudents = [] } = useQuery<StudentQR[]>({
    queryKey: ['students-qr', classFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (classFilter) params.class_name = classFilter;
      const { data } = await axios.get('/attendance/students-qr', { params });
      return data;
    },
    enabled: activeTab === 3,
  });

  // ── Scan mutation ─────────────────────────────────
  const scanMutation = useMutation({
    mutationFn: (studentSid: string) =>
      axios.post('/attendance/scan', {
        student_sid: studentSid,
        class_name: classFilter || undefined,
        late_after: lateAfter,
      }),
    onSuccess: (res) => {
      const data = res.data;
      if (data.duplicate) {
        showFeedback({ type: 'warning', message: data.message });
      } else if (data.success) {
        showFeedback({
          type: 'success',
          message: data.message,
          studentName: data.record?.student_name,
          studentId: data.record?.student_sid,
          status: data.record?.status,
          time: data.record?.time_in,
        });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-analytics'] });
      } else {
        showFeedback({ type: 'error', message: data.message });
      }
    },
    onError: () => showFeedback({ type: 'error', message: 'Server error. Please try again.' }),
  });

  // ── Scanner lifecycle ─────────────────────────────
  const startScanner = useCallback(() => {
    setScanning(true);
    setFeedback(null);
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning) return;
    // Small delay to ensure div is mounted
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        scannerDivId,
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false,
      );
      scanner.render(
        (decodedText) => {
          // Prevent re-triggering while mutation in flight
          if (!scanMutation.isPending) {
            scanMutation.mutate(decodedText.trim());
          }
        },
        () => {}, // ignore scan errors (no QR in frame)
      );
      scannerRef.current = scanner;
    }, 100);
    return () => clearTimeout(timer);
  }, [scanning]);

  useEffect(() => () => stopScanner(), []);

  const showFeedback = (fb: ScanFeedback) => {
    setFeedback(fb);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 5000);
  };

  // ── Export CSV ────────────────────────────────────
  const exportCSV = async () => {
    const params = new URLSearchParams({ date: dateFilter });
    if (classFilter) params.append('class_name', classFilter);
    const res = await axios.get(`/attendance/export/csv?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${dateFilter}.csv`; a.click();
  };

  // ── Print QR Cards ────────────────────────────────
  const printQRCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Student QR Cards</title>
      <style>
        body { font-family: sans-serif; margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; }
        .card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; }
        .card img { width: 120px; height: 120px; }
        .name { font-weight: bold; font-size: 14px; margin: 6px 0 2px; }
        .sid { font-family: monospace; font-size: 11px; color: #6366f1; }
        .cls { font-size: 11px; color: #6b7280; margin-top: 2px; }
        @media print { .grid { gap: 8px; padding: 8px; } }
      </style></head><body>
      <div class="grid">
        ${qrStudents.map(s => `
          <div class="card">
            ${s.qr_code ? `<img src="${s.qr_code}" alt="QR">` : '<div style="width:120px;height:120px;background:#f3f4f6;border-radius:8px;margin:auto;"></div>'}
            <div class="name">${s.name}</div>
            <div class="sid">${s.student_id}</div>
            <div class="cls">${s.class_name || ''} ${s.section ? '· ' + s.section : ''}</div>
          </div>`).join('')}
      </div>
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  // ── Summary for today ─────────────────────────────
  const todayPresent = records.filter(r => r.status === 'present').length;
  const todayLate    = records.filter(r => r.status === 'late').length;
  const todayAbsent  = records.filter(r => r.status === 'absent').length;

  // ── Chart data ────────────────────────────────────
  const doughnutData = {
    labels: ['Present', 'Late', 'Absent', 'Excused'],
    datasets: [{
      data: [analytics?.present ?? 0, analytics?.late ?? 0, analytics?.absent ?? 0, analytics?.excused ?? 0],
      backgroundColor: ['rgba(16,185,129,.85)', 'rgba(245,158,11,.85)', 'rgba(239,68,68,.85)', 'rgba(59,130,246,.85)'],
      borderWidth: 0,
    }],
  };

  const trendData = {
    labels: analytics?.daily_trend.map(d => d.date.slice(5)) ?? [],
    datasets: [{
      label: 'Scans',
      data: analytics?.daily_trend.map(d => d.count) ?? [],
      backgroundColor: 'rgba(99,102,241,.8)',
      borderRadius: 8,
    }],
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">QR Attendance System</h1>
            <p className="text-sm text-slate-500">
              {new Date(dateFilter).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Today summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Scanned', value: records.length, icon: Users,      color: 'from-[#2269ff] to-violet-600' },
            { label: 'Present',       value: todayPresent,   icon: UserCheck,  color: 'from-emerald-500 to-teal-600'  },
            { label: 'Late',          value: todayLate,      icon: Clock,      color: 'from-amber-500 to-orange-600'  },
            { label: 'Absent',        value: todayAbsent,    icon: UserX,      color: 'from-red-500 to-rose-600'      },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold text-[#0a1f44] ">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === i
                  ? 'bg-white text-[#2269ff] shadow '
                  : 'text-slate-500 hover:text-[#122b59] :text-slate-300'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ─── TAB: Scanner ─── */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Scanner panel */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-[#122b59] flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[#2269ff]" /> Camera Scanner
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Late after</label>
                  <input type="time" value={lateAfter} onChange={e => setLateAfter(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:ring-2 focus:ring-[#2269ff] " />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
                  <option value="">All Classes</option>
                  {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {!scanning ? (
                  <Button onClick={startScanner} className="bg-[#2269ff] hover:bg-[#2269ff] text-white px-6">
                    <Camera className="mr-2 h-4 w-4" /> Start
                  </Button>
                ) : (
                  <Button onClick={stopScanner} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 px-6">
                    <CameraOff className="mr-2 h-4 w-4" /> Stop
                  </Button>
                )}
              </div>

              {/* Camera view */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0a1f44] min-h-[300px] flex items-center justify-center">
                {!scanning ? (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <QrCode className="h-16 w-16 opacity-30" />
                    <p className="text-sm">Click "Start" to open the camera</p>
                  </div>
                ) : (
                  <div id={scannerDivId} className="w-full" />
                )}

                {/* Scanning pulse overlay */}
                {scanning && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-semibold text-white">LIVE</span>
                  </div>
                )}
              </div>

              {/* Feedback toast */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
                      feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                      feedback.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                                                    'bg-red-50 border border-red-200'
                    }`}
                  >
                    {feedback.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
                    {feedback.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
                    {feedback.type === 'error'   && <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        feedback.type === 'success' ? 'text-emerald-800' :
                        feedback.type === 'warning' ? 'text-amber-800' : 'text-red-800'
                      }`}>{feedback.message}</p>
                      {feedback.studentId && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          ID: <span className="font-mono font-medium text-[#2269ff]">{feedback.studentId}</span>
                          {feedback.time && ` · ${feedback.time.slice(0,5)}`}
                          {feedback.status && (
                            <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[feedback.status]?.badge}`}>
                              {feedback.status}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live log panel */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-[#122b59] ">Today's Live Log</h2>
                <button onClick={() => refetchRecords()} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 :bg-[#1c3a73]">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                    <QrCode className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No scans yet for today</p>
                  </div>
                ) : records.map((r, idx) => {
                  const cfg = statusStyles[r.status];
                  const Icon = cfg?.icon ?? CheckCircle2;
                  return (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                      className="flex items-center gap-3 rounded-xl border border-slate-50 bg-slate-50/50 p-3 ">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg?.badge}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#122b59] truncate">{r.student_name}</p>
                        <p className="text-xs text-slate-400">
                          <span className="font-mono text-[#2269ff]">{r.student_sid}</span>
                          {r.class_name && ` · ${r.class_name}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cfg?.badge}`}>{r.status}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{r.time_in?.slice(0,5) || '—'}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Attendance Log ─── */}
        {activeTab === 1 && (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 ">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 ">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] " />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] ">
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="excused">Excused</option>
              </select>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2269ff] ">
                <option value="">All Classes</option>
                {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="mr-1.5 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 ">
                  <tr>
                    {['Student', 'ID', 'Class', 'Date', 'Time In', 'Status', 'Method'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 ">
                  {records.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No records for this filter.</td></tr>
                  ) : records.map((r, idx) => {
                    const cfg = statusStyles[r.status];
                    const Icon = cfg?.icon ?? CheckCircle2;
                    return (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50 :bg-[#1c3a73]/40">
                        <td className="px-5 py-3 font-medium text-[#0a1f44] ">{r.student_name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-[#2269ff]">{r.student_sid}</td>
                        <td className="px-5 py-3 text-slate-600 ">{r.class_name || '—'} {r.section}</td>
                        <td className="px-5 py-3 text-slate-600 ">{r.date}</td>
                        <td className="px-5 py-3 text-slate-600 ">{r.time_in?.slice(0,5) || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cfg?.badge}`}>
                            <Icon className="h-3 w-3" />{r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.scan_method === 'qr' ? 'bg-blue-100 text-[#2269ff]' : 'bg-slate-100 text-slate-600'}`}>
                            {r.scan_method}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB: Analytics ─── */}
        {activeTab === 2 && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                { label: 'Total Records', value: analytics?.total ?? 0, color: 'text-[#2269ff]' },
                { label: 'Present',       value: analytics?.present ?? 0, color: 'text-emerald-600' },
                { label: 'Late',          value: analytics?.late ?? 0, color: 'text-amber-600' },
                { label: 'Absent',        value: analytics?.absent ?? 0, color: 'text-red-600' },
                { label: 'Rate',          value: `${analytics?.rate ?? 0}%`, color: 'text-blue-600' },
              ].map(k => (
                <div key={k.label} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 text-center ">
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{k.label}</p>
                </div>
              ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Status Distribution</h3>
                <div className="h-56">
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' } } }} />
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
                <h3 className="mb-4 font-semibold text-[#122b59] ">Daily Scan Trend (Last 7 days)</h3>
                <div className="h-56">
                  <Bar data={trendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: QR Cards ─── */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
                <option value="">All Classes</option>
                {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <Button onClick={printQRCards} className="bg-[#2269ff] hover:bg-[#2269ff] text-white">
                <Printer className="mr-2 h-4 w-4" /> Print QR Cards
              </Button>
              <p className="text-sm text-slate-500">{qrStudents.length} students</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {qrStudents.map((s, idx) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}
                  className="flex flex-col items-center rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow ">
                  {s.qr_code
                    ? <img src={s.qr_code} alt="QR" className="h-28 w-28 rounded-lg" />
                    : <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-slate-100"><QrCode className="h-10 w-10 text-slate-400" /></div>
                  }
                  <p className="mt-3 text-sm font-semibold text-[#0a1f44] text-center leading-tight">{s.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-[#2269ff]">{s.student_id}</p>
                  {s.class_name && <p className="text-xs text-slate-400">{s.class_name} {s.section && `· ${s.section}`}</p>}
                </motion.div>
              ))}
              {qrStudents.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-3 py-16 text-slate-400">
                  <QrCode className="h-12 w-12 opacity-30" />
                  <p className="text-sm">No students found. Add students first!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
