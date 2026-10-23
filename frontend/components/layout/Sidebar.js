"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Map,
  Compass,
  PlayCircle,
  AlertOctagon,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Waves,
  ShieldCheck,
  UserCheck,
  LogOut,
  LogIn,
  X,
  Users,
} from "lucide-react";

export const BASE_NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Lake Map", href: "/map", icon: Map },
  { name: "Mission Planner", href: "/missions", icon: Compass },
  { name: "Live Simulation", href: "/simulation", icon: PlayCircle },
  { name: "Waste Reports", href: "/reports", icon: AlertOctagon },
  { name: "Mission History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings & Methodology", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isGuest, isAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Listen for mobile menu toggle event dispatched by Header
  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-menu", handleToggle);
    return () => window.removeEventListener("toggle-mobile-menu", handleToggle);
  }, []);

  // Dynamically include Admin Console if the user is an Administrator
  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(isAdmin
      ? [{ name: "User Management", href: "/admin", icon: Users }]
      : []),
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E4EAE7] flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between h-16 px-4 border-b border-[#E4EAE7]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#176B5B] flex items-center justify-center text-white shadow-xs">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#202A28] text-sm block">LakeClean</span>
                <span className="text-[10px] text-[#6B7773] uppercase tracking-wider block">Mission Control</span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-[#6B7773] hover:text-[#202A28] hover:bg-[#F0F4F2]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-[#EAF5F2] text-[#176B5B] font-semibold"
                      : "text-[#6B7773] hover:text-[#202A28] hover:bg-[#F7F9F8]"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#176B5B]" : "text-[#6B7773]"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile User Profile & Session info */}
        <div className="p-4 border-t border-[#E4EAE7] bg-[#F7F9F8] text-xs space-y-3">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#202A28] truncate max-w-[170px]">
                    {user?.display_name || "Specialist"}
                  </div>
                  <div className="text-[11px] text-[#6B7773] truncate max-w-[170px]">
                    {user?.email || "Guest Session"}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-[#6B7773] hover:text-red-600 hover:bg-red-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#247A52]">
                <span className="w-2 h-2 rounded-full bg-[#247A52]" />
                <span className="capitalize">{user?.role || "Guest"} Mode Active</span>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#176B5B] text-white text-xs font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Enter</span>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r border-[#E4EAE7] bg-white flex-col justify-between ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-[#E4EAE7]">
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#176B5B] flex items-center justify-center shrink-0 shadow-xs text-white">
                <Waves className="w-4 h-4" />
              </div>
              {!collapsed && (
                <div className="leading-tight">
                  <span className="font-bold text-[#202A28] tracking-tight text-sm block">
                    LakeClean
                  </span>
                  <span className="text-[10px] text-[#6B7773] font-medium tracking-wider uppercase block">
                    Mission Control
                  </span>
                </div>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-[#6B7773] hover:text-[#202A28] hover:bg-[#F2F5F4] transition shrink-0"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation list */}
          <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-[#EAF5F2] text-[#176B5B] font-semibold border-l-3 border-[#176B5B]"
                      : "text-[#6B7773] hover:text-[#202A28] hover:bg-[#F7F9F8] font-normal"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#176B5B]" : "text-[#6B7773]"}`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & session status */}
        <div className="p-3 border-t border-[#E4EAE7] bg-[#F7F9F8]">
          {!collapsed ? (
            <div className="space-y-2 text-xs">
              {isAuthenticated ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#202A28] truncate block max-w-[130px]">
                      {user?.display_name || "Specialist"}
                    </span>
                    <button
                      onClick={logout}
                      title={isGuest ? "Exit Guest Mode" : "Sign Out"}
                      className="text-[#6B7773] hover:text-red-600 p-1 rounded-md hover:bg-white transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#247A52] font-semibold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#247A52]" />
                    <span className="uppercase">{user?.role || "GUEST"} MODE</span>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#176B5B] text-white text-xs font-semibold hover:bg-[#125648] transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAuthenticated ? (isAdmin ? "bg-[#176B5B]" : "bg-[#247A52]") : "bg-slate-300"
                }`}
                title={isAuthenticated ? `${user?.role?.toUpperCase()} Active` : "Unauthenticated"}
              />
              {isAuthenticated && (
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-[#6B7773] hover:text-red-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
