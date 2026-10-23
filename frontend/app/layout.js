import "./globals.css";
import Providers from "@/components/layout/Providers";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "LakeClean Mission Control — Autonomous Boat Planning & Simulation",
  description: "Evidence-driven, capacity-aware mission planning and autonomous lake waste cleanup simulation platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F9F8] text-[#202A28] antialiased selection:bg-[#176B5B]/15 selection:text-[#176B5B]">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
