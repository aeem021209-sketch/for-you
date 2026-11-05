"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export default function UsersPage(){
 const router=useRouter();const [me,setMe]=useState<Profile|null>(null);const [rows,setRows]=useState<Profile[]>([]);
 const [form,setForm]=useState({email:"",password:"",full_name:"",role:"finance"});const [busy,setBusy]=useState(false);
 async function load(){const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/");return;}const {data:p}=await supabase.from("profiles").select("*").eq("id",user.id).single();setMe(p);if(p?.role==="admin"){const {data}=await supabase.from("profiles").select("*").order("full_name");setRows(data||[]);}}
 useEffect(()=>{load();},[]);
 async function create(e:React.FormEvent){e.preventDefault();if(me?.role!=="admin")return;setBusy(true);const res=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await res.json();setBusy(false);if(!res.ok)alert(data.error||"เพิ่มผู้ใช้ไม่สำเร็จ");else{alert("เพิ่มผู้ใช้สำเร็จ");setForm({email:"",password:"",full_name:"",role:"finance"});load();}}
 async function update(p:Profile){const full_name=prompt("ชื่อผู้ใช้",p.full_name);if(full_name===null)return;const role=prompt("บทบาท: director / finance / admin",p.role);if(!role||!["director","finance","admin"].includes(role))return alert("บทบาทไม่ถูกต้อง");const {error}=await supabase.from("profiles").update({full_name,role}).eq("id",p.id);if(error)alert(error.message);else load();}
 async function remove(p:Profile){if(!confirm(`ลบผู้ใช้ ${p.full_name} ?`))return;const res=await fetch(`/api/users?id=${p.id}`,{method:"DELETE"});const d=await res.json();if(!res.ok)alert(d.error||"ลบไม่สำเร็จ");else load();}
 if(me?.role!=="admin")return <div className="center">เฉพาะแอดมินเท่านั้นที่เข้าถึงหน้านี้ได้</div>;
 return <div className="shell"><aside className="sidebar"><div className="side-brand"><span>฿</span><b>School Receipt</b></div><nav><Link href="/dashboard">▦　ภาพรวม</Link><Link href="/receipts">▤　จัดการใบเสร็จ</Link><Link href="/students">♙　ข้อมูลนักเรียน</Link><Link className="active" href="/users">⚙　จัดการผู้ใช้</Link></nav><div className="side-bottom"><button className="ghost full" onClick={async()=>{await supabase.auth.signOut();router.replace("/")}}>ออกจากระบบ ↗</button></div></aside>
 <main className="main"><header className="topbar"><div><p className="eyebrow">USER MANAGEMENT</p><h1>จัดการผู้ใช้งาน</h1></div><span className="role-chip">แอดมิน</span></header>
 <section className="panel"><h3>เพิ่มผู้ใช้งานใหม่</h3><form className="student-form" onSubmit={create}><label>ชื่อ-นามสกุล<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label><label>อีเมล<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>รหัสผ่านเริ่มต้น<input type="password" minLength={8} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>ระดับสิทธิ์<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="director">ผู้อำนวยการ</option><option value="finance">การเงิน</option><option value="admin">แอดมิน</option></select></label><button className="primary" disabled={busy}>{busy?"กำลังบันทึก...":"เพิ่มผู้ใช้"}</button></form></section>
 <section className="panel"><div className="panel-head"><div><h3>ผู้ใช้งานทั้งหมด</h3><p>{rows.length} บัญชี</p></div></div><div className="table-wrap"><table><thead><tr><th>ชื่อ</th><th>สิทธิ์</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.full_name}</td><td>{({director:"ผู้อำนวยการ",finance:"การเงิน",admin:"แอดมิน"} as any)[p.role]}</td><td>{p.active?"ใช้งาน":"ปิดใช้งาน"}</td><td><div className="actions"><button onClick={()=>update(p)}>แก้ไข</button><button className="danger-text" onClick={()=>remove(p)}>ลบ</button></div></td></tr>)}</tbody></table></div></section>
 <p className="footnote">การลบบัญชีจะลบผู้ใช้จากระบบ Auth ด้วย ดำเนินการผ่าน API ฝั่งเซิร์ฟเวอร์เท่านั้น</p></main></div>;
}
