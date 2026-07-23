"use client";

import { ImagePlus, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  uploaded,
  onUpload,
  label = "Glissez une photo ou une vidéo, ou cliquez pour parcourir",
  accept = "photo",
}: {
  uploaded: boolean;
  onUpload: () => void;
  label?: string;
  accept?: "photo" | "video";
}) {
  const Icon = accept === "video" ? Video : ImagePlus;
  return (
    <button
      type="button"
      onClick={onUpload}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
        uploaded
          ? "border-success-500/50 bg-success-50"
          : "border-sand-300 bg-white hover:border-gold-500 hover:bg-gold-50/40",
      )}
    >
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          uploaded ? "bg-success-500 text-white" : "bg-gold-100 text-gold-700",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="text-sm font-medium text-navy-800">
        {uploaded ? "Média téléversé — cliquez pour en choisir un autre" : label}
      </p>
      <p className="text-xs text-navy-400">JPG, PNG ou MP4 · 20 Mo maximum</p>
    </button>
  );
}
