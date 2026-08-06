import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { NPITLogo } from '@/components/common/NPITLogo';
import { useNavigate } from 'react-router-dom';
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

// --- Softened Metric Font Weights ---
const stats = [
  {
    id: 1, label: "អត្រាវត្តមានសិស្សប្រចាំថ្ងៃ", sublabel: "Today's Attendance Rate", value: "87.0%", subtitle: "២៦១ នាក់ នៃសិស្ស ៣០០ នាក់",
    icon: UserCheck, badgeColor: "bg-blue-50 text-[#2269ff] border-blue-200", barColor: "bg-[#2269ff]", percent: 87,
    change: "+2.4% ប្រៀបធៀបម្សិលមិញ",
  },
  {
    id: 2, label: "ចំនួនសិស្សសរុប", sublabel: "Total Enrolled Students", value: "300", subtitle: "ឆ្នាំសិក្សា ២០២៥ - ២០២៦",
    icon: Users, badgeColor: "bg-blue-50 text-[#2269ff] border-blue-200", barColor: "bg-[#2269ff]", percent: 100,
    change: "+12 ចូលរៀនថ្មី",
  },
  {
    id: 3, label: "លោកគ្រូ-អ្នកគ្រូ", sublabel: "Active Faculty Staff", value: "25", subtitle: "២២ នាក់ កំពុងបង្រៀនថ្ងៃនេះ",
    icon: GraduationCap, badgeColor: "bg-amber-50 text-[#ca8a04] border-amber-200", barColor: "bg-[#eab308]", percent: 88,
    change: "បុគ្គលិកពេញលេញ",
  },
  {
    id: 4, label: "ពិន្ទុមធ្យមភាគ (GPA)", sublabel: "Institutional Average GPA", value: "3.45", subtitle: "គិតលើពិន្ទុអតិបរមា ៤.០០",
    icon: Award, badgeColor: "bg-red-50 text-[#ec171c] border-red-200", barColor: "bg-[#ec171c]", percent: 86,
    change: "+0.15 ឆមាសនេះ",
  },
];

// NPIT Chart Datasets
const attendanceData = {
  labels: ['ច័ន្ទ (Mon)', 'អង្គារ (Tue)', 'ពុធ (Wed)', 'ព្រហស្បតិ៍ (Thu)', 'សុក្រ (Fri)'],
  datasets: [
    {
      label: 'សិស្សវត្តមាន (Present)',
      data: [265, 250, 280, 260, 261],
      backgroundColor: '#2269ff',
      borderRadius: 6,
      barThickness: 28,
    },
    {
      label: 'សិស្សអវត្តមាន (Absent)',
      data: [35, 50, 20, 40, 39],
      backgroundColor: '#ec171c',
      borderRadius: 6,
      barThickness: 28,
    },
  ],
};

const departmentData = {
  labels: ['មេកានិច (Mechanical)', 'អគ្គិសនី (Electrical)', 'សំណង់ (Civil)', 'វិទ្យាសាស្ត្រកុំព្យូទ័រ (CS)', 'អេឡិចត្រូនិក'],
  datasets: [{
    data: [30, 25, 20, 15, 10],
    backgroundColor: ['#2269ff', '#ec171c', '#eab308', '#2563eb', '#991b1b'],
    borderWidth: 2,
    borderColor: '#ffffff',
  }],
};

const scoreProgressData = {
  labels: ['ឆមាសទី ១', 'ឆមាសទី ២', 'ប្រឡងពាក់កណ្តាល', 'ឆមាសទី ៣', 'ប្រឡងបញ្ចប់'],
  datasets: [
    {
      label: 'ពិន្ទុមធ្យមភាគ %',
      data: [72, 75, 78, 81, 85],
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
  const dateStr = now.toLocaleDateString('km-KH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── DEDICATED STUDENT DASHBOARD ──
  if (user?.role === 'student') {
    const studentStats = [
      { label: 'អត្រាវត្តមានរបស់ខ្ញុំ', sublabel: 'My Attendance Rate', value: '96%', subtitle: 'វត្តមាន ៤៨ ថ្ងៃ នៃ ៥០ ថ្ងៃ', icon: UserCheck, badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200', barColor: 'bg-emerald-500', percent: 96 },
      { label: 'ពិន្ទុមធ្យមភាគ (GPA)', sublabel: 'My Current GPA', value: '3.68', subtitle: 'និទ្ទេស A (ឆមាសទី ១)', icon: Award, badgeColor: 'bg-blue-50 text-[#2269ff] border-blue-200', barColor: 'bg-[#2269ff]', percent: 92 },
      { label: 'ថ្នាក់រៀនបច្ចុប្បន្ន', sublabel: 'Enrolled Class', value: '10A', subtitle: 'ដេប៉ាតឺម៉ង់ មេកានិច', icon: GraduationCap, badgeColor: 'bg-amber-50 text-amber-600 border-amber-200', barColor: 'bg-amber-500', percent: 100 },
      { label: 'ម៉ោងរៀនថ្ងៃនេះ', sublabel: "Today's Schedule", value: '3 មុខ', subtitle: 'ម៉ោង 08:00 - 15:30', icon: Clock, badgeColor: 'bg-red-50 text-[#ec171c] border-red-200', barColor: 'bg-[#ec171c]', percent: 75 },
    ];

    const todaySchedule = [
      { time: '08:00 - 09:30', subject: 'គណិតវិទ្យាបច្ចេកទេស', teacher: 'លោកគ្រូ សុខា', room: 'បន្ទប់ 302', status: 'កំពុងរៀន' },
      { time: '09:45 - 11:15', subject: 'មេកានិចគ្រឹះ', teacher: 'បណ្ឌិត វង្ស ចន្ទ្រា', room: 'បន្ទប់ 105', status: 'បន្ទាប់' },
      { time: '14:00 - 15:30', subject: 'ភាសាអង់គ្លេសបច្ចេកទេស', teacher: 'អ្នកគ្រូ លីដា', room: 'បន្ទប់ 201', status: 'បន្ទាប់' },
    ];

    const myScores = [
      { subject: 'គណិតវិទ្យា (Math Midterm)', score: 88, maxScore: 100, grade: 'A', date: '២៥ កក្កដា ២០២៦' },
      { subject: 'មេកានិច (Mechanics Quiz)', score: 95, maxScore: 100, grade: 'A+', date: '០១ សីហា ២០២៦' },
      { subject: 'អគ្គិសនី (Electrical Basic)', score: 82, maxScore: 100, grade: 'B+', date: '០៣ សីហា ២០២៦' },
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/qr-attendance')}
                className="flex items-center gap-2 rounded-xl bg-[#2269ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-all">
                <QrCode className="h-4.5 w-4.5" />
                <span>ស្កេន QR វត្តមានខ្ញុំ</span>
              </button>
              <button
                onClick={() => navigate('/scores')}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-2.5 text-sm font-semibold text-[#2269ff] hover:bg-blue-100 transition-all">
                <Award className="h-4.5 w-4.5" />
                <span>មើលពិន្ទុទាំងអស់</span>
              </button>
            </div>
          </div>

          {/* Student Personal Metric Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

          {/* Schedule & Scores Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Today Schedule */}
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#2269ff]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#0a1f44] tracking-tight">កាលវិភាគរៀនថ្ងៃនេះ (My Today Schedule)</h2>
                </div>
                <span className="rounded-full bg-blue-50 text-[#2269ff] border border-blue-200 px-3 py-1 text-xs font-bold">
                  ៣ មុខវិជ្ជា
                </span>
              </div>
              <div className="space-y-3">
                {todaySchedule.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-[#2269ff]">{item.time}</span>
                        <h4 className="text-sm font-bold text-[#0a1f44]">{item.subject}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{item.teacher} • <span className="font-bold text-slate-700">{item.room}</span></p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.status === 'កំពុងរៀន' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Recent Scores */}
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#ec171c]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#0a1f44] tracking-tight">ពិន្ទុទទួលបានថ្មីៗ (Recent Academic Scores)</h2>
                </div>
                <button onClick={() => navigate('/scores')} className="text-xs font-bold text-[#2269ff] hover:underline">
                  មើលបន្ថែម
                </button>
              </div>
              <div className="space-y-3">
                {myScores.map((score, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-red-50/30 transition-all">
                    <div>
                      <h4 className="text-sm font-bold text-[#0a1f44]">{score.subject}</h4>
                      <p className="text-xs text-slate-400 font-medium">{score.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#2269ff]">{score.score}/{score.maxScore}</span>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        {score.grade}
                      </span>
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
                ទំព័រដើមគ្រប់គ្រង និងតាមដានប្រព័ន្ធ · សូមស្វាគមន៍ <span className="font-bold text-[#2269ff]">{user?.first_name || user?.email}</span> · {dateStr}
              </p>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => navigate('/qr-attendance')}
              className="flex items-center gap-2 rounded-xl bg-[#2269ff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-all">
              <QrCode className="h-4.5 w-4.5" />
              <span>ស្កេន QR វត្តមាន</span>
            </button>

            <button
              onClick={() => navigate('/teaching-reports')}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-2.5 text-sm font-semibold text-[#2269ff] hover:bg-blue-100 transition-all">
              <FileText className="h-4.5 w-4.5" />
              <span>របាយការណ៍បង្រៀន</span>
            </button>
          </div>
        </div>

        {/* 4 Minimalist Metric Cards - Clean Bold Values */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
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
              <Bar data={attendanceData} options={chartOptions} />
            </div>
          </div>

          {/* Department Distribution Doughnut */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs">
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#2269ff] tracking-tight">ដេប៉ាតឺម៉ង់ និងជំនាញ (Departments)</h2>
              <p className="text-xs text-slate-500 font-medium">ការបែងចែកសិស្សតាមជំនាញនីមួយៗ</p>
            </div>
            <div className="h-72">
              <Doughnut data={departmentData} options={doughnutOptions} />
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
                <p className="text-xs text-slate-500 font-medium">ការកើនឡើងពិន្ទុមធ្យមភាគសិស្សតាមឆមាសនីមួយៗ</p>
              </div>
              <div className="flex items-center text-xs font-bold text-[#2269ff] bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 mr-1 text-[#2269ff]" /> +13% កើនឡើង
              </div>
            </div>
            <div className="h-64">
              <Line data={scoreProgressData} options={chartOptions} />
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
              {recentActivities.map((act) => (
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
