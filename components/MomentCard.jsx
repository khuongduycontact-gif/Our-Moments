"use client";

import Link from "next/link";

function formatDateVN(dateString) {
  if (!dateString) return "Chưa có ngày";

  return new Date(dateString + "T00:00:00").toLocaleDateString("vi-VN");
}

export default function MomentCard({ moment }) {
  const media = moment.media && moment.media.length > 0 ? moment.media : [];
  const cover = media[0] || { type: moment.type, url: moment.url };
  const count = media.length;

  return (
    <Link
      href={`/moment/${moment.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Ảnh / Video đại diện album */}
      <div className="relative aspect-square overflow-hidden bg-brand-100">
        {cover.type === "video" ? (
          <>
            <video
              src={cover.url}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-brand-700 shadow">
                ▶
              </div>
            </div>
          </>
        ) : (
          <img
            src={cover.url}
            alt={moment.title || "Khoảnh khắc"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}

        {count > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            🖼 {count}
          </span>
        )}
      </div>

      {/* Thông tin */}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-brand-700 text-center">
          {moment.title || "Chưa có tiêu đề"}
        </h3>

        <p className="mt-1 text-xs text-slate-500 text-center">
          📅 {formatDateVN(moment.date)}
        </p>
      </div>
    </Link>
  );
}
