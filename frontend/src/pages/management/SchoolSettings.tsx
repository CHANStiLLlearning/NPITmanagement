import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { NPITLogo } from '@/components/common/NPITLogo';
import { getMediaUrl } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Globe,
  Shield,
  Layers,
  Sparkles,
  Award,
  Bell,
  Share2,
  Upload,
  Trash2,
  Plus,
  RotateCcw,
  Loader2,
  FileCheck,
  ExternalLink,
  Info,
  Calendar,
  DollarSign,
  Clock,
  Stamp,
  PenTool,
  Check,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CampusItem {
  name: string;
  location: string;
  is_primary: boolean;
}

interface SchoolSettingsData {
  id?: number;
  school_name_en: string;
  school_name_kh: string;
  short_code: string;
  motto_en: string;
  motto_kh: string;
  about_text: string;
  logo_url: string;
  stamp_url: string | null;
  signature_url: string | null;
  principal_name: string;
  principal_title: string;
  email: string;
  secondary_email: string;
  phone: string;
  secondary_phone: string;
  website: string;
  telegram_channel: string;
  facebook_page: string;
  youtube_channel: string;
  address: string;
  campuses: CampusItem[];
  academic_year: string;
  current_semester: string;
  admission_year: string;
  grading_scale: string;
  timezone: string;
  default_language: string;
  date_format: string;
  currency: string;
  departments: string[];
  grade_levels: string[];
  notification_sender_email: string;
  admin_alert_email: string;
  enable_attendance_alerts: boolean;
  enable_grade_alerts: boolean;
  enable_security_alerts: boolean;
}

const defaultSettings: SchoolSettingsData = {
  school_name_en: 'National Polytechnic Institute Techo Sen',
  school_name_kh: 'វិទ្យាស្ថានជាតិពហុបច្ចេកទេសតេជោសែន (NPIT)',
  short_code: 'NPIT',
  motto_en: 'Knowledge, Skill, Integrity, Innovation',
  motto_kh: 'ចំណេះដឹង ជំនាញ សីលធម៌ នវានុវត្តន៍',
  about_text: 'National Polytechnic Institute Techo Sen provides high quality technical and vocational education and training in Cambodia.',
  logo_url: '/npit-logo.png',
  stamp_url: null,
  signature_url: null,
  principal_name: 'H.E. Director General',
  principal_title: 'Director of NPIT',
  email: 'info@npit.edu.kh',
  secondary_email: 'support@npit.edu.kh',
  phone: '+855 23 888 999',
  secondary_phone: '+855 12 345 678',
  website: 'https://www.npit.edu.kh',
  telegram_channel: 'https://t.me/npit_official',
  facebook_page: 'https://facebook.com/npitcambodia',
  youtube_channel: 'https://youtube.com/@npitcambodia',
  address: 'Phnom Penh, Kingdom of Cambodia',
  campuses: [
    { name: 'Main Campus', location: 'Phnom Penh', is_primary: true },
    { name: 'Techo Sen Innovation Center', location: 'Sen Sok, Phnom Penh', is_primary: false },
  ],
  academic_year: '2025-2026',
  current_semester: 'Semester 1',
  admission_year: '2025-2026',
  grading_scale: 'GPA (4.0 Scale)',
  timezone: 'Asia/Phnom_Penh (GMT+7)',
  default_language: 'km',
  date_format: 'DD/MM/YYYY',
  currency: 'USD ($)',
  departments: [
    'Information Technology',
    'Electronics & Automation',
    'Mechanical Engineering',
    'Civil & Construction',
    'Automotive Engineering',
    'Business & Management',
  ],
  grade_levels: [
    'Year 1 (Foundation)',
    'Year 2 (Associate)',
    'Year 3 (Bachelor)',
    'Year 4 (Senior Bachelor)',
  ],
  notification_sender_email: 'no-reply@npit.edu.kh',
  admin_alert_email: 'admin@school.com',
  enable_attendance_alerts: true,
  enable_grade_alerts: true,
  enable_security_alerts: true,
};

export default function SchoolSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'contact' | 'academic' | 'notifications'>('general');
  const [formData, setFormData] = useState<SchoolSettingsData>(defaultSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  // New item input states
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusLoc, setNewCampusLoc] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('');

  // Fetch settings from backend
  const { data: serverSettings, isLoading } = useQuery<SchoolSettingsData>({
    queryKey: ['school-settings'],
    queryFn: async () => {
      const res = await axios.get('/settings/');
      return res.data;
    },
  });

  useEffect(() => {
    if (serverSettings) {
      setFormData({
        ...defaultSettings,
        ...serverSettings,
        campuses: Array.isArray(serverSettings.campuses) ? serverSettings.campuses : defaultSettings.campuses,
        departments: Array.isArray(serverSettings.departments) ? serverSettings.departments : defaultSettings.departments,
        grade_levels: Array.isArray(serverSettings.grade_levels) ? serverSettings.grade_levels : defaultSettings.grade_levels,
      });
    }
  }, [serverSettings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: SchoolSettingsData) => {
      const res = await axios.put('/settings/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['school-settings'], data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post('/settings/reset');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['school-settings'], data);
      setFormData(data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
  });

  const handleInputChange = (field: keyof SchoolSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, assetType: 'logo' | 'stamp' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(assetType);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await axios.post(`/settings/upload-asset?asset_type=${assetType}`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data.url;
      if (assetType === 'logo') {
        handleInputChange('logo_url', uploadedUrl);
      } else if (assetType === 'stamp') {
        handleInputChange('stamp_url', uploadedUrl);
      } else if (assetType === 'signature') {
        handleInputChange('signature_url', uploadedUrl);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upload asset.');
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleAddCampus = () => {
    if (!newCampusName.trim()) return;
    const updated = [
      ...formData.campuses,
      { name: newCampusName.trim(), location: newCampusLoc.trim() || 'Phnom Penh', is_primary: formData.campuses.length === 0 },
    ];
    handleInputChange('campuses', updated);
    setNewCampusName('');
    setNewCampusLoc('');
  };

  const handleRemoveCampus = (index: number) => {
    const updated = formData.campuses.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((c) => c.is_primary)) {
      updated[0].is_primary = true;
    }
    handleInputChange('campuses', updated);
  };

  const handleSetPrimaryCampus = (index: number) => {
    const updated = formData.campuses.map((c, i) => ({
      ...c,
      is_primary: i === index,
    }));
    handleInputChange('campuses', updated);
  };

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    if (!formData.departments.includes(newDepartment.trim())) {
      handleInputChange('departments', [...formData.departments, newDepartment.trim()]);
    }
    setNewDepartment('');
  };

  const handleRemoveDepartment = (dept: string) => {
    handleInputChange('departments', formData.departments.filter((d) => d !== dept));
  };

  const handleAddGradeLevel = () => {
    if (!newGradeLevel.trim()) return;
    if (!formData.grade_levels.includes(newGradeLevel.trim())) {
      handleInputChange('grade_levels', [...formData.grade_levels, newGradeLevel.trim()]);
    }
    setNewGradeLevel('');
  };

  const handleRemoveGradeLevel = (lvl: string) => {
    handleInputChange('grade_levels', formData.grade_levels.filter((l) => l !== lvl));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Layout>
      <div className="space-y-6 pb-16 bg-slate-50/50 min-h-screen">
        {/* Top Header Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {formData.logo_url ? (
                <img
                  src={getMediaUrl(formData.logo_url)}
                  alt="School Logo"
                  className="h-16 w-16 rounded-2xl object-contain border-2 border-blue-100 bg-white p-1 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/npit-logo.png';
                  }}
                />
              ) : (
                <NPITLogo size={64} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#2269ff]">ការកំណត់សាលា & វិទ្យាស្ថាន</h1>
                <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-extrabold text-[#2269ff]">
                  {formData.short_code}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#ec171c] mt-0.5">
                {formData.school_name_kh}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage institutional branding, academic structures, multi-campus details, and alert preferences.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user?.role === 'super_admin' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (window.confirm('Reset all school settings to default NPIT profile?')) {
                    resetMutation.mutate();
                  }
                }}
                disabled={resetMutation.isPending}
                className="rounded-xl border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                កំណត់ឡើងវិញ (Reset Defaults)
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>រក្សាទុកការប្រែប្រួល (Save All)</span>
            </Button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {savedSuccess && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 font-bold text-sm shadow-xs animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p>បានរក្សាទុកការកំណត់សាលាដោយជោគជ័យ! (School Settings saved successfully to Database)</p>
            </div>
          </div>
        )}

        {/* Tab Navigation Navigation Bar */}
        <div className="flex overflow-x-auto rounded-2xl bg-white p-1.5 shadow-xs border border-blue-100 gap-1.5">
          {[
            { id: 'general', label: 'ព័ត៌មានទូទៅ', sub: 'General Profile', icon: Building2 },
            { id: 'branding', label: 'ស្លាកសញ្ញា & ត្រា', sub: 'Branding & Seals', icon: Stamp },
            { id: 'contact', label: 'ទំនាក់ទំនង & សង្គម', sub: 'Contacts & Social', icon: Mail },
            { id: 'academic', label: 'រចនាសម្ព័ន្ធអប់រំ', sub: 'Academic Structure', icon: BookOpen },
            { id: 'notifications', label: 'ការជូនដំណឹង', sub: 'Notifications & Alerts', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-1 min-w-[130px] items-center justify-center gap-2.5 rounded-xl py-3 px-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2269ff] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50/60 hover:text-[#2269ff]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="text-left leading-tight truncate">
                  <p className="truncate">{tab.label}</p>
                  <p className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {tab.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* TAB 1: GENERAL PROFILE */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#0a1f44] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2269ff]" />
                  ព័ត៌មានអត្តសញ្ញាណវិទ្យាស្ថាន (Institutional Identity)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Official name, acronym, motto, and regional time and formatting standards.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ឈ្មោះសាលាជាភាសាអង់គ្លេស (English Name)
                  </label>
                  <input
                    type="text"
                    value={formData.school_name_en}
                    onChange={(e) => handleInputChange('school_name_en', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Used on international transcripts, degree certificates, and API responses.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ឈ្មោះសាលាជាភាសាខ្មែរ (Khmer Name)
                  </label>
                  <input
                    type="text"
                    value={formData.school_name_kh}
                    onChange={(e) => handleInputChange('school_name_kh', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Used on official Cambodian government reports and local attendance notices.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ពាក្យកាត់ ឬ កូដសាលា (Short Code / Acronym)
                  </label>
                  <input
                    type="text"
                    value={formData.short_code}
                    onChange={(e) => handleInputChange('short_code', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                    placeholder="e.g. NPIT"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Prefix for student IDs, report titles, and short header badges.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ពាក្យស្លោក/បេសកកម្មជាភាសាខ្មែរ (Khmer Motto / Slogan)
                  </label>
                  <input
                    type="text"
                    value={formData.motto_kh}
                    onChange={(e) => handleInputChange('motto_kh', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Printed at the top of national exam scorecards and bulletins.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ពាក្យស្លោកជាភាសាអង់គ្លេស (English Motto / Slogan)
                  </label>
                  <input
                    type="text"
                    value={formData.motto_en}
                    onChange={(e) => handleInputChange('motto_en', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Example: "Knowledge, Skill, Integrity, Innovation".
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    តំបន់ពេលវេលាប្រព័ន្ធ (System Timezone)
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  >
                    <option value="Asia/Phnom_Penh (GMT+7)">Asia/Phnom_Penh (GMT+7)</option>
                    <option value="Asia/Bangkok (GMT+7)">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8)</option>
                    <option value="UTC (GMT+0)">UTC (GMT+0)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Controls automated daily attendance cut-off timestamps.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ទម្រង់កាលបរិច្ឆេទ & រូបិយប័ណ្ណ (Date Format & Currency)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={formData.date_format}
                      onChange={(e) => handleInputChange('date_format', e.target.value)}
                      className="rounded-xl border border-blue-200 bg-white px-3 py-3 text-xs sm:text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="rounded-xl border border-blue-200 bg-white px-3 py-3 text-xs sm:text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                    >
                      <option value="USD ($)">USD ($)</option>
                      <option value="KHR (៛)">KHR (៛)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Standard formatting across report tables and tuition calculations.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ភាសាលំនាំដើម (Default Language)
                  </label>
                  <select
                    value={formData.default_language}
                    onChange={(e) => handleInputChange('default_language', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  >
                    <option value="km">ភាសាខ្មែរ (Khmer)</option>
                    <option value="en">English (US)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Initial UI localization for new student and teacher accounts.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  អំពីវិទ្យាស្ថាន / សេចក្តីសង្ខេបបេសកកម្ម (About Institution / Mission)
                </label>
                <textarea
                  rows={3}
                  value={formData.about_text}
                  onChange={(e) => handleInputChange('about_text', e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white p-4 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>
            </div>

            {/* Multi-Campus / Branches Section */}
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0a1f44] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#2269ff]" />
                    សាខា និងទីតាំងសិក្សា (Multiple Campuses & Branches)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Future-proof branch management for multi-campus institutes.
                  </p>
                </div>
              </div>

              {/* Campus List */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {formData.campuses.map((campus, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 transition-all flex items-start justify-between gap-3 ${
                      campus.is_primary ? 'border-blue-300 bg-blue-50/40 shadow-xs' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#0a1f44]">{campus.name}</span>
                        {campus.is_primary && (
                          <span className="rounded-full bg-[#2269ff] px-2 py-0.5 text-[10px] font-bold text-white">
                            Primary Campus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {campus.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!campus.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryCampus(idx)}
                          className="rounded-lg p-1.5 text-xs font-bold text-[#2269ff] hover:bg-blue-100/60"
                          title="Set as Primary"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveCampus(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove campus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Campus Form */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Campus Name (e.g. Toul Kork Branch)"
                  value={newCampusName}
                  onChange={(e) => setNewCampusName(e.target.value)}
                  className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="City / District Location"
                  value={newCampusLoc}
                  onChange={(e) => setNewCampusLoc(e.target.value)}
                  className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={handleAddCampus}
                  className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2.5 text-xs shrink-0"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> បន្ថែមសាខា (Add Campus)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDING & SEALS */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Logo Upload Card */}
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="h-28 w-28 rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-2 flex items-center justify-center overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={getMediaUrl(formData.logo_url)}
                      alt="Logo"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/npit-logo.png';
                      }}
                    />
                  ) : (
                    <NPITLogo size={80} />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0a1f44]">ស្លាកសញ្ញាផ្លូវការ (School Logo)</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Recommended: PNG / SVG with transparent background (Max 10MB).
                  </p>
                </div>
                <div className="w-full">
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 py-2.5 text-xs font-bold text-[#2269ff] hover:bg-blue-100/60 transition-colors">
                    {uploadingAsset === 'logo' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>ជ្រើសរើសរូបសញ្ញា (Upload Logo)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, 'logo')}
                    />
                  </label>
                </div>
              </div>

              {/* Official Stamp / Seal Card */}
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="h-28 w-28 rounded-3xl border-2 border-dashed border-red-200 bg-red-50/40 p-2 flex items-center justify-center overflow-hidden">
                  {formData.stamp_url ? (
                    <img
                      src={getMediaUrl(formData.stamp_url)}
                      alt="Official Stamp"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Stamp className="h-12 w-12 text-[#ec171c]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0a1f44]">ត្រាផ្លូវការរបស់វិទ្យាស្ថាន (Official Seal / Stamp)</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Attached to official transcripts, scorecards, and certificates.
                  </p>
                </div>
                <div className="w-full">
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 py-2.5 text-xs font-bold text-[#ec171c] hover:bg-red-100/60 transition-colors">
                    {uploadingAsset === 'stamp' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>ផ្ទុកឡើងត្រាសាលា (Upload Stamp)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, 'stamp')}
                    />
                  </label>
                </div>
              </div>

              {/* Director Signature Card */}
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="h-28 w-28 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-2 flex items-center justify-center overflow-hidden">
                  {formData.signature_url ? (
                    <img
                      src={getMediaUrl(formData.signature_url)}
                      alt="Director Signature"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <PenTool className="h-12 w-12 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0a1f44]">ហត្ថលេខានាយក (Director Signature)</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Transparent PNG signature for fast automated document signing.
                  </p>
                </div>
                <div className="w-full">
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/70 transition-colors">
                    {uploadingAsset === 'signature' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>ផ្ទុកឡើងហត្ថលេខា (Upload Signature)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, 'signature')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Principal Name & Title */}
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-black text-[#0a1f44]">
                ព័ត៌មានថ្នាក់ដឹកនាំសាលា (Institutional Leadership)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">
                    ឈ្មោះនាយក / សាកលវិទ្យាធិការ (Director / Principal Name)
                  </label>
                  <input
                    type="text"
                    value={formData.principal_name}
                    onChange={(e) => handleInputChange('principal_name', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1">
                    តួនាទី / ឋានៈផ្លូវការ (Official Title)
                  </label>
                  <input
                    type="text"
                    value={formData.principal_title}
                    onChange={(e) => handleInputChange('principal_title', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* LIVE CERTIFICATE / OFFICIAL REPORT PREVIEW */}
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[#2269ff]" />
                  <h3 className="text-sm sm:text-base font-black text-[#0a1f44]">
                    ការមើលសាកល្បងលើក្បាលលិខិត & វិញ្ញាបនបត្រ (Live Certificate / Official Document Header Preview)
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[11px] font-bold text-emerald-700">
                  Live Rendering
                </span>
              </div>

              {/* Realistic Document Paper Container */}
              <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-amber-50/20 to-white p-6 sm:p-8 shadow-inner space-y-6">
                <div className="flex items-start justify-between gap-4 border-b-2 border-blue-900/40 pb-5">
                  <div className="flex items-center gap-4">
                    {formData.logo_url ? (
                      <img
                        src={getMediaUrl(formData.logo_url)}
                        alt="Logo Preview"
                        className="h-16 w-16 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/npit-logo.png';
                        }}
                      />
                    ) : (
                      <NPITLogo size={64} />
                    )}
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-[#2269ff] leading-tight">
                        {formData.school_name_kh}
                      </h4>
                      <h5 className="text-xs sm:text-sm font-bold text-[#ec171c] tracking-wider uppercase">
                        {formData.school_name_en}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-semibold italic mt-0.5">
                        « {formData.motto_kh} »
                      </p>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ACADEMIC YEAR</p>
                    <p className="text-xs font-black text-[#0a1f44]">{formData.academic_year}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">CAMPUS</p>
                    <p className="text-xs font-bold text-slate-600">
                      {formData.campuses.find((c) => c.is_primary)?.name || 'Main Campus'}
                    </p>
                  </div>
                </div>

                {/* Sample Certificate Body Mock */}
                <div className="text-center py-4 space-y-2">
                  <h6 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest">
                    វិញ្ញាបនបត្របញ្ជាក់ការសិក្សា (OFFICIAL ACADEMIC CERTIFICATE)
                  </h6>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    This preview shows exactly how the institution logo, seal, motto, and leadership signature will be stamped onto student diplomas and grade reports.
                  </p>
                </div>

                {/* Stamp and Signature Mock Footer */}
                <div className="flex items-end justify-between pt-4 border-t border-slate-200/80">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">CONTACT VERIFICATION</p>
                    <p className="text-xs font-bold text-slate-700">{formData.email}</p>
                    <p className="text-xs font-bold text-slate-700">{formData.phone}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stamp */}
                    {formData.stamp_url && (
                      <div className="h-16 w-16 opacity-85">
                        <img
                          src={getMediaUrl(formData.stamp_url)}
                          alt="Official Stamp Preview"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}

                    {/* Signature */}
                    <div className="text-center space-y-1">
                      {formData.signature_url ? (
                        <img
                          src={getMediaUrl(formData.signature_url)}
                          alt="Signature Preview"
                          className="h-10 w-28 object-contain mx-auto"
                        />
                      ) : (
                        <div className="h-10 w-28 border-b border-dashed border-slate-400 mx-auto" />
                      )}
                      <p className="text-xs font-black text-[#0a1f44]">{formData.principal_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{formData.principal_title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACTS & SOCIAL */}
        {activeTab === 'contact' && (
          <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-black text-[#0a1f44] flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#2269ff]" />
                ព័ត៌មានទំនាក់ទំនង & បណ្តាញសង្គម (Contacts & Social Media Channels)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Public channels used by students, parents, and prospective candidates to reach NPIT.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  អ៊ីមែលចម្បង (Primary Official Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Official inbox for institutional inquiries.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  អ៊ីមែលជំនួយការ/គាំទ្រ (Secondary Support Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.secondary_email}
                    onChange={(e) => handleInputChange('secondary_email', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">IT helpdesk and student support contact.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  លេខទូរស័ព្ទទាន់ហេតុការណ៍ (Primary Hotline Phone)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Main admissions and administration phone number.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  លេខទូរស័ព្ទបន្ទាប់បន្សំ (Secondary Phone)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.secondary_phone}
                    onChange={(e) => handleInputChange('secondary_phone', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Academic affairs or registrar contact line.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  គេហទំព័រផ្លូវការ (Official Website URL)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Public school portal domain.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  ឆានែល Telegram ផ្លូវការ (Official Telegram Channel)
                </label>
                <div className="relative">
                  <Share2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.telegram_channel}
                    onChange={(e) => handleInputChange('telegram_channel', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Used for broadcast news and urgent alerts.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  ទំព័រ Facebook ផ្លូវការ (Official Facebook Page)
                </label>
                <input
                  type="text"
                  value={formData.facebook_page}
                  onChange={(e) => handleInputChange('facebook_page', e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  ឆានែល YouTube (YouTube Video Channel)
                </label>
                <input
                  type="text"
                  value={formData.youtube_channel}
                  onChange={(e) => handleInputChange('youtube_channel', e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                អាសយដ្ឋានទីតាំងចម្បង (Main Campus Address)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Full physical address of the main administrative campus.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: ACADEMIC STRUCTURE */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#0a1f44] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#2269ff]" />
                  រចនាសម្ព័ន្ធឆ្នាំសិក្សា & ឆមាស (Academic Cycles & Grading)
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Active academic year, current term, evaluation scales, and department offerings.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ឆ្នាំសិក្សាបច្ចុប្បន្ន (Current Academic Year)
                  </label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => handleInputChange('academic_year', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">e.g. 2025-2026</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ឆមាសកំពុងដំណើរការ (Active Semester / Term)
                  </label>
                  <select
                    value={formData.current_semester}
                    onChange={(e) => handleInputChange('current_semester', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  >
                    <option value="Semester 1">Semester 1 (ឆមាសទី ១)</option>
                    <option value="Semester 2">Semester 2 (ឆមាសទី ២)</option>
                    <option value="Summer Term">Summer Term (វគ្គវិស្សមកាល)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ឆ្នាំចូលរៀនថ្មី (Admission Intake Year)
                  </label>
                  <input
                    type="text"
                    value={formData.admission_year}
                    onChange={(e) => handleInputChange('admission_year', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Intake batch identifier</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                    ប្រព័ន្ធវាយតម្លៃពិន្ទុ (Grading Scale Format)
                  </label>
                  <select
                    value={formData.grading_scale}
                    onChange={(e) => handleInputChange('grading_scale', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  >
                    <option value="GPA (4.0 Scale)">GPA (4.0 Scale)</option>
                    <option value="100-Point Percentage">100-Point Percentage</option>
                    <option value="Letter Grade (A-F)">Letter Grade (A-F)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Departments & Faculties Manager */}
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm sm:text-base font-black text-[#0a1f44]">
                  ដេប៉ាតឺម៉ង់ & មហាវិទ្យាល័យ (Academic Departments & Faculties)
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Available departments for teacher assignments and course curricula.
                </p>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2">
                {formData.departments.map((dept, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-[#2269ff]"
                  >
                    {dept}
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(dept)}
                      className="rounded-full hover:bg-blue-200/70 p-0.5"
                    >
                      <Trash2 className="h-3 w-3 text-blue-600" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Department Input */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="New department name..."
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={handleAddDepartment}
                  className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold rounded-xl px-4 text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> បន្ថែម (Add)
                </Button>
              </div>
            </div>

            {/* Grade / Year Levels Manager */}
            <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-sm sm:text-base font-black text-[#0a1f44]">
                  កម្រិតឆ្នាំសិក្សា (Grade & Year Levels)
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Academic stages for student progression and class groupings.
                </p>
              </div>

              {/* Grade Level Tag Cloud */}
              <div className="flex flex-wrap gap-2">
                {formData.grade_levels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-3.5 py-1.5 text-xs font-bold text-purple-700"
                  >
                    {lvl}
                    <button
                      type="button"
                      onClick={() => handleRemoveGradeLevel(lvl)}
                      className="rounded-full hover:bg-purple-200/70 p-0.5"
                    >
                      <Trash2 className="h-3 w-3 text-purple-600" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Grade Level Input */}
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. Master Program Year 1"
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                  className="flex-1 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                />
                <Button
                  type="button"
                  onClick={handleAddGradeLevel}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-4 text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> បន្ថែម (Add)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS & ALERTS */}
        {activeTab === 'notifications' && (
          <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-black text-[#0a1f44] flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#2269ff]" />
                ការកំណត់ការជូនដំណឹង & ប្រព័ន្ធសុវត្ថិភាព (Automated Notifications & Alerts)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Configure automated system dispatch addresses, attendance alerts, and grade releases.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  អាសយដ្ឋានអ៊ីមែលផ្ញើចេញ (Notification Dispatch Sender Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.notification_sender_email}
                    onChange={(e) => handleInputChange('notification_sender_email', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  The 'From' address displayed on automated alert emails.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2269ff] uppercase tracking-wider mb-1.5">
                  អ៊ីមែលទទួលការជូនដំណឹងរដ្ឋបាល (Admin Alert Recipient Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={formData.admin_alert_email}
                    onChange={(e) => handleInputChange('admin_alert_email', e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#0a1f44] focus:border-[#2269ff] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Receives automated security audits and system health warnings.
                </p>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-[#2269ff] uppercase tracking-wider">
                កុងតាក់ស្វ័យប្រវត្តិកម្ម (Automated Alert Triggers)
              </h3>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                <div>
                  <p className="text-sm font-bold text-[#0a1f44]">ការជូនដំណឹងវត្តមានសិស្ស (Student Attendance Alerts)</p>
                  <p className="text-xs text-slate-500 font-medium">
                    Automatically send attendance summary notices when absences or tardiness are logged.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enable_attendance_alerts}
                  onChange={(e) => handleInputChange('enable_attendance_alerts', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                <div>
                  <p className="text-sm font-bold text-[#0a1f44]">ការជូនដំណឹងលទ្ធផលប្រឡង & ពិន្ទុ (Exam Scores & Grade Alerts)</p>
                  <p className="text-xs text-slate-500 font-medium">
                    Notify students when midterm/final grades and report cards are officially approved.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enable_grade_alerts}
                  onChange={(e) => handleInputChange('enable_grade_alerts', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                <div>
                  <p className="text-sm font-bold text-[#0a1f44]">ការជូនដំណឹងសុវត្ថិភាពចូលគណនី (Login Security Audits)</p>
                  <p className="text-xs text-slate-500 font-medium">
                    Notify administrators when unfamiliar IP addresses access administrative consoles.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enable_security_alerts}
                  onChange={(e) => handleInputChange('enable_security_alerts', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Save Floating Footer */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="bg-[#2269ff] hover:bg-blue-700 text-white font-bold rounded-xl px-8 py-3.5 text-sm sm:text-base shadow-lg flex items-center gap-2 cursor-pointer"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>រក្សាទុកការប្រែប្រួលទាំងអស់ (Save School Settings)</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
