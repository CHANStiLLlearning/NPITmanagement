import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Image as ImageIcon, FileSpreadsheet, Presentation,
  Trash2, Download, Copy, Check, AlertCircle, File, Eye, X, HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileMetadata {
  filename: string;
  original_name: string;
  file_type: string;
  extension: string;
  size_bytes: number;
  size_mb: number;
  url: string;
  uploaded_at: string;
}

const CATEGORIES = [
  { id: 'all',        label: 'All Files',   icon: HardDrive },
  { id: 'image',      label: 'Images',      icon: ImageIcon },
  { id: 'pdf',        label: 'PDF',         icon: FileText  },
  { id: 'word',       label: 'Word',        icon: FileText  },
  { id: 'excel',      label: 'Excel',       icon: FileSpreadsheet },
  { id: 'powerpoint', label: 'PowerPoint',  icon: Presentation },
];

const FILE_TYPE_COLORS: Record<string, string> = {
  image:      'bg-purple-100 text-purple-700 border-purple-200',
  pdf:        'bg-rose-100 text-rose-700 border-rose-200',
  word:       'bg-blue-100 text-blue-700 border-blue-200',
  excel:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  powerpoint: 'bg-amber-100 text-amber-700 border-amber-200',
  other:      'bg-slate-100 text-[#1c3a73] border-slate-200',
};

const MAX_SIZE_MB = 50;

export default function FileManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [errorMsg, setErrorMsg]             = useState<string | null>(null);
  const [copiedName, setCopiedName]         = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Query uploaded files
  const { data: files = [], isLoading } = useQuery<FileMetadata[]>({
    queryKey: ['uploaded-files'],
    queryFn: async () => { const res = await axios.get('/files/list'); return Array.isArray(res.data) ? res.data : []; },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (filename: string) => axios.delete(`/files/${filename}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['uploaded-files'] }),
  });

  // Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    setErrorMsg(null);
    let selectedFiles: File[] = [];

    if ('files' in e.target && e.target.files) {
      selectedFiles = Array.from(e.target.files);
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      e.preventDefault();
      selectedFiles = Array.from(e.dataTransfer.files);
    }

    if (selectedFiles.length === 0) return;

    // Validate size limit (50MB) & allowed extensions
    for (const f of selectedFiles) {
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB > MAX_SIZE_MB) {
        setErrorMsg(`File "${f.name}" (${sizeMB.toFixed(1)}MB) exceeds the maximum allowed limit of 50MB.`);
        return;
      }
    }

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('files', f));

    try {
      setUploadProgress(10);
      await axios.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);
      queryClient.invalidateQueries({ queryKey: ['uploaded-files'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadProgress(null);
      setErrorMsg(err.response?.data?.detail || 'Failed to upload files.');
    }
  };

  const copyLink = (url: string, filename: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedName(filename);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const filteredFiles = files.filter(f => activeCategory === 'all' || f.file_type === activeCategory);

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44] ">File Manager</h1>
            <p className="text-sm text-slate-500">Upload, organize and manage school assets (Images, PDF, Word, Excel, PowerPoint — max 50MB)</p>
          </div>
        </div>

        {/* Dropzone Upload Box */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 ">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileChange}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/80 transition-all ">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2269ff] text-white shadow-lg">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#122b59] ">
                Click to upload or drag &amp; drop files here
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Supports <span className="font-semibold text-[#2269ff]">Images, PDF, Word, Excel, PowerPoint</span> (Max file size: <span className="font-bold text-rose-500">50MB</span>)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Progress Bar */}
          {uploadProgress !== null && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-[#2269ff] font-semibold">
                <span>Uploading files…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
                <div className="h-2 bg-[#2269ff] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-500 hover:text-rose-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = files.filter(f => cat.id === 'all' || f.file_type === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap border transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#2269ff] text-white border-[#2269ff] shadow-md'
                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 '
                }`}>
                <Icon className="h-4 w-4" /> {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((f) => {
            const colorClass = FILE_TYPE_COLORS[f.file_type] || FILE_TYPE_COLORS.other;
            return (
              <motion.div
                key={f.filename}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all ">
                
                {/* File Header / Preview */}
                <div>
                  {f.file_type === 'image' ? (
                    <div className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-slate-100 ">
                      <img src={f.url} alt={f.original_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="mb-3 flex h-32 w-full items-center justify-center rounded-xl bg-slate-50 ">
                      {f.file_type === 'pdf' && <FileText className="h-12 w-12 text-rose-500" />}
                      {f.file_type === 'word' && <FileText className="h-12 w-12 text-blue-500" />}
                      {f.file_type === 'excel' && <FileSpreadsheet className="h-12 w-12 text-emerald-500" />}
                      {f.file_type === 'powerpoint' && <Presentation className="h-12 w-12 text-amber-500" />}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#0a1f44] text-sm truncate" title={f.original_name}>
                      {f.original_name}
                    </p>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${colorClass}`}>
                      {f.extension}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {f.size_mb} MB · {f.uploaded_at.slice(0, 10)}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 ">
                  <div className="flex gap-1">
                    <a href={f.url} target="_blank" rel="noreferrer" download className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2269ff] :bg-[#1c3a73]">
                      <Download className="h-4 w-4" />
                    </a>
                    <button onClick={() => copyLink(f.url, f.filename)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#2269ff] :bg-[#1c3a73]">
                      {copiedName === f.filename ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <button onClick={() => deleteMutation.mutate(f.filename)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredFiles.length === 0 && !isLoading && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-400 ">
              <File className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No files found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
