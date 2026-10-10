"use client";

import { usePathname } from "next/navigation";
import StoreHeader from "@/app/components/StoreHeader";
import ScrollToTop from "@/app/components/ScrollToTop";
import WhatsAppButton from "@/app/components/WhatsAppButton";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  
  // Hide WhatsApp button on checkout pages
  const hideWhatsApp = pathname === "/checkout" || pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      <StoreHeader />
      {!hideWhatsApp && <WhatsAppButton />}
      {children}
    </>
  );
}
