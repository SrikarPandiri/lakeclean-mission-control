"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PlusCircle, Menu, LogOut, ShieldCheck, UserCheck, Compass, LogIn } from "lucide-react";

export default function Header({ title, subtitle, actionButton }) {
  const { user, isAuthenticated, isGuest, isAdmin, logout } = useAuth();

  const handleToggleMobile = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("toggle-mobile-menu"));
    }
  };

  return (
    <header className="h-16 border-b border-[#E4EAE7] bg-white sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={handleToggleMobile}
          className="md:hidden p-1.5 rounded-lg text-[#6B7773] hover:text-[#202A28] hover:bg-[#F0F4F2] transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-[#202A28] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-[#6B7773] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role & Status Pill */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {isGuest ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDF7F2] border border-[#C6E7D6] text-[11px] font-medium text-[#247A52]">
                <Compass className="w-3.5 h-3.5 text-[#247A52]" />
                <span className="hidden xs:inline">GUEST MODE · DEMO DATA</span>
                <span className="xs:hidden">GUEST</span>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF5F2] border border-[#176B5B]/30 text-[11px] font-semibold text-[#176B5B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B5B]" />
                <span className="hidden sm:inline">ADMINISTRATOR</span>
                <span className="sm:hidden">ADMIN</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">OPERATOR</span>
              </div>
            )}

            {/* Logout / Exit Guest Mode */}
            <button
              onClick={logout}
              title={isGuest ? "Exit Guest Mode" : "Sign Out"}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-[#6B7773] hover:text-[#202A28] hover:bg-[#F0F4F2] border border-transparent hover:border-[#D5DFDC] transition flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isGuest ? "Exit Demo" : "Sign Out"}</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[#176B5B] hover:bg-[#EDF7F2] border border-[#176B5B]/30 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}

        {/* Action Button */}
        {actionButton ? (
          actionButton
        ) : (
          <Link
            href="/missions"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#176B5B] hover:bg-[#125648] text-white text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Plan Mission</span>
          </Link>
        )}
      </div>
    </header>
  );
}
