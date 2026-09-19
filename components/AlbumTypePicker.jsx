"use client";

import { ALBUM_TYPES } from "@/lib/albumTypes";

// Ô chọn loại album (Đi chơi / Những câu chuyện bla bla trên trời dưới đất muốn kể / Vào đây để nói cho bõ tức).
// Dùng chung cho trang thêm album và form chỉnh sửa album.
export default function AlbumTypePicker({ value, onChange, disabled = false }) {
  return (
    <div
      role="radiogroup"
      aria-label="Loại album"
      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
    >
      {ALBUM_TYPES.map((type) => {
        const active = value === type.key;
        return (
          <button
            key={type.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(type.key)}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center text-sm font-medium leading-snug transition disabled:opacity-60 sm:flex-col sm:gap-1 ${active
              ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
              : "border-brand-200 bg-white text-slate-500 hover:bg-brand-50"
              }`}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {type.emoji}
            </span>
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
