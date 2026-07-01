// Ngày bắt đầu yêu nhau — sửa ở đây nếu cần đổi ngày.
export const LOVE_START_DATE = "2026-02-02"; // 02/02/2026

// Tính số ngày đã yêu nhau, tính theo ngày (lấy mốc 00:00 để không lệch giờ).
// Ngày bắt đầu được tính là ngày thứ 1.
export function getLoveDays(fromDateStr = LOVE_START_DATE) {
  const start = new Date(fromDateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMidnight = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const diffMs = today - startMidnight;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function formatLoveStartDateVN(dateStr = LOVE_START_DATE) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
