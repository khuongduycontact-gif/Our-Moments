// Gom logic xác định cách hiển thị "tác giả" của 1 album, dùng chung giữa
// MomentCard (trang chủ/tất cả album) và trang chi tiết album.
//
// - author: người đã đăng album ban đầu ({ uid, email, name, photoURL })
// - editors: những người KHÁC email tác giả từng chỉnh sửa album
// - Nếu có >= 1 editor khác email tác giả -> coi là "Nhóm tác giả"
export function getAuthorDisplay(moment) {
    const author = moment?.author || null;
    const rawEditors = Array.isArray(moment?.editors) ? moment.editors : [];

    // Loại bỏ trùng lặp theo email, và loại luôn nếu trùng email tác giả gốc
    // (phòng trường hợp dữ liệu cũ/lỗi lưu nhầm).
    const seenEmails = new Set(author?.email ? [author.email] : []);
    const editors = [];
    for (const e of rawEditors) {
        if (e && e.email && !seenEmails.has(e.email)) {
            seenEmails.add(e.email);
            editors.push(e);
        }
    }

    return {
        author,
        editors,
        isGroup: editors.length > 0,
    };
}

// Nhãn hiển thị tên tác giả (ưu tiên tên, sau đó tới email)
export function getPersonLabel(person) {
    if (!person) return "Ẩn danh";
    return person.name || person.email || "Ẩn danh";
}
