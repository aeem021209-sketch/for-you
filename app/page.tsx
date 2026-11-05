"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน");
    router.push("/dashboard");
  }

  return <main className="login-wrap">
    <form className="login-card" onSubmit={login}>
      <div className="brand-mark">฿</div>
      <h1>ระบบจัดการใบเสร็จ</h1>
      <p className="muted">โรงเรียน · ระบบรับชำระเงิน</p>
      <label>อีเมล</label>
      <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@school.ac.th"/>
      <label>รหัสผ่าน</label>
      <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="รหัสผ่าน"/>
      {error && <p className="error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
      <p className="tiny muted">สำหรับผู้ดูแลระบบ ผู้อำนวยการ และเจ้าหน้าที่การเงิน</p>
    </form>
  </main>;
}
