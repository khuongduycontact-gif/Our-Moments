import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata = {
  title: "Our Moments",
  description: "Nơi lưu giữ những khoảnh khắc đẹp nhất của chúng ta",
  icons: {
    icon: "/heart.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="font-body bg-brand-50 text-slate-800 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
