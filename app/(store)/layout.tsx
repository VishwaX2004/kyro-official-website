import StoreHeader from "@/app/components/StoreHeader";
import ScrollToTop from "@/app/components/ScrollToTop";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ScrollToTop />
      <StoreHeader />
      {children}
    </>
  );
}
