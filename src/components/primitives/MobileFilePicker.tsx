import React, { useRef } from 'react';
import { Camera, UploadCloud, FileText } from 'lucide-react';

interface MobileFilePickerProps {
  accept?: string;
  onFileSelect: (file: File) => void;
  label?: string;
  helperText?: string;
  enableCamera?: boolean;
  maxSizeBytes?: number;
  className?: string;
}

export const MobileFilePicker: React.FC<MobileFilePickerProps> = ({
  accept,
  onFileSelect,
  label = 'Upload Document or Photo',
  helperText,
  enableCamera = false,
  maxSizeBytes,
  className = '',
}) => {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (maxSizeBytes && file.size > maxSizeBytes) {
      const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds allowed limit of ${mb} MB.`);
      return;
    }

    setSelectedFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {/* Mobile-Safe Container: Input is rendered transparently stretched, NOT display:none */}
      <div className="relative border border-dashed border-border dark:border-border-dark hover:border-[#e11d48] dark:hover:border-rose-300 bg-surface-raised dark:bg-surface-raised-dark rounded-lg p-4 transition-colors">
        <label className="flex flex-col items-center justify-center cursor-pointer text-center py-2">
          <UploadCloud className="w-8 h-8 text-[#e11d48] dark:text-[#fb7185] mb-2 stroke-[1.75]" />
          <span className="text-sm font-semibold text-content-primary dark:text-content-primary-dark">
            {selectedFileName ? selectedFileName : label}
          </span>
          <span className="text-xs text-content-secondary dark:text-content-secondary-dark mt-1">
            {helperText || 'Tap to choose file or drag into area'}
          </span>

          {/* CRITICAL: Input is opacity-0 and stretched over the parent container so iOS Safari handles change events reliably */}
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label={label}
          />
        </label>
      </div>

      {/* Optional Selfie / Camera Capture Route (Mobile Direct) */}
      {enableCamera && (
        <div className="relative border border-border dark:border-border-dark bg-white dark:bg-surface-dark rounded-md px-3 py-2 flex items-center justify-center gap-2 text-xs font-medium text-content-primary dark:text-content-primary-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Camera size={16} className="text-orange-600 dark:text-orange-400 stroke-[1.75]" />
          <span>Take a photo / selfie with camera</span>
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Capture with camera"
          />
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
      )}
    </div>
  );
};
