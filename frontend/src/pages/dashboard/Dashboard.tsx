import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { NPITLogo } from '@/components/common/NPITLogo';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, GraduationCap, Award,
  TrendingUp, ArrowUpRight, Clock, Activity, Calendar,
  QrCode, FileText, ChevronRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);




interface SystemLogOut {
  id: number;
  user_email: string;
  user_name?: string;
  action: string;
  module: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

const getModuleBadge = (moduleStr: string, actionStr: string) => {
  const m = (moduleStr || '').toLowerCase();
  const a = (actionStr || '').toLowerCase();
  if (a.includes('login') || m.includes('auth') || m.includes('user')) {
    return { tag: 'គណនី & ប្រព័ន្ធ', tagColor: 'bg-blue-50 text-[#2269ff] border-blue-200' };
  } else if (m.includes('attendance') || m.includes('qr') || m.includes('វត្តមាន')) {
    return { tag: 'វត្តមានសិស្ស', tagColor: 'bg-red-50 text-[#ec171c] border-red-200' };
  } else if (m.includes('report') || m.includes('teaching') || m.includes('របាយការណ៍')) {
    return { tag: 'របាយការណ៍', tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  } else if (m.includes('score') || m.includes('grade') || m.includes('ពិន្ទុ')) {
    return { tag: 'ពិន្ទុ & និទ្ទេស', tagColor: 'bg-amber-50 text-[#ca8a04] border-amber-200' };
  } else {
    return { tag: moduleStr || 'ប្រព័ន្ធ', tagColor: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
};

const formatTimeAgo = (timestampStr: string) => {
  if (!timestampStr) return '';
  const dateObj = new Date(timestampStr);
  const diffMs = Date.now() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'ទើបតែឥឡូវ';
  if (diffMins < 60) return `${diffMins} នាទីមុន`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ម៉ោងមុន`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ថ្ងៃមុន`;
};

const recentActivities = [
  { id: 1, text: 'បានស្រង់វត្តមានសិស្ស ថ្នាក់មេកានិច 10A', time: '10 នាទីមុន', user: 'លោកគ្រូ សំនៀង', tag: 'វត្តមានសិស្ស', tagColor: 'bg-blue-50 text-[#2269ff] border-blue-200' },
  { id: 2, text: 'បានដាក់របាយការណ៍បង្រៀន មុខវិជ្ជាសៀគ្វីអគ្គិសនី', time: '35 នាទីមុន', user: 'បណ្ឌិត វង្ស ចន្ទ្រា', tag: 'របាយការណ៍', tagColor: 'bg-red-50 text-[#ec171c] border-red-200' },
  { id: 3, text: 'បានបញ្ចូលពិន្ទុប្រឡងពាក់កណ្តាលឆមាស មុខវិជ្ជាគណិតវិទ្យា', time: '1 ម៉ោងមុន', user: 'សាស្ត្រាចារ្យ សុខា', tag: 'ពិន្ទុ & និទ្ទេស', tagColor: 'bg-amber-50 text-[#ca8a04] border-amber-200' },
  { id: 4, text: 'បានធ្វើបច្ចុប្បន្នភាពកាលវិភាគសិក្សា ឆមាសទី ២', time: '3 ម៉ោងមុន', user: 'Super Admin', tag: 'កាលវិភាគ', tagColor: 'bg-blue-50 text-[#2269ff] border-blue-200' },
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, labels: { boxWidth: 14, font: { size: 12, weight: "bold" as const } } } },
  scales: { x: { grid: { display: false }, ticks: { font: { size: 12, weight: "bold" as const } } }, y: { grid: { color: '#f8fafc' }, ticks: { font: { size: 12, weight: "bold" as const } } } },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right' as const, labels: { boxWidth: 12, font: { size: 12, weight: "bold" as const } } } },
  cutout: '68%',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  
  const formattedUser = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User';
  const roleTitle = user?.role === 'super_admin' ? 'Super Admin' : user?.role ? user.role.toUpperCase() : '';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data: rawSystemLogs = [] } = useQuery<SystemLogOut[]>({
    queryKey: ['system-logs-recent'],
    queryFn: async () => {
      const { data } = await axios.get('/system-logs/', { params: { limit: 5 } });
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 10000,
  });

  const { data: summary } = useQuery({
    queryKey: ['school-summary-dashboard'],
    queryFn: async () => (await axios.get('/reports-center/summary')).data,
    refetchInterval: 10000,
  });

  const dynamicStats = [
    {
      id: 1,
      label: "អត្រាវត្តមានសិស្សប្រចាំថ្ងៃ",
      sublabel: "Today's Attendance Rate",
      value: summary ? `${summary.attendance_rate}%` : "0%",
      subtitle: summary ? `សរុបស្កេន ${summary.total_attendance_scans} លើក` : "ស្កេនក្នុងប្រព័ន្ធ",
      icon: UserCheck,
      badgeColor: "bg-blue-50 text-[#2269ff] border-blue-200",
      barColor: "bg-[#2269ff]",
      percent: summary ? Math.round(summary.attendance_rate) : 0,
      change: "ទិន្នន័យជាក់ស្តែង (Real DB)",
    },
    {
      id: 2,
      label: "ចំនួនសិស្សសរុប",
      sublabel: "Total Enrolled Students",
      value: summary ? `${summary.total_students}` : "0",
      subtitle: "ឆ្នាំសិក្សា ២០២៥ - ២០២៦",
      icon: Users,
      badgeColor: "bg-blue-50 text-[#2269ff] border-blue-200",
      barColor: "bg-[#2269ff]",
      percent: 100,
      change: "សិស្សសកម្មក្នុង DB",
    },
    {
      id: 3,
      label: "លោកគ្រូ-អ្នកគ្រូ",
      sublabel: "Active Faculty Staff",
      value: summary ? `${summary.total_teachers}` : "0",
      subtitle: "បុគ្គលិកបង្រៀនសកម្ម",
      icon: GraduationCap,
      badgeColor: "bg-amber-50 text-[#ca8a04] border-amber-200",
      barColor: "bg-[#eab308]",
      percent: 100,
      change: "លោកគ្រូ-អ្នកគ្រូ សកម្ម",
    },
    {
      id: 4,
      label: "របាយការណ៍បង្រៀន",
      sublabel: "Teaching Reports",
      value: summary ? `${summary.teaching_reports_count}` : "0",
      subtitle: summary ? `បានអនុម័ត ${summary.approved_teaching_reports} របាយការណ៍` : "របាយការណ៍សរុប",
      icon: FileText,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      barColor: "bg-emerald-500",
      percent: summary && summary.teaching_reports_count > 0 ? Math.round((summary.approved_teaching_reports / summary.teaching_reports_count) * 100) : 0,
      change: "របាយការណ៍បង្រៀន DB",
    },
  ];

  // Dynamic Weekly Attendance Chart Data from DB
  const dynamicAttendanceData = {
    labels: summary?.weekly_attendance && summary.weekly_attendance.length > 0
      ? summary.weekly_attendance.map((w: any) => w.day)
      : ['ច័ន្ទ (Mon)', 'អង្គារ (Tue)', 'ពុធ (Wed)', 'ព្រហស្បតិ៍ (Thu)', 'សុក្រ (Fri)'],
    datasets: [
      {
        label: 'សិស្សវត្តមាន (Present)',
        data: summary?.weekly_attendance && summary.weekly_attendance.length > 0
          ? summary.weekly_attendance.map((w: any) => w.present)
          : [0, 0, 0, 0, 0],
        backgroundColor: '#2269ff',
        borderRadius: 6,
        barThickness: 28,
      },
      {
        label: 'សិស្សអវត្តមាន (Absent)',
        data: summary?.weekly_attendance && summary.weekly_attendance.length > 0
          ? summary.weekly_attendance.map((w: any) => w.absent)
          : [0, 0, 0, 0, 0],
        backgroundColor: '#ec171c',
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  };

  const classDistKeys = summary?.class_distribution ? Object.keys(summary.class_distribution) : [];
  const classDistValues = summary?.class_distribution ? Object.values(summary.class_distribution) : [];
  const dynamicDepartmentData = {
    labels: classDistKeys.length > 0 ? classDistKeys : ['មេកានិច', 'អគ្គិសនី', 'កុំព្យូទ័រ'],
    datasets: [{
      data: classDistValues.length > 0 ? classDistValues : [1, 1, 1],
      backgroundColor: ['#2269ff', '#ec171c', '#eab308', '#2563eb', '#991b1b', '#10b981', '#8b5cf6'],
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  // Dynamic Academic Score Trend - Real data from DB report cards
  const scoreTrendItems = summary?.score_trend && summary.score_trend.length > 0
    ? summary.score_trend
    : null;

  const scoreProgressData = {
    labels: scoreTrendItems
      ? scoreTrendItems.map((t: any) => t.term)
      : ['ឆមាសទី ១', 'ឆមាសទី ២', 'ឆមាសទី ៣'],
    datasets: [
      {
        label: 'ពិន្ទុមធ្យមភាគ %',
        data: scoreTrendItems
          ? scoreTrendItems.map((t: any) => t.avg_score)
          : [0, 0, 0],
        borderColor: '#2269ff',
        backgroundColor: 'rgba(30, 64, 175, 0.05)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#eab308',
        pointBorderColor: '#2269ff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };


  const displayLogs = rawSystemLogs.length > 0
    ? rawSystemLogs.map((l) => {
        const { tag, tagColor } = getModuleBadge(l.module, l.action);
        const timeAgo = formatTimeAgo(l.timestamp);
        return {
          id: l.id,
          text: l.details || `${l.action.toUpperCase()} · ${l.module}`,
          user: l.user_name || l.user_email.split('@')[0],
          time: timeAgo,
          tag,
          tagColor,
        };
      })
    : recentActivities;

  // ── DEDICATED STUDENT DASHBOARD ──
  if (user?.role === 'student') {
    const attRate = summary?.attendance_rate ?? 100;
    const totalScans = summary?.total_attendance_scans ?? 0;

    const studentStats = [
      {
        label: 'អត្រាវត្តមានរបស់ខ្ញុំ',
        sublabel: 'My Attendance Rate',
        value: `${attRate}%`,
        subtitle: `សរុបស្កេន ${totalScans} លើកក្នុងប្រព័ន្ធ`,
        icon: UserCheck,
        badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        barColor: 'bg-emerald-500',
        percent: attRate,
      },
    ];

    return (
      <Layout>
        <div className="space-y-8 bg-white pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100/80 pb-6">
            <div className="flex items-center gap-4">
              <NPITLogo size={60} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#2269ff] tracking-tight">
                    ទំព័រដើមសិស្ស (Student Dashboard)
                  </h1>
                  <span className="rounded-full bg-blue-50 text-[#2269ff] border border-blue-200 px-3 py-0.5 text-xs font-bold uppercase">
                    សិស្ស (Student)
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  សូមស្វាគមន៍មកកាន់ប្រព័ន្ធសិក្សា · <span className="font-bold text-[#2269ff]">{user?.first_name} {user?.last_name}</span> ({user?.email}) · {dateStr}
                </p>
              </div>
            </div>
          </div>

          {/* Student Personal Metric Card */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studentStats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-blue-100/90 bg-white p-6 shadow-2xs hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#2269ff]">{s.label}</span>
                    <p className="text-xs text-slate-400 font-semibold">{s.sublabel}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${s.badgeColor}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-4xl font-extrabold text-[#0a1f44] tracking-tight">{s.value}</div>
                  <p className="mt-1 text-sm text-slate-500 font-medium">{s.subtitle}</p>
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${s.barColor}`} style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // ── ADMIN / TEACHER INSTITUTIONAL DASHBOARD ──
  return (
    <Layout>
      <div className="space-y-8 bg-white pb-12">

        {/* Softened Header Typography */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-100/80 pb-6">
          <div className="flex items-center gap-4">
            <NPITLogo size={60} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2269ff] tracking-tight">
                  វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន
                </h1>
                <span className="rounded-full bg-red-50 text-[#ec171c] border border-red-200 px-3 py-0.5 text-xs font-bold uppercase">
                  NPIT
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 font-normal">
                ទំព័រដើមគ្រប់គ្រង និងតាមដានប្រព័ន្ធ · សូមស្វាគមន៍ <span className="font-bold text-[#2269ff]">{formattedUser}</span> {roleTitle && <span className="rounded-md bg-blue-100 text-[#2269ff] px-2 py-0.5 text-xs font-black ml-1">{roleTitle}</span>} · {dateStr}
              </p>
            </div>
          </div>


        </div>

        {/* 4 Minimalist Metric Cards - Clean Bold Values */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dynamicStats.map((s) => (
            <div key={s.id} className="rounded-2xl border border-blue-100/90 bg-white p-6 shadow-2xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#2269ff]">{s.label}</span>
                  <p className="text-xs text-slate-400 font-semibold">{s.sublabel}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${s.badgeColor}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-4xl font-extrabold text-[#0a1f44] tracking-tight">{s.value}</div>
                <p className="mt-1 text-sm text-slate-500 font-medium">{s.subtitle}</p>

                {/* Progress Indicator */}
                <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${s.barColor}`} style={{ width: `${s.percent}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#2269ff]">
                  <span>{s.change}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Spacious Main Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Weekly Attendance Bar Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#2269ff] tracking-tight">សរុបវត្តមានសិស្សប្រចាំសប្តាហ៍ (Weekly Attendance)</h2>
                <p className="text-xs text-slate-500 font-medium">សិស្សវត្តមាន (បៃតង/ខៀវ) និងសិស្សអវត្តមាន (ក្រហម)</p>
              </div>
              <span className="rounded-full bg-blue-50 text-[#2269ff] border border-blue-200 px-3.5 py-1 text-xs font-bold">
                សប្តាហ៍នេះ
              </span>
            </div>
            <div className="h-72">
              <Bar data={dynamicAttendanceData} options={chartOptions} />
            </div>
          </div>

          {/* Department Distribution Doughnut */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#2269ff] tracking-tight">ដេប៉ាតឺម៉ង់ និងជំនាញ (Departments)</h2>
              <p className="text-xs text-slate-500 font-medium">ការបែងចែកសិស្សតាមជំនាញនីមួយៗ</p>
            </div>
            <div className="h-72">
              <Doughnut data={dynamicDepartmentData} options={doughnutOptions} />
            </div>
          </div>

        </div>

        {/* Bottom Section: Score Progress & Activity Feed */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Score & Performance Progress Line Chart */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#2269ff] tracking-tight">និទ្ទេស និងលទ្ធផលសិក្សា (Academic Trend)</h2>
                <p className="text-xs text-slate-500 font-medium">ពិន្ទុមធ្យមភាគសិស្សសរុបតាមឆមាស · GPA មធ្យម: <span className="font-bold text-[#0a1f44]">{summary?.average_gpa ?? 0}</span></p>
              </div>
              <div className="flex items-center text-xs font-bold text-[#2269ff] bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 mr-1 text-[#2269ff]" />
                {scoreTrendItems && scoreTrendItems.length > 1
                  ? `${scoreTrendItems[scoreTrendItems.length - 1].avg_score}% ឆមាសចុងក្រោយ`
                  : 'ទិន្នន័យជាក់ស្តែង DB'}
              </div>
            </div>
            <div className="h-64">
              {scoreTrendItems ? (
                <Line data={scoreProgressData} options={chartOptions} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                  <TrendingUp className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-medium">ពុំទាន់មានទិន្នន័យពិន្ទុ (No Report Cards Yet)</p>
                  <p className="text-xs">បញ្ចូលពិន្ទុសិស្សសិន ។</p>
                </div>
              )}
            </div>
          </div>

          {/* System Log Activity Feed */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#2269ff]" />
                <h2 className="text-base sm:text-lg font-bold text-[#0a1f44] tracking-tight">កំណត់ហេតុប្រព័ន្ធថ្មីៗ (System Logs)</h2>
              </div>
              <button onClick={() => navigate('/system-logs')} className="flex items-center gap-1 text-xs font-bold text-[#2269ff] hover:underline">
                <span>មើលទាំងអស់</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {displayLogs.map((act) => (
                <div key={act.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase ${act.tagColor}`}>
                      {act.tag}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#122b59]">{act.text}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="hidden sm:inline">{act.user}</span>
                    <span className="flex items-center text-xs"><Clock className="h-3.5 w-3.5 mr-1" />{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
