import type { Metadata } from "next";
import { ProfilePanel } from "@/components/profile-panel";

export const metadata: Metadata = { title: "Профиль" };

export default function ProfilePage() {
  return <ProfilePanel />;
}
