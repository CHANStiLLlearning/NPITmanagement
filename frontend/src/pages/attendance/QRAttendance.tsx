import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
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
  Filter, RefreshCw, Search, Calendar, Volume2, VolumeX,
  Maximize2, Minimize2, Sparkles, Scan, ArrowRight, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { NPITLogo } from '@/components/common/NPITLogo';
import { useAuth } from '@/contexts/AuthContext';

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
  time_out?: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  scan_method: string;
  scanned_by?: string;
  photo_url?: string;
}

interface ScanFeedback {
  type: 'success' | 'error' | 'warning';
  message: string;
  studentName?: string;
  studentId?: string;
  status?: string;
  time?: string;
  timeOut?: string;
  className?: string;
  section?: string;
  photoUrl?: string;
}

interface StudentQR {
  id: number;
  student_id: string;
  name: string;
  email?: string;
  class_name?: string;
  section?: string;
  qr_code?: string;
  photo_url?: string;
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
  present: { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: CheckCircle2 },
  late:    { badge: 'bg-amber-100 text-amber-700 border border-amber-200',     icon: Clock        },
  absent:  { badge: 'bg-red-100 text-red-700 border border-red-200',         icon: XCircle      },
  excused: { badge: 'bg-blue-100 text-blue-700 border border-blue-200',       icon: AlertTriangle },
};

const TABS = ['Gate Kiosk & Scanner', 'Attendance Log', 'Analytics', 'Student ID Cards'];

// ─── Web Audio API Synth ──────────────────────────────
function playAudioFeedback(type: 'success' | 'late' | 'warning' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      // Dual high chime (C5 -> G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.1);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'late') {
      // E5 -> C5 warning double note
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(523.25, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'warning') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Low buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // Ignore audio errors if audio context blocked
  }
}

function speakGreeting(text: string) {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // speech unsupported
    }
  }
}

// ─── Main Component ───────────────────────────────────
export default function QRAttendance() {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [lateAfter, setLateAfter] = useState('08:30');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const handleUploadCardPhoto = async (studentId: number, file: File) => {
    try {
      setUploadingId(studentId);
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`/students/${studentId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['students-qr'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      if (refetchUser) refetchUser();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploadingId(null);
    }
  };

  // Audio / Speech / Kiosk toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [kioskMode, setKioskMode] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = 'html5qr-code-full-region';
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const manualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch attendance ──────────────────────────────
  const { data: records = [], refetch: refetchRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', dateFilter, classFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { date: dateFilter };
      if (classFilter) params.class_name = classFilter;
      if (statusFilter) params.status = statusFilter;
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

  const { data: rawQrStudents = [] } = useQuery<StudentQR[]>({
    queryKey: ['students-qr', classFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (classFilter) params.class_name = classFilter;
      const { data } = await axios.get('/attendance/students-qr', { params });
      return data;
    },
  });

  // Deduplicate by student_id
  const uniqueStudentsMap = new Map<string, StudentQR>();
  rawQrStudents.forEach((s) => {
    if (!uniqueStudentsMap.has(s.student_id)) {
      uniqueStudentsMap.set(s.student_id, s);
    }
  });
  const allUniqueStudents = Array.from(uniqueStudentsMap.values());

  // Role-based filtering: if logged in as student, show ONLY their own QR card!
  const isStudentRole = user?.role === 'student';
  const displayQrStudents = isStudentRole
    ? allUniqueStudents.filter(
        (s) =>
          (user?.email && s.email?.toLowerCase() === user.email.toLowerCase()) ||
          (user?.first_name && s.name.toLowerCase().includes(user.first_name.toLowerCase()))
      )
    : allUniqueStudents;

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
        if (soundEnabled) playAudioFeedback('warning');
        showFeedback({
          type: 'warning',
          message: data.message,
          studentName: data.record?.student_name,
          studentId: data.record?.student_sid,
          status: data.record?.status,
          time: data.record?.time_in,
          className: data.record?.class_name,
          photoUrl: data.record?.photo_url || data.photo_url,
        });
      } else if (data.success) {
        const isLate = data.record?.status === 'late';
        if (soundEnabled) playAudioFeedback(isLate ? 'late' : 'success');
        if (voiceEnabled && data.record?.student_name) {
          speakGreeting(`Welcome ${data.record.student_name}. Recorded as ${isLate ? 'late' : 'present'}.`);
        }
        showFeedback({
          type: 'success',
          message: data.message,
          studentName: data.record?.student_name,
          studentId: data.record?.student_sid,
          status: data.record?.status,
          time: data.record?.time_in,
          className: data.record?.class_name,
          section: data.record?.section,
          photoUrl: data.record?.photo_url || data.photo_url,
        });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-analytics'] });
      } else {
        if (soundEnabled) playAudioFeedback('error');
        showFeedback({ type: 'error', message: data.message });
      }
    },
    onError: () => {
      if (soundEnabled) playAudioFeedback('error');
      showFeedback({ type: 'error', message: 'Server error. Student not found or database offline.' });
    },
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
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        scannerDivId,
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false,
      );
      scanner.render(
        (decodedText) => {
          if (!scanMutation.isPending) {
            scanMutation.mutate(decodedText.trim());
          }
        },
        () => {},
      );
      scannerRef.current = scanner;
    }, 100);
    return () => clearTimeout(timer);
  }, [scanning]);

  useEffect(() => () => stopScanner(), []);

  const showFeedback = (fb: ScanFeedback) => {
    setFeedback(fb);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    scanMutation.mutate(manualInput.trim());
    setManualInput('');
  };

  const exportCSV = async () => {
    const params = new URLSearchParams({ date: dateFilter });
    if (classFilter) params.append('class_name', classFilter);
    const res = await axios.get(`/attendance/export/csv?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${dateFilter}.csv`; a.click();
  };

  // ── Print Official Student PVC ID Cards ──────────────────────
  const printQRCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>NPIT Official Student ID Cards</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; background: #f8fafc; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: auto; }
        .id-card {
          width: 380px; height: 240px; background: linear-gradient(135deg, #0a1f44 0%, #1e3a8a 100%);
          border-radius: 16px; color: white; padding: 16px; box-sizing: border-box;
          position: relative; overflow: hidden; border: 2px solid #2269ff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2); page-break-inside: avoid;
        }
        .header { display: flex; items-center; gap: 10px; border-bottom: 2px solid #ec171c; padding-bottom: 8px; margin-bottom: 12px; }
        .logo-text { font-size: 13px; font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px; }
        .sub-logo { font-size: 9px; font-weight: 700; color: #f87171; letter-spacing: 1px; }
        .body { display: flex; gap: 14px; align-items: center; }
        .photo-box { width: 90px; height: 110px; border-radius: 12px; border: 2px solid white; object-fit: cover; background: #1e293b; display: flex; items-center; justify-content: center; font-size: 28px; font-weight: bold; }
        .details { flex: 1; }
        .name { font-size: 16px; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 4px; }
        .sid { font-family: monospace; font-size: 12px; color: #93c5fd; font-weight: 700; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
        .class-info { font-size: 11px; color: #cbd5e1; font-weight: 600; }
        .qr-box { width: 85px; height: 85px; background: white; border-radius: 10px; padding: 4px; display: flex; items-center; justify-content: center; }
        .qr-box img { width: 100%; height: 100%; object-fit: contain; }
        .footer { position: absolute; bottom: 8px; left: 16px; right: 16px; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px; }
        @media print { body { background: white; padding: 0; } .grid { gap: 12px; } }
      </style></head><body>
      <div class="grid">
        ${displayQrStudents.map(s => `
          <div class="id-card">
            <div class="header">
              <div style="width:28px;height:28px;background:#ec171c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;">NP</div>
              <div>
                <div class="logo-text">វិទ្យាស្ថានជាតិ NPIT</div>
                <div class="sub-logo">TECHO SEN INSTITUTE · OFFICIAL STUDENT CARD</div>
              </div>
            </div>
            <div class="body">
              <div class="photo-box">
                ${s.photo_url ? `<img src="http://localhost:8000${s.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : s.name[0]}
              </div>
              <div class="details">
                <div class="name">${s.name}</div>
                <div class="sid">${s.student_id}</div>
                <div class="class-info">${s.class_name || 'General'} ${s.section ? '· Section ' + s.section : ''}</div>
              </div>
              <div class="qr-box">
                ${s.qr_code ? `<img src="${s.qr_code}" alt="QR">` : ''}
              </div>
            </div>
            <div class="footer">
              <span>Property of NPIT Techo Sen Institute</span>
              <span>Valid Academic Year 2025-2026</span>
            </div>
          </div>`).join('')}
      </div>
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const todayPresent = records.filter(r => r.status === 'present').length;
  const todayLate = records.filter(r => r.status === 'late').length;
  const todayAbsent = records.filter(r => r.status === 'absent').length;

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
      backgroundColor: 'rgba(34,105,255,.85)',
      borderRadius: 8,
    }],
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#2269ff]">ប្រព័ន្ធវត្តមានស្កេន QR (Turnstile Gate Kiosk)</h1>
              <span className="rounded-full bg-blue-100 text-[#2269ff] text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wide">
                Live Attendance Kiosk
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-world school entrance scanner with audio chimes, voice greetings, USB barcode support, and live photo verification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Audio Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(v => !v)}
              className={soundEnabled ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-slate-400'}
              title="Toggle sound chimes"
            >
              {soundEnabled ? <Volume2 className="mr-1.5 h-4 w-4" /> : <VolumeX className="mr-1.5 h-4 w-4" />}
              {soundEnabled ? 'Audio Chime ON' : 'Audio OFF'}
            </Button>

            {/* Voice Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceEnabled(v => !v)}
              className={voiceEnabled ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-slate-400'}
              title="Toggle Text-To-Speech greeting"
            >
              <Sparkles className="mr-1.5 h-4 w-4 text-emerald-600" />
              {voiceEnabled ? 'Voice Greeting ON' : 'Voice OFF'}
            </Button>

            {/* Fullscreen Kiosk Mode Button */}
            <Button
              size="sm"
              onClick={() => { setKioskMode(true); startScanner(); }}
              className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold shadow-md"
            >
              <Maximize2 className="mr-1.5 h-4 w-4" /> Fullscreen Kiosk Mode
            </Button>
          </div>
        </div>

        {/* Today summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Today Scans', value: records.length, icon: Users, color: 'from-[#2269ff] to-blue-800' },
            { label: 'Present On-Time', value: todayPresent, icon: UserCheck, color: 'from-emerald-500 to-teal-600' },
            { label: 'Late Arrival', value: todayLate, icon: Clock, color: 'from-amber-500 to-orange-600' },
            { label: 'Absent / Unscanned', value: todayAbsent, icon: UserX, color: 'from-red-500 to-rose-600' },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-2xs border border-blue-100">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-sm`}>
                <c.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">{c.label}</p>
                <p className="text-2xl font-black text-[#0a1f44]">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 rounded-2xl bg-blue-50/70 p-1.5 border border-blue-100">
          {(isStudentRole
            ? ['Gate Kiosk & Scanner', 'My Attendance Log', 'Analytics', 'MY STUDENT QR CODE']
            : ['Gate Kiosk & Scanner', 'Attendance Log', 'Analytics', 'Student ID Cards']
          ).map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === i
                  ? 'bg-[#2269ff] text-white shadow-md'
                  : 'text-[#1c3a73] hover:bg-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── TAB 0: Gate Kiosk & Scanner ─── */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Scanner & Manual Box (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-lg border border-blue-100">
                {/* Control bar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#2269ff]" />
                    <h2 className="font-black text-[#0a1f44] text-base">Entrance Turnstile Camera</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <label className="text-xs font-bold text-slate-600">Late After:</label>
                      <input
                        type="time"
                        value={lateAfter}
                        onChange={(e) => setLateAfter(e.target.value)}
                        className="text-xs font-bold text-[#2269ff] focus:outline-none bg-transparent"
                      />
                    </div>

                    {!scanning ? (
                      <Button onClick={startScanner} className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold px-5">
                        <Camera className="mr-1.5 h-4 w-4" /> Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopScanner} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 font-bold px-5">
                        <CameraOff className="mr-1.5 h-4 w-4" /> Stop Camera
                      </Button>
                    )}
                  </div>
                </div>

                {/* Camera Scanner Viewport */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a1f44] min-h-[340px] flex items-center justify-center border-4 border-slate-900 shadow-inner">
                  {!scanning ? (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                      <div className="h-20 w-20 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30 mb-3">
                        <Scan className="h-10 w-10 text-blue-400 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">Turnstile Gate Ready</h3>
                      <p className="text-xs text-blue-200/80 max-w-xs mb-4">
                        Mount tablet/webcam at school gate to auto-scan student QR ID cards
                      </p>
                      <Button onClick={startScanner} className="bg-[#ec171c] hover:bg-red-700 text-white font-bold px-6">
                        Activate Turnstile Camera
                      </Button>
                    </div>
                  ) : (
                    <div id={scannerDivId} className="w-full h-full" />
                  )}

                  {/* Scanning Live Overlay */}
                  {scanning && (
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                      <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 shadow-md">
                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">GATE SCANNER ACTIVE</span>
                      </div>
                      <span className="rounded-lg bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-mono font-bold text-blue-300 border border-white/10">
                        {currentTime.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* USB Barcode / Handheld Scanner Input Box */}
                <div className="mt-5 rounded-2xl bg-blue-50/60 p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-[#2269ff] flex items-center gap-1.5">
                      <QrCode className="h-4 w-4" /> USB Handheld Barcode Scanner / Manual ID
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Press ENTER to scan</span>
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      ref={manualInputRef}
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Scan USB barcode or type Student ID (e.g. STU-2025-0001)..."
                      className="flex-1 rounded-xl border border-blue-200 px-4 py-2.5 text-xs font-mono font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none bg-white shadow-2xs"
                    />
                    <Button type="submit" className="bg-[#2269ff] text-white font-bold px-5" size="sm">
                      <ArrowRight className="h-4 w-4" /> Scan
                    </Button>
                  </form>
                </div>

                {/* Quick Test Scan QR Codes Bar (For Webcam Testing) */}
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase text-[#0a1f44] flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-[#2269ff]" /> {isStudentRole ? 'MY STUDENT QR CODE' : 'Quick QR Test Cards (Hold to camera or click)'}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">1 Student = 1 Unique QR</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayQrStudents.slice(0, 6).map((st) => (
                      <div
                        key={st.id}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center text-center group hover:border-[#2269ff] transition-all"
                      >
                        {st.qr_code ? (
                          <a
                            href={st.qr_code}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Click to view full-size QR image (or show on phone to camera)"
                            className="block relative"
                          >
                            <img src={st.qr_code} alt="QR" className="w-16 h-16 object-contain rounded-md border p-1" />
                            <span className="absolute inset-0 bg-blue-900/60 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              View QR
                            </span>
                          </a>
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-xs font-bold text-slate-400">
                            No QR
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2 w-full justify-center">
                          <label
                            title="Click to upload profile photo"
                            className="relative w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer group shrink-0"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadCardPhoto(st.id, file);
                              }}
                            />
                            {st.photo_url ? (
                              <img src={`http://localhost:8000${st.photo_url}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-[#2269ff] flex items-center justify-center h-full">
                                {st.name[0]}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-blue-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="h-3.5 w-3.5" />
                            </div>
                          </label>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-[#0a1f44] truncate">{st.name}</p>
                            <p className="font-mono text-[9px] text-[#2269ff] font-bold">{st.student_id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => scanMutation.mutate(st.student_id)}
                          className="mt-1.5 text-[10px] font-bold text-[#2269ff] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md w-full transition-colors"
                        >
                          Simulate Scan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Scan Result & Live Feed (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Scan Feedback Popup Box */}
              <AnimatePresence mode="wait">
                {feedback ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`rounded-3xl p-6 shadow-xl border-2 ${
                      feedback.type === 'success' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300' :
                      feedback.type === 'warning' ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300' :
                                                    'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {feedback.type === 'success' && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                        {feedback.type === 'warning' && <AlertTriangle className="h-6 w-6 text-amber-600" />}
                        {feedback.type === 'error' && <XCircle className="h-6 w-6 text-rose-600" />}
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          feedback.type === 'success' ? 'text-emerald-700' :
                          feedback.type === 'warning' ? 'text-amber-700' : 'text-rose-700'
                        }`}>
                          {feedback.type === 'success' ? 'ATTENDANCE RECORDED' : feedback.type === 'warning' ? 'DUPLICATE SCAN' : 'SCAN ERROR'}
                        </span>
                      </div>
                      <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Student Card Info */}
                    {feedback.studentName ? (
                      <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-sm">
                        {feedback.photoUrl ? (
                          <img src={`http://localhost:8000${feedback.photoUrl}`} alt="" className="h-16 w-16 rounded-2xl object-cover border-2 border-blue-200 shrink-0 shadow-sm" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2269ff] to-blue-800 text-xl font-black text-white shrink-0 shadow-sm">
                            {feedback.studentName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-[#0a1f44] truncate">{feedback.studentName}</h3>
                          <p className="font-mono text-xs font-bold text-[#2269ff]">{feedback.studentId}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {feedback.className || 'General Student'} {feedback.section ? `· Sec ${feedback.section}` : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-700">{feedback.message}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-black/5">
                      <span>Time: {feedback.time?.slice(0, 8) || currentTime.toLocaleTimeString()}</span>
                      {feedback.status && (
                        <span className={`rounded-full px-3 py-0.5 uppercase tracking-wide ${statusStyles[feedback.status]?.badge}`}>
                          {feedback.status}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-blue-100 text-center py-8">
                    <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-2 animate-bounce" />
                    <h4 className="text-sm font-bold text-[#0a1f44]">Ready for Next Student</h4>
                    <p className="text-xs text-slate-400 mt-1">Scan student ID card QR or use handheld USB scanner</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Today's Live Feed List */}
              <div className="rounded-3xl bg-white p-6 shadow-lg border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#0a1f44] text-base">Today's Entry Stream</h3>
                  <Button variant="ghost" size="sm" onClick={() => refetchRecords()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {records.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                      No attendance scans recorded today.
                    </div>
                  ) : (
                    records.map((r) => {
                      const cfg = statusStyles[r.status];
                      const Icon = cfg?.icon ?? CheckCircle2;
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 rounded-2xl border border-blue-50 bg-slate-50/60 p-3 hover:bg-blue-50/50 transition-colors"
                        >
                          {r.photo_url ? (
                            <img src={`http://localhost:8000${r.photo_url}`} alt="" className="h-10 w-10 rounded-xl object-cover border border-blue-100 shrink-0" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2269ff] to-blue-800 text-xs font-black text-white shrink-0">
                              {r.student_name[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#0a1f44] truncate">{r.student_name}</p>
                            <p className="text-[10px] font-mono text-[#2269ff] font-semibold">
                              {r.student_sid} {r.class_name ? `· ${r.class_name}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${cfg?.badge}`}>
                              <Icon className="h-3 w-3" /> {r.status}
                            </span>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{r.time_in?.slice(0, 5) || '—'}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 1: Attendance Log ─── */}
        {activeTab === 1 && (
          <div className="rounded-3xl bg-white shadow-lg border border-blue-100 overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50/50 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#2269ff]" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#0a1f44] focus:outline-none bg-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#0a1f44] focus:outline-none bg-white"
              >
                <option value="">គ្រប់ស្ថានភាពទាំងអស់ (All Status)</option>
                <option value="present">Present (វត្តមាន)</option>
                <option value="late">Late (មកយឺត)</option>
                <option value="absent">Absent (អវត្តមាន)</option>
                <option value="excused">Excused (ច្បាប់)</option>
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-bold text-[#0a1f44] focus:outline-none bg-white"
              >
                <option value="">គ្រប់ថ្នាក់ទាំងអស់ (All Classes)</option>
                {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="mr-1.5 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-blue-50/80 text-[#2269ff] uppercase font-black tracking-wider border-b border-blue-100">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Student ID</th>
                  <th className="px-6 py-3.5">Class / Section</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Time In</th>
                  <th className="px-6 py-3.5">Time Out</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Scan Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-[#122b59]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No attendance records found for selected filters.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const cfg = statusStyles[r.status];
                    const Icon = cfg?.icon ?? CheckCircle2;
                    return (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 text-[#0a1f44] flex items-center gap-3">
                          {r.photo_url ? (
                            <img src={`http://localhost:8000${r.photo_url}`} alt="" className="h-8 w-8 rounded-full object-cover border border-blue-100" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2269ff] text-white text-xs font-black">
                              {r.student_name[0]}
                            </div>
                          )}
                          <span>{r.student_name}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[#2269ff]">{r.student_sid}</td>
                        <td className="px-6 py-4 text-slate-600">{r.class_name || '—'} {r.section ? `(${r.section})` : ''}</td>
                        <td className="px-6 py-4 text-slate-600">{r.date}</td>
                        <td className="px-6 py-4 font-mono text-emerald-700">{r.time_in?.slice(0, 5) || '—'}</td>
                        <td className="px-6 py-4 font-mono text-amber-700">{r.time_out?.slice(0, 5) || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${cfg?.badge}`}>
                            <Icon className="h-3 w-3" /> {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-blue-50 text-[#2269ff] border border-blue-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                            {r.scan_method}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 2: Analytics ─── */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                { label: 'Total Scans', value: analytics?.total ?? 0, color: 'text-[#2269ff]' },
                { label: 'Present', value: analytics?.present ?? 0, color: 'text-emerald-600' },
                { label: 'Late', value: analytics?.late ?? 0, color: 'text-amber-600' },
                { label: 'Absent', value: analytics?.absent ?? 0, color: 'text-red-600' },
                { label: 'Attendance Rate', value: `${analytics?.rate ?? 0}%`, color: 'text-blue-700' },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl bg-white p-4 shadow-2xs border border-blue-100 text-center">
                  <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-lg border border-blue-100">
                <h3 className="mb-4 font-black text-[#0a1f44] text-base">Status Breakdown</h3>
                <div className="h-60">
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%' }} />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-lg border border-blue-100">
                <h3 className="mb-4 font-black text-[#0a1f44] text-base">Scan Trend (Last 7 Days)</h3>
                <div className="h-60">
                  <Bar data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: Student ID Cards ─── */}
        {activeTab === 3 && (
          <div className="space-y-6">
            {isStudentRole ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-blue-50/80 p-4 border border-blue-200 shadow-2xs">
                <h3 className="font-black text-[#0a1f44] text-sm uppercase flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#2269ff]" /> MY STUDENT QR CODE (កាត QR របស់ខ្ញុំ)
                </h3>
                <span className="text-xs font-bold text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                  Official Student Identity Card
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-2xs border border-blue-100">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-[#0a1f44] focus:outline-none bg-white"
                >
                  <option value="">គ្រប់ថ្នាក់ទាំងអស់ (All Classes)</option>
                  {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>

                <Button onClick={printQRCards} className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold">
                  <Printer className="mr-1.5 h-4 w-4" /> Print Official Student PVC Cards
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
              {displayQrStudents.map((s) => (
                <div
                  key={s.id}
                  className="rounded-3xl bg-gradient-to-br from-[#0a1f44] via-[#122b59] to-blue-900 p-5 text-white shadow-xl border-2 border-blue-400 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 border-b border-red-500 pb-3 mb-3">
                    <NPITLogo size={32} />
                    <div>
                      <h4 className="text-xs font-black text-blue-300 uppercase leading-tight">វិទ្យាស្ថានជាតិ NPIT</h4>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">TECHO SEN INSTITUTE</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      title="Click to upload/change student profile photo"
                      className="w-20 h-24 rounded-xl bg-slate-800 border-2 border-white/40 overflow-hidden flex items-center justify-center shrink-0 relative group cursor-pointer"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCardPhoto(s.id, file);
                        }}
                      />
                      {s.photo_url ? (
                        <img src={`http://localhost:8000${s.photo_url}`} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-white">{s.name[0]}</span>
                      )}
                      <div className="absolute inset-0 bg-blue-950/85 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 text-center backdrop-blur-xs">
                        {uploadingId === s.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin text-blue-300" />
                        ) : (
                          <>
                            <Camera className="h-5 w-5 text-blue-300" />
                            <span className="text-[8px] font-black uppercase tracking-tight">Upload Photo</span>
                          </>
                        )}
                      </div>
                    </label>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-black text-white truncate">{s.name}</h5>
                      <span className="inline-block font-mono text-[10px] font-bold text-blue-300 bg-white/10 px-2 py-0.5 rounded-md my-1">
                        {s.student_id}
                      </span>
                      <p className="text-[11px] text-slate-300 font-semibold">{s.class_name || 'General'} {s.section ? `· Sec ${s.section}` : ''}</p>
                    </div>
                    {s.qr_code && (
                      <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                        <img src={s.qr_code} alt="QR" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── FULLSCREEN KIOSK OVERLAY MODE ─── */}
      <AnimatePresence>
        {kioskMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#061329] text-white flex flex-col justify-between p-8 overflow-hidden select-none"
          >
            {/* Kiosk Top Bar */}
            <div className="flex items-center justify-between border-b border-blue-900/80 pb-4">
              <div className="flex items-center gap-4">
                <NPITLogo size={52} />
                <div>
                  <h1 className="text-2xl font-black text-[#2269ff] leading-tight">វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន</h1>
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">
                    NPIT TECHO SEN INSTITUTE — ENTRY TURNSTILE GATE KIOSK
                  </p>
                </div>
              </div>

              {/* Digital Clock */}
              <div className="text-right flex items-center gap-6">
                <div>
                  <p className="text-3xl font-mono font-black text-white tracking-widest">{currentTime.toLocaleTimeString()}</p>
                  <p className="text-xs font-bold text-blue-300">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <Button
                  onClick={() => { setKioskMode(false); stopScanner(); }}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-950 font-bold"
                >
                  <Minimize2 className="mr-1.5 h-4 w-4" /> Exit Kiosk
                </Button>
              </div>
            </div>

            {/* Kiosk Main Content */}
            <div className="grid grid-cols-12 gap-8 items-center flex-1 py-6">
              {/* Camera Scanner View Box (7 cols) */}
              <div className="col-span-7 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl rounded-3xl border-4 border-[#2269ff] bg-[#0a1f44] overflow-hidden shadow-2xl relative">
                  <div id={scannerDivId} className="w-full h-full min-h-[380px]" />
                </div>
                <p className="text-sm font-bold text-blue-300 mt-4 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-blue-400 animate-spin" />
                  Hold Student ID QR Card steadily in front of the camera lens
                </p>
              </div>

              {/* Scan Result Verification Card (5 cols) */}
              <div className="col-span-5 flex flex-col justify-center">
                {feedback ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`rounded-3xl p-8 border-4 shadow-2xl ${
                      feedback.type === 'success' ? 'bg-gradient-to-br from-emerald-950 to-teal-900 border-emerald-500 text-emerald-100' :
                      feedback.type === 'warning' ? 'bg-gradient-to-br from-amber-950 to-orange-900 border-amber-500 text-amber-100' :
                                                    'bg-gradient-to-br from-rose-950 to-red-900 border-rose-500 text-rose-100'
                    }`}
                  >
                    <div className="text-center mb-6">
                      {feedback.type === 'success' && (
                        <span className="inline-block rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-black text-emerald-300 border border-emerald-500/40 uppercase tracking-widest mb-2">
                          ✓ ENTRY GRANTED (វត្តមាន)
                        </span>
                      )}
                      {feedback.type === 'warning' && (
                        <span className="inline-block rounded-full bg-amber-500/20 px-4 py-1 text-sm font-black text-amber-300 border border-amber-500/40 uppercase tracking-widest mb-2">
                          ⚠ ALREADY SCANNED TODAY
                        </span>
                      )}
                      <h2 className="text-3xl font-black text-white leading-tight mt-2">{feedback.studentName || feedback.message}</h2>
                    </div>

                    {feedback.studentId && (
                      <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex items-center gap-5">
                        {feedback.photoUrl ? (
                          <img src={`http://localhost:8000${feedback.photoUrl}`} alt="" className="h-24 w-24 rounded-2xl object-cover border-2 border-white shrink-0 shadow-lg" />
                        ) : (
                          <div className="h-24 w-24 rounded-2xl bg-[#2269ff] text-white text-3xl font-black flex items-center justify-center shrink-0">
                            {feedback.studentName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-mono text-lg font-bold text-blue-300">{feedback.studentId}</p>
                          <p className="text-sm font-semibold text-slate-300">{feedback.className || 'Student'}</p>
                          <p className="text-xs font-mono text-emerald-400 mt-2 font-bold">
                            SCANNED AT: {feedback.time?.slice(0, 8) || currentTime.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="rounded-3xl bg-blue-950/40 border-2 border-blue-500/30 p-12 text-center">
                    <QrCode className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-black text-white">SCAN STUDENT ID CARD</h3>
                    <p className="text-xs text-blue-300 mt-2">NPIT Gate Turnstile System is active and listening</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kiosk Footer */}
            <div className="flex items-center justify-between border-t border-blue-900/80 pt-4 text-xs font-bold text-blue-400">
              <span>NPIT Real-World Gate Kiosk System v2.0</span>
              <span>Audio Chime: {soundEnabled ? 'ACTIVE' : 'OFF'} · Voice: {voiceEnabled ? 'ACTIVE' : 'OFF'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
