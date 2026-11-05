"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile, Receipt, Student } from "@/lib/types";

export default function ReceiptsPage() {
  const router=useRouter();
  const [profile,setProfile]=useState<Profile|null>(null);
  const [rows,setRows]=useState<Receipt[]>([]);
  const [students,setStudents]=useState<Student[]>([]);
  const [search,setSearch]=useState("");
  const [prefix,setPrefix]=useState("RC");
  const [symbol,setSymbol]=useState("-");
  const [serial,setSerial]=useState(1);
 const [editing, setEditing] = useState<Receipt | null>(null);
const [showForm, setShowForm] = useState(false);
  const [form,setForm]=useState({student_id:"",payer_name:"",description:"",amount:"",receipt_type:"normal" as "normal"|"independent",receipt_date:new Date().toISOString().slice(0,10)});

  async function load(){
    const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/");return;}
    const {data:p}=await supabase.from("profiles").select("*").eq("id",user.id).single(); setProfile(p);
    const {data:r}=await supabase.from("receipts").select("*").order("created_at",{ascending:false}); setRows(r||[]);
    const {data:s}=await supabase.from("students").select("*").order("full_name"); setStudents(s||[]);
    const {data:settings}=await supabase.from("receipt_settings").select("*").limit(1).maybeSingle();
    if(settings){setPrefix(settings.prefix);setSymbol(settings.separator);setSerial(settings.next_number);}
  }
  useEffect(()=>{load();},[]);
  const canWrite=profile?.role==="finance"||profile?.role==="admin";
  const visible=rows.filter(r=>`${r.receipt_no} ${r.payer_name} ${r.description}`.toLowerCase().includes(search.toLowerCase()));

  function startNew(type:"normal"|"independent"="normal"){
    setEditing(null);setShowForm(true);setForm({student_id:"",payer_name:"",description:type==="independent"?"ใบเสร็จอิสระ (ไม่คิดค่าใช้จ่าย)":"",amount:type==="independent"?"0":"",receipt_type:type,receipt_date:new Date().toISOString().slice(0,10)});
  }
  async function save(e:React.FormEvent){
    e.preventDefault(); if(!canWrite)return;
    const isIndependent=form.receipt_type==="independent";
    const payload={student_id:form.student_id||null,payer_name:form.payer_name,description:form.description,amount:isIndependent?0:Number(form.amount),receipt_date:form.receipt_date,receipt_type:form.receipt_type,locked:isIndependent};
    if(editing){
      if(editing.locked)return alert("ใบเสร็จอิสระไม่สามารถแก้ไขได้");
      const {error}=await supabase.from("receipts").update(payload).eq("id",editing.id);
      if(error)alert(error.message);
    } else {
      const receipt_no=`${prefix}${symbol}${String(serial).padStart(5,"0")}`;
      const {error}=await supabase.from("receipts").insert({...payload,receipt_no});
      if(error)alert(error.message);
      else {
        await supabase.from("receipt_settings").update({next_number:serial+1}).not("id","is","null");
      }
    }
    setEditing(null);setShowForm(false); await load();
  }
  async function edit(r:Receipt){if(r.locked)return;setEditing(r);setShowForm(true);setForm({student_id:r.student_id||"",payer_name:r.payer_name,description:r.description,amount:String(r.amount),receipt_type:r.receipt_type,receipt_date:r.receipt_date});}
  async function remove(r:Receipt){
    if(r.locked)return alert("ใบเสร็จอิสระไม่สามารถยกเลิกหรือลบได้");
    if(!confirm(`ยืนยันลบใบเสร็จ ${r.receipt_no} ?`))return;
    const {error}=await supabase.from("receipts").delete().eq("id",r.id); if(error)alert(error.message); else load();
  }
  function printReceipt(r:Receipt){
    const w=window.open("","_blank","width=800,height=700"); if(!w)return;
    w.document.write(`<html lang="th"><head><title>ใบเสร็จ ${r.receipt_no}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#222}.paper{max-width:650px;margin:auto;border:1px solid #ddd;padding:35px}h2{text-align:center}small{color:#666}.line{border-bottom:1px dashed #aaa;padding:12px 0}.amount{text-align:right;font-size:22px;font-weight:bold;margin-top:30px}@media print{button{display:none}}</style></head><body><div class="paper"><h2>ใบเสร็จรับเงิน</h2><p style="text-align:center">โรงเรียน __________________________</p><p>เลขที่: <b>${r.receipt_no}</b>　 วันที่: ${r.receipt_date}</p><div class="line">ได้รับเงินจาก: ${r.payer_name}</div><div class="line">รายการ: ${r.description}</div><div class="amount">จำนวนเงิน ${Number(r.amount).toLocaleString("th-TH",{minimumFractionDigits:2})} บาท</div><p style="margin-top:65px;text-align:right">ลงชื่อ __________________ ผู้รับเงิน</p><small>พิมพ์จากระบบจัดการใบเสร็จ</small></div><script>window.print()</script></body></html>`);w.document.close();
  }

  return <div className="shell"><aside className="sidebar"><div className="side-brand"><span>฿</span><b>School Receipt</b></div><nav><Link href="/dashboard">▦　ภาพรวม</Link><Link className="active" href="/receipts">▤　จัดการใบเสร็จ</Link><Link href="/students">♙　ข้อมูลนักเรียน</Link>{profile?.role==="admin"&&<Link href="/users">⚙　จัดการผู้ใช้</Link>}</nav><div className="side-bottom"><button className="ghost full" onClick={async()=>{await supabase.auth.signOut();router.replace("/")}}>ออกจากระบบ ↗</button></div></aside>
    <main className="main"><header className="topbar"><div><p className="eyebrow">RECEIPTS</p><h1>จัดการใบเสร็จ</h1></div><span className="role-chip">{profile?.role}</span></header>
      <div className="toolbar"><input className="search" placeholder="ค้นหาเลขที่ใบเสร็จ / ชื่อผู้ชำระ..." value={search} onChange={e=>setSearch(e.target.value)}/>{canWrite&&<><button className="primary" onClick={()=>startNew("normal")}>＋ ออกใบเสร็จ</button><button className="secondary" onClick={()=>startNew("independent")}>＋ ใบเสร็จอิสระ</button></>}</div>
      {canWrite&&<section className="panel settings"><h3>ตั้งค่าเลขที่ใบเสร็จ</h3><div className="settings-row"><label>อักษรนำหน้า<input value={prefix} onChange={e=>setPrefix(e.target.value)}/></label><label>สัญลักษณ์คั่น<input value={symbol} onChange={e=>setSymbol(e.target.value)}/></label><label>เลขลำดับถัดไป<input type="number" min="1" value={serial} onChange={e=>setSerial(Number(e.target.value))}/></label><button className="secondary" onClick={async()=>{const {data}=await supabase.from("receipt_settings").select("id").limit(1).maybeSingle();if(data)await supabase.from("receipt_settings").update({prefix,separator:symbol,next_number:serial}).eq("id",data.id);else await supabase.from("receipt_settings").insert({prefix,separator:symbol,next_number:serial});alert("บันทึกการตั้งค่าแล้ว")}}>บันทึกเลขที่</button></div><small className="muted">ตัวอย่างเลขที่: {prefix}{symbol}{String(serial).padStart(5,"0")}</small></section>}
      {showForm ? <section className="panel"><h3>{editing?"แก้ไขใบเสร็จ":"ออกใบเสร็จใหม่"}</h3><form className="receipt-form" onSubmit={save}><label>ประเภท<select value={form.receipt_type} disabled={!!editing} onChange={e=>setForm({...form,receipt_type:e.target.value as "normal"|"independent",amount:e.target.value==="independent"?"0":form.amount})}><option value="normal">ใบเสร็จปกติ</option><option value="independent">ใบเสร็จอิสระ (ไม่คิดเงิน / ล็อกข้อมูล)</option></select></label><label>นักเรียน (ถ้ามี)<select value={form.student_id} onChange={e=>{const s=students.find(x=>x.id===e.target.value);setForm({...form,student_id:e.target.value,payer_name:s?.full_name||form.payer_name})}}><option value="">ไม่ระบุ / บุคคลทั่วไป</option>{students.map(s=><option key={s.id} value={s.id}>{s.student_code} - {s.full_name}</option>)}</select></label><label>ชื่อผู้ชำระ<input required value={form.payer_name} onChange={e=>setForm({...form,payer_name:e.target.value})}/></label><label>รายการ<input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>จำนวนเงิน (บาท)<input type="number" min="0" step="0.01" required disabled={form.receipt_type==="independent"} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>วันที่ออกใบเสร็จ<input type="date" required value={form.receipt_date} onChange={e=>setForm({...form,receipt_date:e.target.value})}/></label><div className="form-actions"><button className="primary">{editing?"บันทึกการแก้ไข":"บันทึกใบเสร็จ"}</button><button type="button" className="ghost" onClick={()=>{setEditing(null);setShowForm(false);setForm({student_id:"",payer_name:"",description:"",amount:"",receipt_type:"normal",receipt_date:new Date().toISOString().slice(0,10)})}}>ปิด</button></div></form></section>:null}
      <section className="panel"><div className="panel-head"><div><h3>รายการใบเสร็จทั้งหมด</h3><p>ทั้งหมด {visible.length} รายการ</p></div></div><div className="table-wrap"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ผู้ชำระ</th><th>รายการ</th><th>จำนวนเงิน</th><th>ประเภท</th><th>จัดการ</th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><td><b>{r.receipt_no}</b></td><td>{r.receipt_date}</td><td>{r.payer_name}</td><td>{r.description}</td><td>{Number(r.amount).toLocaleString("th-TH",{minimumFractionDigits:2})}</td><td><span className={r.locked?"status locked":"status"}>{r.locked?"อิสระ / ล็อก":"ปกติ"}</span></td><td><div className="actions"><button onClick={()=>printReceipt(r)}>พิมพ์</button>{canWrite&&!r.locked&&<><button onClick={()=>edit(r)}>แก้ไข</button><button className="danger-text" onClick={()=>remove(r)}>ลบ</button></>}</div></td></tr>)}{visible.length===0&&<tr><td colSpan={7} className="empty">ยังไม่มีข้อมูลใบเสร็จ</td></tr>}</tbody></table></div></section>
    </main></div>;
}
