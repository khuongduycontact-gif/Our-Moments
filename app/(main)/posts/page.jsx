"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FullPageLoader from "@/components/FullPageLoader";
import PageDecor from "@/components/PageDecor";
import { CalendarIcon, PencilIcon } from "@/components/Icons";
import { getAllMoments } from "@/lib/moments";
import { getAuthorDisplay, getPersonLabel } from "@/lib/authorDisplay";

function formatDateVN(dateString) {
  if (!dateString) return "Chưa có ngày";
  return new Date(dateString + "T00:00:00").toLocaleDateString("vi-VN");
}

// Trang "Bài viết": hiển thị lại đúng các album đã có, nhưng theo dạng danh
// sách bài viết (tiêu đề, người viết, ngày, đoạn trích ghi chú) thay vì lưới
// ảnh như trang Album — dùng chung 1 nguồn dữ liệu "moments".
export default function PostsPage() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMoments()
      .then(setMoments)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <PageDecor variant="albums" />

      <div className="relative mb-8 text-center">
        <h1 className="font-display flex items-center justify-center gap-2 text-2xl font-bold text-brand-700 md:text-3xl">
          <PencilIcon className="h-6 w-6 text-brand-500" />
          Bài viết
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Những dòng ghi chú và câu chuyện phía sau từng khoảnh khắc ♡
        </p>
      </div>

      {moments.length === 0 ? (
        <div className="relative rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center">
          <p className="text-slate-500">
            Chưa có bài viết nào. Hãy thêm khoảnh khắc đầu tiên của hai bạn nhé ♡
          </p>
          <Link
            href="/add"
            className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            + Thêm nội dung mới
          </Link>
        </div>
      ) : (
        <div className="relative space-y-4">
          {moments.map((m) => {
            const { author } = getAuthorDisplay(m);
            const excerpt =
              m.description && m.description.length > 180
                ? `${m.description.slice(0, 180)}…`
                : m.description;
            return (
              <Link
                key={m.id}
                href={`/moment/${m.id}`}
                className="block rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h2 className="font-display text-base font-semibold text-brand-700 md:text-lg">
                  {m.title || "Chưa có tiêu đề"}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>Đăng bởi {getPersonLabel(author)}</span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {formatDateVN(m.date)}
                  </span>
                </div>
                {excerpt ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {excerpt}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-slate-400">
                    Album này chưa có ghi chú.
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
