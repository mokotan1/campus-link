"use client";

import { useId, useRef, useState, type DragEvent } from "react";

type FileDropFieldProps = {
  label: string;
  helperText: string;
  accept?: string;
  onFileSelect?: (file: File | null) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileDropField({ label, helperText, accept = "image/*,video/*", onFileSelect }: FileDropFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function applyFile(nextFile: File | null) {
    setFile(nextFile);
    onFileSelect?.(nextFile);

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextFile && nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : null;
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  }

  function removeFile() {
    applyFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2 text-sm font-extrabold text-slate-700">
      <label htmlFor={inputId}>{label}</label>

      {!file ? (
        <div
          className={`grid min-h-32 cursor-pointer place-items-center rounded-lg border border-dashed p-5 text-center text-sm font-bold leading-6 transition ${
            isDragging ? "border-teal-700 bg-teal-50 text-teal-700" : "border-slate-400 bg-slate-50 text-slate-500 hover:border-teal-700 hover:bg-white"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            id={inputId}
            className="sr-only"
            type="file"
            accept={accept}
            onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
          />
          <span>
            {helperText}
            <br />
            <span className="mt-1 inline-block text-xs font-medium text-slate-400">클릭하거나 파일을 끌어다 놓으세요</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={file.name} className="size-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
              파일
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-950">{file.name}</p>
            <p className="text-xs font-bold text-slate-500">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            className="min-h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-700 transition hover:border-rose-400 hover:text-rose-600"
            onClick={removeFile}
          >
            제거
          </button>
        </div>
      )}
    </div>
  );
}
