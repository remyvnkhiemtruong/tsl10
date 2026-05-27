"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Đăng nhập thất bại");
      router.push("/admin/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-black">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm text-slate-600">Dành cho cán bộ tuyển sinh của Trường THPT Võ Văn Kiệt.</p>
        <div className="mt-6 space-y-4">
          <input className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mật khẩu"
            onKeyDown={(event) => {
              if (event.key === "Enter") void login();
            }}
          />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="w-full" onClick={login} disabled={loading}>
            <LogIn size={16} /> {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
