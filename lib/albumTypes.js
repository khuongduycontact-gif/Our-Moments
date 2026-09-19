// Các loại album. `key` là giá trị lưu trong Firestore (field `albumType`),
// `label` là nhãn hiển thị cho người dùng.
export const ALBUM_TYPES = [
  { key: "outing", label: "Đi chơi", emoji: "🌸" },
  { key: "story", label: "Câu truyện muốn kể", emoji: "📖" },
  { key: "vent", label: "Vào đây để nói cho bõ tức", emoji: "😤" },
];

// Album cũ (tạo trước khi có tính năng loại album) sẽ được coi là "Đi chơi".
export const DEFAULT_ALBUM_TYPE = "outing";

// Đảm bảo luôn trả về 1 key hợp lệ, kể cả khi dữ liệu thiếu hoặc bị sai.
export function normalizeAlbumType(value) {
  return ALBUM_TYPES.some((t) => t.key === value) ? value : DEFAULT_ALBUM_TYPE;
}

// Lấy thông tin hiển thị { key, label, emoji } của 1 loại album.
export function getAlbumType(value) {
  const key = normalizeAlbumType(value);
  return ALBUM_TYPES.find((t) => t.key === key);
}

// Album nổi bật = album thuộc loại "Đi chơi" có nhiều lượt xem nhất.
// `moments` được sắp xếp mới nhất trước (xem getAllMoments), và ta chỉ thay
// thế khi lượt xem LỚN HƠN hẳn, nên nếu bằng nhau thì album mới nhất thắng.
export function pickFeaturedMoment(moments) {
  let best = null;
  for (const m of moments || []) {
    if (normalizeAlbumType(m.albumType) !== "outing") continue;
    if (!best || (m.viewCount || 0) > (best.viewCount || 0)) best = m;
  }
  return best;
}
