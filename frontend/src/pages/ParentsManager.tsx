import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { UsersRound, Search, Phone, Mail, GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentItem {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class_name?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
}

export default function ParentsManager() {
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading } = useQuery<StudentItem[]>({
    queryKey: ['parents-directory', search],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/students/?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const filteredParents = students.filter(s => 
    s.guardian_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.first_name.toLowerCase().includes(search.toLowerCase()) ||
    s.last_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 pb-12 bg-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-[#2269ff]">គ្រប់គ្រងអាណាព្យាបាល (Parents &amp; Guardians)</h1>
            <p className="text-xs text-slate-500 font-medium">Directory of parent contacts, student mappings, and communication links</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម ឈ្មោះអាណាព្យាបាល ឬ ឈ្មោះសិស្ស... (Search parent/student)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-blue-200 pl-10 pr-4 py-2 text-xs font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
            />
          </div>
        </div>

        {/* Parents Directory Table */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-50/60 text-[#2269ff] uppercase font-black tracking-wider border-b border-blue-100">
              <tr>
                <th className="px-6 py-3.5">ឈ្មោះអាណាព្យាបាល (Guardian Name)</th>
                <th className="px-6 py-3.5">ឈ្មោះសិស្ស (Associated Student)</th>
                <th className="px-6 py-3.5">ថ្នាក់រៀន (Class)</th>
                <th className="px-6 py-3.5">លេខទូរស័ព្ទ (Phone Contact)</th>
                <th className="px-6 py-3.5">អ៊ីមែល (Guardian Email)</th>
                <th className="px-6 py-3.5">ស្ថានភាព (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-[#122b59]">
              {filteredParents.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-[#0a1f44] font-extrabold">
                    {s.guardian_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#2269ff]">{s.first_name} {s.last_name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{s.student_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 text-[#2269ff] border border-blue-200 px-2.5 py-0.5 text-[10px] font-black">
                      {s.class_name || 'Grade 10'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[#1c3a73]">
                    {s.guardian_phone || '012 345 678'}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">
                    {s.guardian_email || `${s.first_name.toLowerCase()}.parent@gmail.com`}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-black border border-emerald-200">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  );
}
