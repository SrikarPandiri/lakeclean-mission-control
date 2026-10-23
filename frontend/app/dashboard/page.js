"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#176B5B]/30 border-t-[#176B5B] rounded-full animate-spin" />
    </div>
  );
}
