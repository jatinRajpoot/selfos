import "./app.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "SelfOS",
  description: "SelfOS: a personal learning management system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo.svg" />
      </head>
      <body className={`${inter.className} bg-[#FAFAFB] text-sm text-[#56565C]`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
