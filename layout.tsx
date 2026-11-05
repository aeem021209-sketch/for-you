import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจัดการใบเสร็จโรงเรียน",
  description: "ระบบรับชำระเงินและจัดการใบเสร็จรับเงิน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
