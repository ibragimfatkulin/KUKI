import type { Metadata } from "next";
import { LibraryScreen } from "@/components/library-screen";

export const metadata: Metadata = { title: "История" };

export default function HistoryPage() {
  return <LibraryScreen mode="history" />;
}
