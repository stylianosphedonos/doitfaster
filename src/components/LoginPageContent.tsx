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
    "w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400";

  return (
    <div className="w-full max-w-md text-zinc-900">
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 mb-6">
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "login"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("request");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "request"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Request access
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
          {success}
        </div>
      )}

      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm((f) => ({ ...f, username: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((f) => ({ ...f, password: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequestAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={requestForm.username}
              onChange={(e) =>
                setRequestForm((f) => ({ ...f, username: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
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
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={requestForm.email}
              onChange={(e) =>
                setRequestForm((f) => ({ ...f, email: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={requestForm.phone}
              onChange={(e) =>
                setRequestForm((f) => ({ ...f, phone: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1.5">
              Address
            </label>
            <textarea
              value={requestForm.address}
              onChange={(e) =>
                setRequestForm((f) => ({ ...f, address: e.target.value }))
              }
              rows={2}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Submitting..." : "Submit request"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-600">
        <Link href="/" className="text-black hover:text-zinc-700 transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

export function LoginPageContent() {
  return (
    <Suspense fallback={<div className="text-zinc-600">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
