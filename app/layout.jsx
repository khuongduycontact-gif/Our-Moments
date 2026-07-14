import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata = {
    title: "Our Moments",
    description: "Nơi lưu giữ những khoảnh khắc đẹp nhất của chúng ta",
    icons: {
        icon: "/heart.png",
    },
};

// Script chạy trước khi React hydrate để áp dụng ngay theme màu đã lưu
// trong localStorage, tránh bị nháy (flash) màu tím mặc định rồi mới đổi.
const THEME_INIT_SCRIPT = `
  try {
    var theme = localStorage.getItem("bgTheme");
    if (theme && theme !== "purple") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
`;

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
            </head>
            <body className="font-body bg-brand-50 text-slate-800 antialiased">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
