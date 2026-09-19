"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Số ký tự tối đa trên mỗi trang ghi chú. Ghi chú ngắn hơn ngưỡng này (cộng
// thêm 25% dung sai) sẽ hiện trọn trên 1 trang, không hiện thanh phân trang.
const DEFAULT_PAGE_SIZE = 900;
const TOLERANCE = 1.25;

// Cắt 1 đoạn văn quá dài (không có xuống dòng) thành nhiều mảnh <= maxChars.
// Ưu tiên cắt sau dấu kết câu, rồi tới khoảng trắng, cuối cùng mới cắt cứng.
function splitLongParagraph(paragraph, maxChars) {
  const chunks = [];
  let rest = paragraph;

  while (rest.length > maxChars) {
    const slice = rest.slice(0, maxChars);
    let cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("… ")
    );
    if (cut < maxChars * 0.5) cut = slice.lastIndexOf(" ");
    if (cut < maxChars * 0.3) {
      cut = maxChars - 1;
      // Tránh cắt đôi 1 ký tự emoji (cặp surrogate)
      if (/[\uD800-\uDBFF]/.test(rest[cut])) cut -= 1;
    }
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trimStart();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

// Chia ghi chú thành các trang: gom theo từng dòng/đoạn văn cho tới khi đầy
// trang thì sang trang mới, đoạn nào dài quá thì cắt theo câu.
export function paginateText(text, maxChars = DEFAULT_PAGE_SIZE) {
  const normalized = (text || "").replace(/\r\n?/g, "\n");
  if (normalized.length <= maxChars * TOLERANCE) return [normalized];

  const pages = [];
  let current = "";

  const flush = () => {
    const page = current.replace(/^\n+|\n+$/g, "");
    if (page) pages.push(page);
    current = "";
  };

  for (const paragraph of normalized.split("\n")) {
    const parts =
      paragraph.length > maxChars
        ? splitLongParagraph(paragraph, maxChars)
        : [paragraph];

    for (const part of parts) {
      const candidate = current ? `${current}\n${part}` : part;
      if (candidate.length > maxChars && current) {
        flush();
        current = part;
      } else {
        current = candidate;
      }
    }
  }
  flush();

  // Trang cuối quá ngắn thì gộp vào trang trước để không bị "mồ côi"
  if (pages.length > 1) {
    const last = pages[pages.length - 1];
    const prev = pages[pages.length - 2];
    if (
      last.length < maxChars * 0.25 &&
      prev.length + 1 + last.length <= maxChars * TOLERANCE
    ) {
      pages.splice(pages.length - 2, 2, `${prev}\n${last}`);
    }
  }

  return pages.length ? pages : [normalized];
}

// Danh sách số trang hiển thị trên thanh phân trang, vd: [1, "…", 4, 5, 6, "…", 12]
function getPageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

// Hiển thị ghi chú của album: giữ nguyên xuống dòng, và tự phân trang khi
// ghi chú dài (không còn giới hạn số ký tự khi viết).
export default function PaginatedNote({
  text,
  emptyText = "Chưa có ghi chú nào.",
  pageSize = DEFAULT_PAGE_SIZE,
}) {
  const pages = useMemo(() => paginateText(text, pageSize), [text, pageSize]);
  const [page, setPage] = useState(1);
  const topRef = useRef(null);

  // Về trang 1 khi nội dung ghi chú thay đổi (vd: vừa chỉnh sửa xong)
  useEffect(() => {
    setPage(1);
  }, [text]);

  if (!text || !text.trim()) {
    return <p>{emptyText}</p>;
  }

  const total = pages.length;
  const safePage = Math.min(page, total);

  function goTo(p) {
    setPage(Math.min(Math.max(1, p), total));
    // Nếu đầu ghi chú đã trượt khỏi màn hình thì cuộn lại cho dễ đọc tiếp
    const el = topRef.current;
    if (el && el.getBoundingClientRect().top < 80) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <p className="whitespace-pre-wrap break-words leading-relaxed">
        {pages[safePage - 1]}
      </p>

      {total > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 border-t border-brand-100 pt-3">
          <button
            type="button"
            onClick={() => goTo(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Trang ghi chú trước"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition hover:bg-brand-100 disabled:opacity-40"
          >
            ‹
          </button>

          {getPageWindow(safePage, total).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => goTo(p)}
                aria-label={`Trang ${p}`}
                aria-current={p === safePage ? "page" : undefined}
                className={`flex h-8 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-medium transition ${p === safePage
                  ? "bg-brand-500 text-white"
                  : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                  }`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => goTo(safePage + 1)}
            disabled={safePage === total}
            aria-label="Trang ghi chú sau"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition hover:bg-brand-100 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
