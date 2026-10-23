"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Waves,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Compass,
  KeyRound,
} from "lucide-react";

export default function LoginView({ onSuccess, initialMode = "signin" }) {
  const router = useRouter();
  const { login, register, continueAsGuest, requestPasswordReset, resetPassword } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'signin', 'register', 'forgot', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, rememberMe);
      if (onSuccess) onSuccess();
      else router.push("/");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("incorrect")) {
        setError("Account not found or password incorrect. If this is your first time using this email, click 'Create Account' above, or provision your administrator account using the setup command.");
      } else {
        setError(msg || "Failed to sign in. Please verify your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email || !password || !displayName) {
      setError("Please fill in all required registration fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName);
      if (onSuccess) onSuccess();
      else router.push("/");
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    clearMessages();
    setLoading(true);
    try {
      await continueAsGuest();
      if (onSuccess) onSuccess();
      else router.push("/");
    } catch (err) {
      setError("Could not initialize guest session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setSuccessMsg(res.message || "Password reset instructions issued.");
      if (res.demo_reset_token) {
        setResetToken(res.demo_reset_token);
        setMode("reset");
      }
    } catch (err) {
      setError(err.message || "Could not process password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!resetToken || !newPassword) {
      setError("Please provide the reset token and your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(resetToken, newPassword);
      setSuccessMsg(res.message || "Password updated successfully. Please log in.");
      setPassword("");
      setMode("signin");
    } catch (err) {
      setError(err.message || "Password reset failed. Token may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#176B5B] text-white flex items-center justify-center mx-auto shadow-md mb-3 transition-transform hover:scale-105">
          <Waves className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-[#202A28] tracking-tight">
          LakeClean Mission Control
        </h2>
        <p className="text-sm text-[#6B7773] mt-1">
          Autonomous water quality & debris recovery platform
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-[#E4EAE7] shadow-sm p-6 sm:p-8">
        {/* Card Header & Switcher */}
        <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-4 mb-6">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                clearMessages();
              }}
              className={`text-sm font-semibold pb-1 transition border-b-2 ${
                mode === "signin"
                  ? "border-[#176B5B] text-[#176B5B]"
                  : "border-transparent text-[#6B7773] hover:text-[#202A28]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                clearMessages();
              }}
              className={`text-sm font-semibold pb-1 transition border-b-2 ${
                mode === "register"
                  ? "border-[#176B5B] text-[#176B5B]"
                  : "border-transparent text-[#6B7773] hover:text-[#202A28]"
              }`}
            >
              Create Account
            </button>
          </div>

          <span className="text-[11px] font-medium text-[#247A52] bg-[#EDF7F2] border border-[#C6E7D6] px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Access</span>
          </span>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN MODE */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@lakeclean.demo"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#202A28]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    clearMessages();
                  }}
                  className="text-xs text-[#176B5B] hover:text-[#125648] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7773] hover:text-[#202A28]"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#176B5B] border-[#D5DFDC] rounded-sm focus:ring-[#176B5B]"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs text-[#6B7773] cursor-pointer">
                Remember me on this browser
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#176B5B] hover:bg-[#125648] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. CREATE ACCOUNT / REGISTER MODE */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Full Name / Specialist Call-sign
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan, Hydrologist"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="specialist@lakeclean.org"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Create Password (min 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7773] hover:text-[#202A28]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
              </div>
            </div>

            <div className="p-3 bg-[#F7F9F8] rounded-xl border border-[#E4EAE7] text-[11px] text-[#6B7773] leading-relaxed">
              New accounts are created with the <strong>Operator / Researcher</strong> role. Admin privileges are assigned by system administrators.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#176B5B] hover:bg-[#125648] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-xs text-[#6B7773]">
              Enter your email address and we'll dispatch a single-use password reset link.
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7773] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@lakeclean.demo"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#176B5B] hover:bg-[#125648] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Reset Token</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  clearMessages();
                }}
                className="text-xs text-[#6B7773] hover:text-[#202A28]"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD MODE */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-xs text-[#6B7773]">
              Enter the reset token provided and choose a new password.
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter reset token"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-xs font-mono text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202A28] mb-1.5">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5DFDC] text-sm text-[#202A28] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/15 outline-hidden transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#176B5B] hover:bg-[#125648] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        {/* Guest Mode Divider & Button */}
        <div className="mt-6 pt-6 border-t border-[#E4EAE7]">
          <div className="text-center mb-3">
            <span className="text-[11px] uppercase tracking-wider text-[#6B7773] font-semibold">
              Instant Exploration
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F0F5F3] hover:bg-[#E4EFEA] border border-[#CDE1D9] text-[#176B5B] text-xs font-semibold flex items-center justify-center gap-2 transition shadow-2xs group"
          >
            <Compass className="w-4 h-4 text-[#176B5B] group-hover:rotate-45 transition-transform" />
            <span>Continue as Guest (No Password Required)</span>
          </button>
          <p className="text-[11px] text-[#6B7773] text-center mt-2">
            Access Lady Bird Lake maps, mission planner, and boat simulation with synthetic demo data.
          </p>
        </div>
      </div>
    </div>
  );
}
