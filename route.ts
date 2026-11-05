import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const adminClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function isAdmin(){
  const cookieStore=await cookies();
  const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    cookies:{getAll(){return cookieStore.getAll();},setAll(){/* API route: no cookie mutation needed */}}
  });
  const {data:{user}}=await client.auth.getUser();
  if(!user)return false;
  const {data}=await adminClient().from("profiles").select("role").eq("id",user.id).single();
  return data?.role==="admin";
}

export async function POST(req:Request){
  if(!await isAdmin())return NextResponse.json({error:"ไม่มีสิทธิ์ใช้งาน"},{status:403});
  const {email,password,full_name,role}=await req.json();
  if(!email||!password||password.length<8||!full_name||!["director","finance","admin"].includes(role))
    return NextResponse.json({error:"กรุณากรอกข้อมูลให้ครบ และรหัสผ่านอย่างน้อย 8 ตัว"},{status:400});
  const admin=adminClient();
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name}});
  if(error)return NextResponse.json({error:error.message},{status:400});
  const {error:profileError}=await admin.from("profiles").upsert({id:data.user.id,full_name,role,active:true});
  if(profileError){await admin.auth.admin.deleteUser(data.user.id);return NextResponse.json({error:profileError.message},{status:400});}
  return NextResponse.json({ok:true});
}

export async function DELETE(req:Request){
  if(!await isAdmin())return NextResponse.json({error:"ไม่มีสิทธิ์ใช้งาน"},{status:403});
  const id=new URL(req.url).searchParams.get("id");
  if(!id)return NextResponse.json({error:"ไม่พบรหัสผู้ใช้"},{status:400});
  const admin=adminClient();
  const {error}=await admin.auth.admin.deleteUser(id);
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
}
