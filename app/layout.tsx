import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Kyro Parfums | Find your note",
  description: "A considered edit of fine fragrances, decanted for the curious.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fffefa",
                color: "#171717",
                border: "1px solid rgba(23,23,23,0.10)",
                borderRadius: "14px",
                fontSize: "13px",
                fontFamily: "inherit",
                boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
              },
              success: {
                iconTheme: { primary: "#aa8953", secondary: "#fffefa" },
              },
              error: {
                iconTheme: { primary: "#9a3a2c", secondary: "#fffefa" },
              },
            }}
          />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
