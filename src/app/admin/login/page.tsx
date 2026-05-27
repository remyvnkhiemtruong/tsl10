"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL_NAME } from "@/lib/constants";

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
        body: JSON.stringify({ email, password }),
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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_32%),linear-gradient(135deg,#f8fafc,#e0f2fe)] px-4 py-10">
      <Card className="w-full max-w-md shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/LogoVVK.png"
            alt="Logo Trường THPT Võ Văn Kiệt"
            width={72}
            height={72}
            className="h-18 w-18 rounded-full object-contain"
            priority
          />
          <CardTitle className="mt-5 text-2xl">Đăng nhập quản trị</CardTitle>
          <CardDescription className="mt-2">Dành cho cán bộ tuyển sinh của {SCHOOL_NAME}.</CardDescription>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              onKeyDown={(event) => {
                if (event.key === "Enter") void login();
              }}
            />
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Button className="w-full" onClick={login} disabled={loading}>
            <LogIn size={16} /> {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
