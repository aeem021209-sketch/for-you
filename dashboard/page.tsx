"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

type Summary = { total: number; todayCount: number; monthTotal: number; yearCount: number };

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<Summary>({total:0,todayCount:0,monthTotal:0,yearCount:0});
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) { setLoading(false); return; }
      setProfile(p);
      const today = new Date(); const start = new Date(today.getFullYear(),today.getMonth(),today.getDate()).toISOString();
      const month = new Date(today.getFullYear(),today.getMonth(),1).toISOString();
      const year = `${today.getFullYear()+543}`;
      const { data: receipts } = await supabase.from("receipts").select("amount,receipt_date").eq("receipt_type","normal");
      const rows = receipts || [];
      setSummary({
        total: rows.reduce((s,r)=>s+Number(r.amount||0),0),
        todayCount: rows.filter(r=>r.receipt_date>=start.slice(0,10)).length,
        monthTotal: rows.filter(r=>r.receipt_date>=month.slice(0,10)).reduce((s,r)=>s+Number(r.amount||0),0),
        yearCount: rows.filter(r=>new Date(r.receipt_date).getFullYear()===today.getFullYear()).length
      });
      const { count } = await supabase.from("students").select("*",{count:"exact",head:true}).eq("registered",false).eq("academic_year",year);
      setPending(count||0); setLoading(false);
    }
    load();
  }, [router]);

  async function logout() { await supabase.auth.signOut(); router.replace("/"); }

  if (loading) return <div className="center">กำลังโหลดข้อมูล...</div>;
  if (!profile) return <div className="center">ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ</div>;

  const roleName = {director:"ผู้อำนวยการ",finance:"การเงิน",admin:"แอดมิน"}[profile.role];
  return <div className="shell">
    <aside className="sidebar">
      <div className="side-brand"><span>฿</span><b>School Receipt</b></div>
      <nav>
        <Link className="active" href="/dashboard">▦　ภาพรวม</Link>
        <Link href="/receipts">▤　จัดการใบเสร็จ</Link>
        <Link href="/students">♙　ข้อมูลนักเรียน</Link>
        {profile.role==="admin" && <Link href="/users">⚙　จัดการผู้ใช้</Link>}
      </nav>
      <div className="side-bottom"><div className="user-mini"><b>{profile.full_name}</b><small>{roleName}</small></div><button className="ghost full" onClick={logout}>ออกจากระบบ ↗</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">OVERVIEW</p><h1>ภาพรวมระบบ</h1></div><span className="role-chip">{roleName}</span></header>
      <section className="welcome"><div><h2>ยินดีต้อนรับ, {profile.full_name}</h2><p>สรุปข้อมูลการรับชำระเงินของโรงเรียน</p></div><div className="welcome-icon">฿</div></section>
      <section className="stats">
        <article className="stat"><span>ยอดเงินรับทั้งหมด</span><strong>{summary.total.toLocaleString("th-TH",{maximumFractionDigits:2})} ฿</strong><small>ใบเสร็จปกติทั้งหมด</small></article>
        <article className="stat"><span>จำนวนใบเสร็จวันนี้</span><strong>{summary.todayCount.toLocaleString("th-TH")} <i>ฉบับ</i></strong><small>นับตามวันที่ออกใบเสร็จ</small></article>
        <article className="stat"><span>ยอดรับเดือนนี้</span><strong>{summary.monthTotal.toLocaleString("th-TH",{maximumFractionDigits:2})} ฿</strong><small>ตั้งแต่ต้นเดือน</small></article>
        <article className="stat"><span>นักเรียนยังไม่ลงทะเบียน</span><strong>{pending.toLocaleString("th-TH")} <i>คน</i></strong><small>ปีการศึกษาปัจจุบัน</small></article>
      </section>
      <section className="panel"><div className="panel-head"><div><h3>เมนูด่วน</h3><p>เลือกส่วนที่ต้องการจัดการ</p></div></div>
        <div className="quick-links"><Link href="/receipts"><b>＋</b><span>ออกใบเสร็จ</span></Link><Link href="/students"><b>♙</b><span>เพิ่มนักเรียน</span></Link><Link href="/receipts"><b>⌕</b><span>ค้นหาใบเสร็จ</span></Link>{profile.role==="admin"&&<Link href="/users"><b>⚙</b><span>จัดการผู้ใช้</span></Link>}</div>
      </section>
      <p className="footnote">หมายเหตุ: ยอดเงินใน Dashboard คำนวณจากใบเสร็จประเภทปกติ ไม่รวมใบเสร็จอิสระแบบไม่คิดเงิน</p>
    </main>
  </div>;
}
