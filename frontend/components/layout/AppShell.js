"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // If unauthenticated user tries to visit a protected route directly, redirect to home
  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== "/" && pathname !== "/login") {
      router.replace("/");
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Loading state while checking localStorage session
  if (loading) {
    return (
      <main className="min-h-screen w-full bg-[#F7F9F8] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#176B5B]/30 border-t-[#176B5B] rounded-full animate-spin" />
      </main>
    );
  }

  // Unauthenticated landing & login state: No sidebar, no left section menu, clean full-width canvas
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full bg-[#F7F9F8]">
        {children}
      </main>
    );
  }

  // Authenticated state (Operator, Admin, or Guest Mode): Show full persistent sidebar navigation and workspace
  return (
    <div className="flex min-h-screen bg-[#F7F9F8]">
      <Sidebar />
      <div className="flex-1 ml-16 md:ml-60 flex flex-col min-h-screen transition-all duration-300">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
