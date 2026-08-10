import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import {
  TrendingUp, Award, AlertTriangle, Users, BookOpen, Star,
  CheckCircle2, ArrowUpRight, ArrowDownRight, RefreshCw, Filter,
  GraduationCap, UserCheck, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

interface AnalyticsOverview {
  attendance_rate: number;
  avg_gpa: number;
  attendance_trend: { date: string; rate: number }[];
  subject_performance: { subject: string; average: number }[];
  teacher_performance: { name: string; department: string; rating: number; reports_submitted: number }[];
  top_students: { sid: string; name: string; class_name: string; score: number; grade: string; gpa: number }[];
  low_students: { sid: string; name: string; class_name: string; score: number; grade: string; gpa: number; issue: string }[];
  grade_distribution: Record<string, number>;
}

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'];

export default function Analytics() {
  const [selClass, setSelClass] = useState('');
  const [selTerm, setSelTerm]   = useState('Term 1');

  const { data: dbSubjects = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['subjects'],
    queryFn: async () => (await axios.get('/academic/subjects')).data,
  });

  const subjectOptions = dbSubjects.map(s => s.name);

  const { data, isLoading, refetch } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics-overview', selClass, selTerm],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selClass) params.class_name = selClass;
      if (selTerm)  params.term       = selTerm;
      const { data } = await axios.get('/analytics/overview', { params });
      return data;
    },
  });

  // Chart Configurations
  const trendChartData = {
    labels: data?.attendance_trend.map(t => t.date) || [],
    datasets: [
      {
        label: 'Attendance Rate %',
        data: data?.attendance_trend.map(t => t.rate) || [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4,
      },
    ],
  };

  const subjectChartData = {
    labels: data?.subject_performance.map(s => s.subject) || [],
    datasets: [
      {
        label: 'Average Score %',
        data: data?.subject_performance.map(s => s.average) || [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(14, 165, 233, 0.8)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(data?.grade_distribution || {}),
    datasets: [
      {
        data: Object.values(data?.grade_distribution || {}),
        backgroundColor: [
          '#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' } },
    },
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">School Analytics Dashboard</h1>
            <p className="text-sm text-slate-500">Comprehensive insights on attendance, academic performance, and teacher ratings</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh Analytics
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-slate-500">Filter by មុខវិជ្ជា (Subject)</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
              <option value="">All Subjects</option>
              {subjectOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-slate-500">Filter by Term</label>
            <select value={selTerm} onChange={e => setSelTerm(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff] ">
              {TERMS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Attendance Rate', value: `${data?.attendance_rate || 0}%`, icon: UserCheck, color: 'from-[#2269ff] to-violet-600', trend: '+1.2% this week', isGood: true },
            { label: 'School Average GPA', value: `${data?.avg_gpa || 0}`, icon: GraduationCap, color: 'from-emerald-500 to-teal-600', trend: '+0.15 vs last term', isGood: true },
            { label: 'Top Subject Avg', value: `${Math.max(...(data?.subject_performance.map(s => s.average) || [88]))}%`, icon: BookOpen, color: 'from-amber-500 to-orange-600', trend: 'Mathematics', isGood: true },
            { label: 'At-Risk Students', value: `${data?.low_students.length || 0}`, icon: ShieldAlert, color: 'from-rose-500 to-red-600', trend: 'Requires attention', isGood: false },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-md`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-[#0a1f44] ">{card.value}</p>
                <p className={`text-[11px] font-medium flex items-center gap-0.5 ${card.isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {card.isGood ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.trend}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Attendance Trend */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
            <h3 className="mb-4 font-semibold text-[#122b59] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#2269ff]" /> Attendance Trend (7-Day)
            </h3>
            <div className="h-64">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>

          {/* Subject Performance */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
            <h3 className="mb-4 font-semibold text-[#122b59] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" /> Subject Average Scores
            </h3>
            <div className="h-64">
              <Bar data={subjectChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 & Teacher Performance */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Grade Distribution */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
            <h3 className="mb-4 font-semibold text-[#122b59] ">Grade Distribution</h3>
            <div className="h-56">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

          {/* Teacher Performance Rankings */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
            <h3 className="mb-4 font-semibold text-[#122b59] flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Teacher Performance &amp; Activity
            </h3>
            <div className="space-y-3">
              {data?.teacher_performance.map((t, idx) => (
                <div key={t.name} className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 ">
                  <span className="font-bold text-slate-400 text-sm">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#122b59] text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.department} · {t.reports_submitted} teaching logs submitted</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-700 text-xs">{t.rating} / 5.0</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Performance Lists */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Performing Students */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
            <h3 className="mb-4 font-semibold text-[#122b59] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#2269ff]" /> Top Performing Students (Leaderboard)
            </h3>
            <div className="space-y-2.5">
              {data?.top_students.map((st, idx) => (
                <div key={st.sid} className="flex items-center gap-3 rounded-xl border border-slate-50 bg-slate-50/60 p-3 ">
                  <span className="text-xl">{['🥇','🥈','🥉','⭐','⭐'][idx]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0a1f44] text-sm">{st.name}</p>
                    <p className="text-xs text-slate-400">{st.class_name} · {st.sid}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#2269ff] text-sm block">{st.score}%</span>
                    <span className="text-xs text-emerald-600 font-semibold">{st.grade} (GPA {st.gpa})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Performing / At-Risk Students */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
            <h3 className="mb-4 font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Low Performing / At-Risk Students
            </h3>
            <div className="space-y-2.5">
              {data?.low_students.map((st) => (
                <div key={st.sid} className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 ">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold text-xs">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0a1f44] text-sm">{st.name}</p>
                    <p className="text-xs text-rose-600 font-medium">{st.issue}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 text-sm block">{st.score}%</span>
                    <span className="text-xs text-slate-500 font-semibold">{st.grade} (GPA {st.gpa})</span>
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
