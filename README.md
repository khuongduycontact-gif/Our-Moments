# Our Moments 💜

Website lưu giữ kỷ niệm cho hai người, xây bằng **Next.js (App Router)**.
- **Đăng nhập**: Firebase Authentication (email/mật khẩu)
- **Dữ liệu (tiêu đề, mô tả, ngày...)**: Firebase Firestore
- **File ảnh/video**: lưu trên **Cloudinary** (upload trực tiếp từ trình duyệt bằng signed upload)

## Cấu trúc trang

1. `/login` – Đăng nhập / đăng ký
2. `/` – Trang chủ (yêu cầu đăng nhập)
3. `/add` – Thêm nội dung mới (ảnh hoặc video)
4. `/moment/[id]` – Chi tiết ảnh/video (xem, sửa, xoá)

## 1. Cài đặt

```bash
npm install
cp .env.local.example .env.local
```

Điền các biến môi trường trong `.env.local` (xem hướng dẫn bên dưới), sau đó:

```bash
npm run dev
```

Mở http://localhost:3000 — sẽ tự chuyển tới `/login`.

## 2. Thiết lập Firebase

1. Vào https://console.firebase.google.com → **Add project**.
2. Vào **Build > Authentication > Sign-in method**, bật **Email/Password** và bật thêm **Google** (chọn email hỗ trợ dự án rồi Save).
3. Vào **Build > Firestore Database** → **Create database** (chọn chế độ *production*).
4. Vào **Project settings > General > Your apps** → chọn **Web** (</>) → copy config vào các biến `NEXT_PUBLIC_FIREBASE_*` trong `.env.local`.
5. Vào tab **Rules** của Firestore, dùng rule mẫu sau (chỉ những email trong danh sách `allowedEmails` mới đọc/ghi được — thêm/xoá email bằng cách sửa danh sách này):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAllowed() {
      return request.auth != null &&
        request.auth.token.email in [
          "duynk.contact@gmail.com",
          "email-thu-2@gmail.com",
          "email-thu-3@gmail.com"
        ];
    }

    match /moments/{momentId} {
      allow read, write: if isAllowed();
    }
    match /settings/{settingId} {
      allow read, write: if isAllowed();
    }
  }
}
```

> **Lưu ý:** Ứng dụng chỉ cho phép những email trong danh sách trên đăng nhập (kiểm tra cả ở client trong `lib/AuthContext.jsx` lẫn ở Firestore Rules để đảm bảo an toàn thật sự). Muốn thêm/xoá email, sửa mảng `ALLOWED_EMAILS` trong `lib/AuthContext.jsx` **và** danh sách `request.auth.token.email in [...]` ở rule trên — cả 2 chỗ phải khớp nhau.

## 3. Thiết lập Cloudinary

1. Vào https://cloudinary.com → **Sign up** (miễn phí, gói Free có 25GB lưu trữ + 25GB băng thông/tháng).
2. Sau khi đăng nhập, vào **Dashboard** (trang chủ Console) → bạn sẽ thấy 3 thông tin:
   - **Cloud name**
   - **API Key**
   - **API Secret** (bấm vào icon con mắt để hiện ra)
3. Điền vào `.env.local`:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ten-cloud-cua-ban
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Không cần tạo bucket, không cần cấu hình CORS hay quyền IAM gì thêm — Cloudinary tự xử lý việc lưu trữ và tối ưu ảnh/video.

## 4. Cách hoạt động của việc tải file lên Cloudinary

- Trang `/add` gọi API nội bộ `POST /api/cloudinary-signature` (chạy trên server Next.js) để lấy một **chữ ký (signature)** — việc này giữ cho `API_SECRET` không bao giờ lộ ra trình duyệt.
- Trình duyệt dùng chữ ký đó để `POST` file thẳng lên Cloudinary (endpoint `/auto/upload`, tự nhận diện ảnh hay video).
- Sau khi upload xong, URL công khai (`secure_url`) do Cloudinary trả về được lưu vào Firestore cùng tiêu đề/mô tả/ngày.
- Tất cả file được lưu trong thư mục `our-moments` trên Cloudinary, dễ quản lý trong Media Library.

## 5. Triển khai (deploy)

Có thể deploy lên Vercel:
```bash
npm run build
```
Nhớ khai báo đầy đủ các biến môi trường trong phần **Environment Variables** của Vercel project.

## 6. Đăng nhập

Vào `/login`, bấm **"Đăng nhập bằng Google"** và chọn 1 trong các tài khoản đã được cho phép (khai báo trong `ALLOWED_EMAILS` ở `lib/AuthContext.jsx`). Không có chức năng đăng ký; nếu muốn đăng nhập bằng email/mật khẩu thay vì Google, hãy vào Firebase Console > Authentication > Users và tự tạo user với email nằm trong danh sách đó.
