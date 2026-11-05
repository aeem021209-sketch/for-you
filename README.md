# ระบบจัดการใบเสร็จโรงเรียน (Starter สำหรับทดสอบ)

ระบบตัวอย่าง Next.js + Supabase สำหรับ deploy บน Vercel

## ความสามารถในชุดเริ่มต้น
- Login / Logout ด้วย Supabase Auth
- บทบาท ผู้อำนวยการ / การเงิน / แอดมิน
- Dashboard สรุปยอดเงินและจำนวนใบเสร็จ
- ออกใบเสร็จปกติ แก้ไข ลบ และพิมพ์ย้อนหลัง
- ใบเสร็จอิสระ: บันทึกยอด 0 บาท ล็อก ไม่ให้แก้ไข/ลบ และพิมพ์ย้อนหลังได้
- ตั้ง prefix, separator และเลขลำดับใบเสร็จ
- เพิ่ม/แก้ไข/ลบนักเรียน และนำเข้า Excel
- API สำหรับแอดมินสร้างและลบบัญชี Auth

## 1. เตรียม Supabase
1. สร้าง Project ที่ https://supabase.com
2. เปิด SQL Editor แล้วรันไฟล์ `supabase/schema.sql`
3. ไปที่ Project Settings > API แล้วคัดลอก Project URL, anon/public key และ service_role key
4. สร้างผู้ใช้คนแรกจาก Authentication > Users > Add user
5. คัดลอก UUID ของผู้ใช้คนแรก แล้วรัน SQL (แทน UUID และชื่อ):
   ```sql
   insert into public.profiles(id,full_name,role)
   values ('UUID-จาก-auth-users','ผู้ดูแลระบบ','admin');
   ```
6. ปิดการสมัครสมาชิกสาธารณะ (Authentication > Providers > Email > ปิด Allow new users to sign up) เพื่อให้แอดมินเป็นผู้สร้างบัญชีเท่านั้น

## 2. รันทดสอบในเครื่อง
ต้องติดตั้ง Node.js LTS ก่อน จากนั้น:
```bash
npm install
```
คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่า Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
จากนั้น:
```bash
npm run dev
```
เปิด http://localhost:3000

## 3. อัปโหลด GitHub
สร้าง repository ใหม่ แล้วรัน:
```bash
git init
git add .
git commit -m "Initial school receipt system"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```
ห้ามอัปโหลด `.env.local` หรือเปิดเผย `SUPABASE_SERVICE_ROLE_KEY`

## 4. Deploy Vercel
1. เข้า https://vercel.com แล้ว Import Git Repository
2. ตั้ง Environment Variables ให้ครบทั้ง 3 ตัวจาก `.env.local`
3. กด Deploy
4. เพิ่ม URL ของเว็บ Vercel ใน Supabase > Authentication > URL Configuration > Site URL และ Redirect URLs

## 5. รูปแบบ Excel
หัวคอลัมน์ที่รองรับ:
- `รหัสนักเรียน` หรือ `student_code`
- `ชื่อ-นามสกุล` หรือ `full_name`
- `ระดับชั้น` หรือ `grade_level`
- `ห้อง` หรือ `classroom`
- `ปีการศึกษา` หรือ `academic_year`

## ข้อควรทราบก่อนใช้ข้อมูลจริง
นี่เป็นต้นแบบสำหรับทดสอบ ไม่ใช่ระบบบัญชีที่ผ่านการตรวจสอบ/รับรองสำหรับใช้เงินจริง:
- ควรเพิ่มระบบเลขที่ใบเสร็จแบบ atomic transaction เพื่อป้องกันเลขซ้ำเมื่อมีหลายคนออกใบเสร็จพร้อมกัน
- ควรเก็บ audit log ทุกการแก้ไข/ลบ และพิจารณาใช้การยกเลิกแบบมีเหตุผลแทนการลบรายการจริง
- ควรทดสอบ RLS และสิทธิ์ทุกบทบาทด้วยบัญชีแยกก่อนใช้งานจริง
- การตั้งค่าโรงเรียน (ชื่อ ที่อยู่ เลขผู้เสียภาษี โลโก้ ลายเซ็น) และรูปแบบใบเสร็จยังเป็นข้อมูลตัวอย่าง ต้องปรับตามโรงเรียน
- Dashboard ในชุดนี้เป็นสรุปพื้นฐาน ยังไม่ใช่รายงานกรองวัน/เดือน/ปีแบบละเอียด
- สถานะ `registered` เป็นช่องข้อมูลที่ต้องปรับวิธีเปลี่ยนสถานะให้ตรงกับนิยาม “ลงทะเบียน” ของโรงเรียน

## หมายเหตุทางเทคนิค
ชุดนี้เป็น starter ที่ให้เห็น flow หลักครบพอสำหรับเริ่มทดสอบและพัฒนาต่อ ควรทดสอบ build และนโยบาย RLS บน Supabase project ของคุณก่อนนำไป deploy
