"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthorDisplay, getPersonLabel } from "@/lib/authorDisplay";
import { setMomentFavorite } from "@/lib/moments";
import { CalendarIcon, CheckIcon, HeartOutlineIcon } from "@/components/Icons";
import HeartIcon from "@/components/HeartIcon";

function formatDateVN(dateString) {
  if (!dateString) return "Chưa có ngày";

  return new Date(dateString + "T00:00:00").toLocaleDateString("vi-VN");
}

// Avatar tròn nhỏ: hiện ảnh đại diện nếu có, nếu không hiện chữ cái đầu tên/email
function MiniAvatar({ person, className = "h-5 w-5" }) {
  const label = getPersonLabel(person);
  const initial = label ? label.trim().charAt(0).toUpperCase() : "?";

  if (person?.photoURL) {
    return (
      <img
        src={person.photoURL}
        alt={label}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-white`}
      />
    );
  }
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-brand-200 text-[10px] font-semibold text-brand-700 ring-1 ring-white`}
    >
      {initial}
    </span>
  );
}

export default function MomentCard({ moment, onFavoriteChange }) {
  const media = moment.media && moment.media.length > 0 ? moment.media : [];
  const cover = media[0] || { type: moment.type, url: moment.url };
  const count = media.length;
  const { author, editors, isGroup } = getAuthorDisplay(moment);
  const hasBeenSeen = Array.isArray(moment.viewedBy) && moment.viewedBy.length > 0;

  const [favorite, setFavorite] = useState(!!moment.favorite);
  const [savingFavorite, setSavingFavorite] = useState(false);

  async function handleToggleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (savingFavorite) return;
    const next = !favorite;
    setFavorite(next);
    setSavingFavorite(true);
    try {
      await setMomentFavorite(moment.id, next);
      onFavoriteChange?.(moment.id, next);
    } catch (err) {
      console.error(err);
      setFavorite(!next); // rollback nếu lưu thất bại
    } finally {
      setSavingFavorite(false);
    }
  }

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
            📷 {count}
          </span>
        )}

        {hasBeenSeen && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-brand-600 shadow-sm">
            <CheckIcon className="h-3 w-3" />
            Đã xem
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={favorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
          aria-pressed={favorite}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-white aria-pressed:opacity-100"
        >
          {favorite ? (
            <HeartIcon className="h-3.5 w-3.5" />
          ) : (
            <HeartOutlineIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Thông tin */}
      <div className="p-3 text-left">
        <h3 className="truncate text-sm font-semibold text-brand-700">
          {moment.title || "Chưa có tiêu đề"}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <CalendarIcon className="h-3 w-3 text-brand-400" />
          {formatDateVN(moment.date)}
        </p>

        {/* Người đăng - hoặc "Nhóm tác giả" nếu có người khác email đã chỉnh sửa */}
        {author && (
          <div className="mt-2 flex items-center gap-1.5">
            {isGroup ? (
              <>
                <span className="flex -space-x-1.5">
                  <MiniAvatar person={author} />
                  <MiniAvatar person={editors[0]} />
                </span>
                <span className="truncate text-[11px] font-medium text-slate-500">
                  Đã cùng nhau chia sẻ
                </span>
              </>
            ) : (
              <>
                <MiniAvatar person={author} />
                <span className="truncate text-[11px] text-slate-500">
                  {getPersonLabel(author)}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
