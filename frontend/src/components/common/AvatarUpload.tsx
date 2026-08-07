import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '@/config/constants';

interface AvatarUploadProps {
  currentUrl?: string | null;
  name?: string;                           // for initials fallback
  size?: number;                           // px diameter, default 88
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export function AvatarUpload({ currentUrl, name, size = 88, onUpload, disabled }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const displayUrl = preview || getMediaUrl(currentUrl || undefined);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, or GIF images allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    // Optimistic preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setPreview(null);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative group cursor-pointer select-none"
        style={{ width: size, height: size }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        title="Click to upload photo"
      >
        {/* Avatar circle */}
        <div
          className="rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-blue-100 bg-gradient-to-tr from-blue-700 to-[#2269ff] flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="font-bold text-white select-none"
              style={{ fontSize: size * 0.32 }}
            >
              {getInitials(name)}
            </span>
          )}
        </div>

        {/* Camera overlay */}
        <AnimatePresence>
          {!uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="text-white" style={{ width: size * 0.28, height: size * 0.28 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spinner overlay while uploading */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="text-white" style={{ width: size * 0.3, height: size * 0.3 }} />
            </motion.div>
          </div>
        )}

        {/* Small camera badge */}
        {!uploading && (
          <div
            className="absolute bottom-0.5 right-0.5 rounded-full bg-[#2269ff] border-2 border-white flex items-center justify-center shadow"
            style={{ width: size * 0.28, height: size * 0.28 }}
          >
            <Camera className="text-white" style={{ width: size * 0.15, height: size * 0.15 }} />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-semibold text-center max-w-[140px]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}
