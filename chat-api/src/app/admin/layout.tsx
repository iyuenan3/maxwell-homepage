import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "chat-api admin",
  description: "Internal log viewer",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
