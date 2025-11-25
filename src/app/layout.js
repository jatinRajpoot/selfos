import "./app.css";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "SelfOS",
  description: "SelfOS: a personal learning management system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:opsz,wght@14..32,100..900&family=Poppins:wght@300;400&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      </head>
      <body className={"bg-[#FAFAFB] font-[Inter] text-sm text-[#56565C]"}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
