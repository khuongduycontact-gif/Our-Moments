"use client";

import Link from "next/link";
import { StarIcon, CalendarIcon, NoteIcon, ArrowRightIcon } from "@/components/Icons";
import HeartIcon from "@/components/HeartIcon";
import { getAuthorDisplay, getPersonLabel } from "@/lib/authorDisplay";

function formatDateVN(dateString) {
  if (!dateString) return "Chưa có ngày";
  return new Date(dateString + "T00:00:00").toLocaleDateString("vi-VN");
}

function formatDateTimeVN(dateString, timeString) {
  const datePart = formatDateVN(dateString);
  if (!timeString) return datePart;
  return `${datePart} · ${timeString}`;
}

// Khối "Album nổi bật" ở trang chủ: hiện album loại "Đi chơi" có nhiều lượt
// xem nhất (xem pickFeaturedMoment) kèm ảnh/video đại diện + thông tin (người
// đăng, ngày đăng, ngày kỷ niệm, lượt xem, ghi chú).
export default function FeaturedMoment({ moment }) {
  const media = moment.media && moment.media.length > 0 ? moment.media : [];
  const cover = media[0] || { type: moment.type, url: moment.url };
  const count = media.length;
  const { author } = getAuthorDisplay(moment);

  return (
    <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-2">
      <div className="relative aspect-square bg-brand-100 md:aspect-auto">
        <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-600 shadow-sm">
          <StarIcon className="h-3 w-3 text-amber-400" />
          Album nổi bật
        </span>
        {count > 1 && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            🖼 {count}
          </span>
        )}

        {cover.type === "video" ? (
          <video
            src={cover.url}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={cover.url}
            alt={moment.title || "Album nổi bật"}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col justify-center gap-3 p-5 md:p-6">
        <h3 className="font-display text-lg font-bold text-brand-700 md:text-xl">
          {moment.title || "Chưa có tiêu đề"}
        </h3>

        {author && (
          <p className="text-xs text-slate-500">
            Đăng bởi {getPersonLabel(author)}
          </p>
        )}

        <div className="space-y-1.5 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-brand-400" />
            Ngày đăng tải: {formatDateTimeVN(moment.date, moment.time)}
          </p>
          {moment.memorialDate && (
            <p className="flex items-center gap-1.5">
              <HeartIcon className="h-3.5 w-3.5 text-rose-400" />
              Ngày kỷ niệm: {formatDateVN(moment.memorialDate)}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <span aria-hidden="true" className="w-3.5 text-center">👁</span>
            {moment.viewCount || 0} lượt xem
          </p>
        </div>

        {moment.description && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <NoteIcon className="h-3.5 w-3.5 text-brand-400" />
              Ghi chú
            </p>
            <p className="line-clamp-4 text-sm leading-relaxed text-slate-500">
              {moment.description}
            </p>
          </div>
        )}

        <Link
          href={`/moment/${moment.id}`}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
        >
          Xem chi tiết
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
