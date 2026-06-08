import { useRef, useState, useCallback } from "react";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";

type ScanStatus = "idle" | "uploading" | "scanning" | "safe" | "error";

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: ScanStatus;
  errorMsg?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "video/mp4",
  "video/webm",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const StatusIndicator = ({ status, errorMsg }: { status: ScanStatus; errorMsg?: string }) => {
  if (status === "idle") return null;

  const config: Record<Exclude<ScanStatus, "idle">, { bg: string; text: string; icon: string; label: string }> = {
    uploading: {
      bg: "bg-[#EBF3FA]",
      text: "text-[#2E75B6]",
      icon: "⬆️",
      label: "Đang tải lên máy chủ...",
    },
    scanning: {
      bg: "bg-[#EBF3FA]",
      text: "text-[#2E75B6]",
      icon: "🛡️",
      label: "Đang quét ClamAV & Kiểm tra định dạng...",
    },
    safe: {
      bg: "bg-[#E2EFDA]",
      text: "text-[#375623]",
      icon: "✅",
      label: "An toàn — Tệp đã được xác minh và lưu trữ",
    },
    error: {
      bg: "bg-[#FCE4D6]",
      text: "text-[#C00000]",
      icon: "❌",
      label: errorMsg ?? "Tệp bị từ chối. Vui lòng kiểm tra lại định dạng.",
    },
  };

  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
};

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFile = useCallback((index: number, patch: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }, []);

  const uploadFile = useCallback(
    async (file: File, index: number) => {
      // Client-side MIME guard (magic bytes via slice is server-side; this is UX pre-filter only)
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        updateFile(index, {
          status: "error",
          errorMsg: `Loại tệp "${file.type || "không xác định"}" không được phép tải lên.`,
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        updateFile(index, { status: "uploading", progress: 0 });

        await axios.post("/api/uploads/lecture-material", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e: AxiosProgressEvent) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            // Keep progress capped at 90 — the remaining 10% is "scanning" phase
            updateFile(index, { progress: Math.min(pct, 90) });
          },
        });

        // Simulate server-side ClamAV scan delay feedback
        updateFile(index, { status: "scanning", progress: 90 });
        await new Promise((res) => setTimeout(res, 1200));

        updateFile(index, { status: "safe", progress: 100 });
      } catch (err: unknown) {
        let msg = "Tải lên thất bại hoặc tệp bị máy chủ từ chối.";
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          msg = err.response.data.message as string;
        }
        updateFile(index, { status: "error", errorMsg: msg, progress: 0 });
      }
    },
    [updateFile]
  );

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming || incoming.length === 0) return;

      const startIndex = files.length;
      const newEntries: UploadedFile[] = Array.from(incoming).map((f) => ({
        name: f.name,
        size: f.size,
        progress: 0,
        status: "idle" as ScanStatus,
      }));

      setFiles((prev) => [...prev, ...newEntries]);

      Array.from(incoming).forEach((file, i) => {
        uploadFile(file, startIndex + i);
      });
    },
    [files.length, uploadFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Khu vực tải tệp lên"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          border-2 border-dashed rounded-2xl p-10
          flex flex-col items-center gap-3 cursor-pointer
          transition-colors duration-200 select-none outline-none
          focus-visible:ring-2 focus-visible:ring-[#2E75B6] focus-visible:ring-offset-2
          ${
            isDragging
              ? "border-[#2E75B6] bg-[#EBF3FA]"
              : "border-[#2E75B6]/50 bg-[#F8F9FA] hover:bg-[#EBF3FA]"
          }
        `}
      >
        {/* Upload Icon */}
        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center
            transition-colors duration-200
            ${isDragging ? "bg-[#2E75B6]/20" : "bg-[#2E75B6]/10"}
          `}
        >
          <svg
            className="w-8 h-8 text-[#2E75B6]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <p className="font-semibold text-[#1F3864]">
            {isDragging ? "Thả tệp vào đây" : "Kéo & Thả tệp hoặc nhấn để chọn"}
          </p>
          <p className="text-sm text-[#595959]">
            PDF, Video (MP4/WebM), DOCX, PPTX, ZIP — Tối đa 500 MB
          </p>
        </div>

        {/* Security note */}
        <div className="inline-flex items-center gap-1.5 text-xs text-[#7030A0] bg-[#F4EFFF] px-3 py-1.5 rounded-full font-medium mt-1">
          <span>🔒</span>
          Tất cả tệp được quét ClamAV & xác minh định dạng trước khi lưu trữ
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.mp4,.webm,.docx,.pptx,.zip"
          className="hidden"
          onChange={onInputChange}
          aria-hidden="true"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <ul className="space-y-3" aria-label="Danh sách tệp đang tải">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="bg-white rounded-xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 space-y-3"
            >
              {/* File Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* File type icon */}
                  <div className="w-10 h-10 rounded-lg bg-[#EBF3FA] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#2E75B6]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1F3864] truncate" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-xs text-[#595959]">{formatFileSize(f.size)}</p>
                  </div>
                </div>

                {/* Remove button — only when not mid-upload */}
                {f.status !== "uploading" && f.status !== "scanning" && (
                  <button
                    onClick={() => removeFile(i)}
                    aria-label={`Xoá tệp ${f.name}`}
                    className="p-1.5 rounded-lg text-[#595959] hover:bg-[#FCE4D6] hover:text-[#C00000] transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {(f.status === "uploading" || f.status === "scanning" || f.status === "safe") && (
                <div className="space-y-1.5">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                        f.status === "safe"
                          ? "bg-[#375623]"
                          : f.status === "scanning"
                          ? "bg-[#2E75B6] animate-pulse"
                          : "bg-[#2E75B6]"
                      }`}
                      style={{ width: `${f.progress}%` }}
                      role="progressbar"
                      aria-valuenow={f.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <StatusIndicator status={f.status} errorMsg={f.errorMsg} />
                    <span className="text-xs text-[#595959] font-mono tabular-nums">{f.progress}%</span>
                  </div>
                </div>
              )}

              {/* Error / Safe state without progress */}
              {(f.status === "error") && (
                <StatusIndicator status={f.status} errorMsg={f.errorMsg} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
