"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

type LoginTab = "login" | "request";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [tab, setTab] = useState<LoginTab>("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [requestForm, setRequestForm] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    address: "",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }

    router.refresh();
    router.push(redirect);
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/auth/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestForm),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Request failed");
      return;
    }

    setSuccess(
      "Your access request has been submitted. An administrator will review it."
    );
    setRequestForm({
      username: "",
      password: "",
      email: "",
      phone: "",
      address: "",
    });
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all duration-200";

  return (
    <div className="w-full max-w-md text-zinc-900">
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1.5 rounded-2xl bg-zinc-100 mb-8">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === "login"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("request");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            tab === "request"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Request Access
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Username
            </label>
            <input
              type="text"
              required
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm((f) => ({ ...f, username: e.target.value }))
              }
              placeholder="Enter your username"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="Enter your password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequestAccess} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={requestForm.username}
                onChange={(e) =>
                  setRequestForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="Choose a username"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={requestForm.email}
                onChange={(e) =>
                  setRequestForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="your@email.com"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={requestForm.password}
                onChange={(e) =>
                  setRequestForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Phone <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={requestForm.phone}
                onChange={(e) =>
                  setRequestForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+1 234 567 890"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Address <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={requestForm.address}
                onChange={(e) =>
                  setRequestForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="City, Country"
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-zinc-200">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}

export function LoginPageContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-zinc-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
