"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface MultiImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  existingUrls?: string[];
  maxPhotos?: number;
  minPhotos?: number;
}

export function MultiImageUpload({
  files,
  onChange,
  existingUrls = [],
  maxPhotos = 3,
  minPhotos = 2,
}: MultiImageUploadProps) {
  const [dragOverAll, setDragOverAll] = useState(false);
  const [activeSlotDrag, setActiveSlotDrag] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate and properly clean up object URLs to prevent leaks & flicker
  const previewUrls = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Combine previews with existing saved URLs
  const displayUrls = previewUrls.length > 0 ? previewUrls : existingUrls;
  const count = displayUrls.length;

  function handleBatchFiles(incoming: FileList | File[] | null) {
    if (!incoming) return;
    const array = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (array.length === 0) return;
    const combined = [...files, ...array].slice(0, maxPhotos);
    onChange(combined);
  }

  function handleSlotFile(slotIdx: number, incomingFile: File) {
    const next = [...files];
    next[slotIdx] = incomingFile;
    onChange(next.slice(0, maxPhotos));
  }

  function removeSlot(slotIdx: number) {
    const next = files.filter((_, i) => i !== slotIdx);
    onChange(next);
  }

  function makePrimary(slotIdx: number) {
    if (slotIdx === 0 || slotIdx >= files.length) return;
    const next = [...files];
    const [selected] = next.splice(slotIdx, 1);
    next.unshift(selected);
    onChange(next);
  }

  const slotLabels = [
    { title: "Photo 1", subtitle: "Main photo", icon: "1" },
    { title: "Photo 2", subtitle: "Required", icon: "2" },
    { title: "Photo 3", subtitle: "Optional", icon: "3" },
  ];

  return (
    <div className="space-y-4">
      {/* Header bar with count indicator and guidance */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-display)] text-sm font-bold text-ink">
              Pet photos
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                count >= minPhotos
                  ? "bg-emerald/15 text-emerald"
                  : "bg-vermillion/15 text-vermillion"
              }`}
            >
              {count >= minPhotos
                ? `${count} of ${maxPhotos}`
                : `${count}/${minPhotos} needed`}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-mute">Add 2–3 photos of your pet.</p>
        </div>

        {/* Global batch select button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm transition-all hover:border-emerald hover:text-emerald active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Choose photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleBatchFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Global Drag & Drop Zone if no photos yet */}
      {count === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverAll(true);
          }}
          onDragLeave={() => setDragOverAll(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverAll(false);
            handleBatchFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-8 px-4 text-center transition-all ${
            dragOverAll
              ? "border-emerald bg-emerald/10 scale-[1.01]"
              : "border-line bg-white hover:border-emerald/50 hover:bg-[#f6fbf9]"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="mt-3 font-[family-name:var(--font-display)] text-base font-bold text-ink">
            Drop photos here
          </div>
          <div className="mt-1 text-xs text-mute">PNG, JPG, or WebP</div>
        </div>
      )}

      {/* 3 Interactive Individual Photo Slots */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((slotIdx) => {
          const url = displayUrls[slotIdx];
          const file = files[slotIdx];
          const isPrimary = slotIdx === 0;
          const meta = slotLabels[slotIdx];
          const isSlotDragging = activeSlotDrag === slotIdx;

          if (url) {
            return (
              <div
                key={slotIdx}
                className={`group relative overflow-hidden rounded-2xl border-2 bg-white shadow-md transition-all ${
                  isPrimary
                    ? "border-emerald ring-2 ring-emerald/20"
                    : "border-line hover:border-teal"
                }`}
              >
                {/* Photo Aspect Ratio Container */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Pet photo ${slotIdx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient overlay for badges and controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 opacity-90 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute left-2.5 top-2.5 right-2.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md ${
                        isPrimary
                          ? "bg-emerald text-white"
                          : "bg-white/90 text-ink"
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{isPrimary ? "Main" : `Photo ${slotIdx + 1}`}</span>
                    </span>

                    {/* Delete button */}
                    {file && (
                      <button
                        type="button"
                        onClick={() => removeSlot(slotIdx)}
                        className="rounded-full bg-vermillion/90 p-1.5 text-white shadow-md transition-all hover:bg-vermillion hover:scale-110"
                        title="Remove photo"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Bottom Slot Info & Make Primary Action */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <div className="text-xs font-bold leading-tight drop-shadow-sm">
                      {meta.title}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/80">{meta.subtitle}</span>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => makePrimary(slotIdx)}
                          className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-md transition-colors hover:bg-white hover:text-ink"
                        >
                          Make main
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Empty Slot: Click or drag to add
          return (
            <label
              key={slotIdx}
              onDragOver={(e) => {
                e.preventDefault();
                setActiveSlotDrag(slotIdx);
              }}
              onDragLeave={() => setActiveSlotDrag(null)}
              onDrop={(e) => {
                e.preventDefault();
                setActiveSlotDrag(null);
                const dropped = e.dataTransfer.files[0];
                if (dropped && dropped.type.startsWith("image/")) {
                  handleSlotFile(slotIdx, dropped);
                }
              }}
              className={`group flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                isSlotDragging
                  ? "border-emerald bg-emerald/10 scale-[1.02]"
                  : "border-line bg-white hover:border-emerald/40 hover:bg-[#fafdfb]"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) handleSlotFile(slotIdx, picked);
                  e.target.value = "";
                }}
              />
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-mute transition-all group-hover:scale-110 group-hover:bg-emerald/15 group-hover:text-emerald">
                <span className="text-lg">{meta.icon}</span>
              </div>
              <div className="mt-3 font-[family-name:var(--font-display)] text-xs font-bold text-ink">
                {meta.title}
              </div>
              <div className="mt-0.5 text-[10px] text-mute">{meta.subtitle}</div>
              <div className="mt-3 rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-semibold text-teal group-hover:border-teal group-hover:bg-teal/10">
                + Add Photo
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
