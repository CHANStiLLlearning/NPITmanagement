import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { NPITLogo } from '@/components/NPITLogo';
import { Building2, Mail, Phone, MapPin, Save, CheckCircle2, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SchoolSettings() {
  const [schoolName, setSchoolName] = useState('National Polytechnic Institute Techo Sen');
  const [khmerName, setKhmerName] = useState('វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន (NPIT)');
  const [email, setEmail] = useState('info@npit.edu.kh');
  const [phone, setPhone] = useState('+855 23 888 999');
  const [address, setAddress] = useState('Phnom Penh, Kingdom of Cambodia');
  const [website, setWebsite] = useState('https://www.npit.edu.kh');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12 bg-white">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-100 pb-5">
          <div className="flex items-center gap-3">
            <NPITLogo size={44} />
            <div>
              <h1 className="text-2xl font-black text-[#2269ff]">ការកំណត់សាលា (School Settings)</h1>
              <p className="text-xs text-slate-500 font-medium">Manage NPIT institutional profile, contacts, and system defaults</p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-bold text-[#2269ff]">
              <CheckCircle2 className="h-4 w-4" />
              <span>បានរក្សាទុកជោគជ័យ (Saved successfully!)</span>
            </div>
          )}
        </div>

        {/* Profile Card Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs space-y-6">
            <h2 className="text-base font-black text-[#0a1f44] border-b border-slate-100 pb-3">
              ព័ត៌មានទូទៅរបស់វិទ្យាស្ថាន (General Institute Profile)
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                  ឈ្មោះសាលាជាភាសាអង់គ្លេស (English Name)
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                  ឈ្មោះសាលាជាភាសាខ្មែរ (Khmer Name)
                </label>
                <input
                  type="text"
                  value={khmerName}
                  onChange={(e) => setKhmerName(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                  អ៊ីមែលសាលា (Official Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                  លេខទូរស័ព្ទ (Contact Phone)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                  គេហទំព័រ (Website)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                  ឆ្នាំសិក្សាបច្ចុប្បន្ន (Current Academic Year)
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-2">
                អាសយដ្ឋាន (Campus Address)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-[#2269ff] hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm">
              <Save className="mr-2 h-4 w-4" />
              រក្សាទុកការប្រែប្រួល (Save Settings)
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
