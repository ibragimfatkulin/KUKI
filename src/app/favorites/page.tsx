import type { Metadata } from "next";
import { LibraryScreen } from "@/components/library-screen";

export const metadata: Metadata = { title: "Избранное" };

export default function FavoritesPage() {
  return <LibraryScreen mode="favorites" />;
}
