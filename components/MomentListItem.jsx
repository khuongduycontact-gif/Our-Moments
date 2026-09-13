"use client";

import Link from "next/link";
import { getAuthorDisplay, getPersonLabel } from "@/lib/authorDisplay";

function formatDateVN(dateString) {
  if (!dateString) return "Chưa có ngày";
  return new Date(dateString + "T00:00:00").toLocaleDateString("vi-VN");
}

// 1 dòng trong danh sách "Khoảnh khắc đáng nhớ" ở trang chủ: ảnh thu nhỏ +
// tiêu đề + ngày + người đăng, bấm vào để xem chi tiết album.
export default function MomentListItem({ moment }) {
  const media = moment.media && moment.media.length > 0 ? moment.media : [];
  const cover = media[0] || { type: moment.type, url: moment.url };
  const { author } = getAuthorDisplay(moment);
  const hasBeenSeen = Array.isArray(moment.viewedBy) && moment.viewedBy.length > 0;

  return (
    <Link
      href={`/moment/${moment.id}`}
      className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-brand-50"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-100">
        {cover.type === "video" ? (
          <>
            <video src={cover.url} className="h-full w-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[10px] text-brand-700">
                ▶
              </span>
            </div>
          </>
        ) : (
          <img
            src={cover.url}
            alt={moment.title || "Khoảnh khắc"}
            className="h-full w-full object-cover"
          />
        )}
        {hasBeenSeen && (
          <span className="absolute left-0.5 top-0.5 rounded bg-white/90 px-1 py-0.5 text-[9px] font-medium text-brand-600">
            ✓
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-700">
          {moment.title || "Chưa có tiêu đề"}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {formatDateVN(moment.date)}
        </p>
        {author && (
          <p className="truncate text-xs text-slate-400">{getPersonLabel(author)}</p>
        )}
      </div>

      <span className="shrink-0 text-brand-300">›</span>
    </Link>
  );
}
