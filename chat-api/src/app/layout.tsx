import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "maxwellii-chat",
  description: "Chat API backend for maxwellii.com",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
