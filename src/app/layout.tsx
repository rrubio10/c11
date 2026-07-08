import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C1 Practice Lab",
  description: "Independent Cambridge C1 Advanced practice platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
