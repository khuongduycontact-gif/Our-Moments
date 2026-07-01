"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function toISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatVN(str) {
  const d = parseISO(str);
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Sinh ra lưới 6 tuần x 7 ngày cho 1 tháng, tuần bắt đầu từ Thứ 2
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=CN...6=T7 -> quy về thứ tự T2..CN (0..6)
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

/**
 * Bộ chọn ngày tuỳ chỉnh, thay cho <input type="date"> mặc định.
 * value / onChange dùng chuỗi ISO "yyyy-MM-dd" để tương thích với code cũ.
 */
export default function DatePicker({
  value,
  onChange,
  max,
  min,
  placeholder = "Chọn ngày",
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseISO(value);
  const maxDate = parseISO(max);
  const minDate = parseISO(min);

  const [viewDate, setViewDate] = useState(
    selectedDate || maxDate || new Date()
  );

  const wrapperRef = useRef(null);

  useEffect(() => {
    if (open) {
      setViewDate(selectedDate || maxDate || new Date());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = buildMonthGrid(year, month);
  const today = new Date();

  function isDisabled(d) {
    if (maxDate && d > maxDate) return true;
    if (minDate && d < minDate) return true;
    return false;
  }

  function selectDay(d) {
    if (isDisabled(d)) return;
    onChange(toISO(d));
    setOpen(false);
  }

  function goToToday() {
    if (maxDate && today > maxDate) return;
    if (minDate && today < minDate) return;
    onChange(toISO(today));
    setOpen(false);
  }

  function changeMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
  }

  const canGoNextMonth =
    !maxDate || new Date(year, month + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-2.5 text-left text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${
          open ? "border-brand-400 ring-2 ring-brand-100" : ""
        }`}
      >
        <span className={value ? "text-slate-700" : "text-slate-400"}>
          {value ? formatVN(value) : placeholder}
        </span>
        <span className="text-brand-400">📅</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[280px] rounded-2xl border border-brand-100 bg-white p-4 shadow-xl sm:w-80 animate-pop-in">
          {/* Điều hướng tháng */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brand-500 transition hover:bg-brand-50"
              aria-label="Tháng trước"
            >
              ‹
            </button>
            <p className="font-display text-sm font-semibold text-brand-700">
              {MONTH_NAMES[month]}, {year}
            </p>
            <button
              type="button"
              onClick={() => canGoNextMonth && changeMonth(1)}
              disabled={!canGoNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-brand-500 transition hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Tháng sau"
            >
              ›
            </button>
          </div>

          {/* Thứ trong tuần */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-medium text-slate-400">
                {w}
              </span>
            ))}
          </div>

          {/* Lưới ngày */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === month;
              const disabled = isDisabled(d);
              const selected = isSameDay(d, selectedDate);
              const isToday = isSameDay(d, today);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  disabled={disabled}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                    selected
                      ? "bg-brand-500 font-semibold text-white shadow-sm"
                      : disabled
                      ? "cursor-not-allowed text-slate-300"
                      : inMonth
                      ? "text-slate-600 hover:bg-brand-100"
                      : "text-slate-300 hover:bg-brand-50"
                  } ${isToday && !selected ? "ring-1 ring-inset ring-brand-300" : ""}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Chân panel */}
          <div className="mt-3 flex items-center justify-between border-t border-brand-100 pt-3">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              ↺ Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
