# TMail Web

หน้าเว็บให้ลูกค้ากรอกอีเมลที่มีอยู่แล้ว เพื่อเข้าดูกล่องจดหมายและคัดลอกรหัสยืนยันจาก iQIYI, WeTV และ Disney+ เว็บเรียก TMail API ของ `tmp.accinw.com` ผ่านฝั่ง server (Next.js) เพื่อไม่ให้ API key หลุดไปถึงเบราว์เซอร์

**Flow:** กรอกอีเมล → Access Inbox → รออีเมล (รีเฟรชอัตโนมัติ) → อ่าน → คัดลอกรหัส

หน้าเว็บไม่มีการสร้าง สุ่ม หรือเลือกโดเมนของอีเมล

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # แล้วใส่ TMAIL_API_KEY
npm run dev                  # http://localhost:3000
```

Production: `npm run build && npm start` แล้วตั้งค่าตัวแปรใน `.env.example` บนเซิร์ฟเวอร์ที่ใช้รัน

ลิงก์ตรงเข้ากล่องจดหมาย: `https://<เว็บ>/?email=customer@accinw.com` ส่งให้ลูกค้าได้เลย ลูกค้าไม่ต้องพิมพ์อีเมลเอง

## ตัวแปร environment

| ตัวแปร | จำเป็น | ความหมาย |
|---|---|---|
| `TMAIL_BASE_URL` | ✓ | URL ของเซิร์ฟเวอร์ TMail เช่น `https://tmp.accinw.com` |
| `TMAIL_DOMAIN` | ✓ | โดเมนหลักของระบบ |
| `TMAIL_API_KEY` | ✓ | API key ที่ตั้งไว้ในหน้า Admin ของ TMail |
| `TMAIL_TIMEOUT_MS` | | เวลารอสูงสุดต่อ request (ค่าเริ่มต้น 10000) |
| `TMAIL_DEBUG` | | `true` = log ทุก request (ค่าเริ่มต้น: เปิดตอน dev, ปิดตอน production) |

## โครงสร้าง

```
src/lib/tmail/        API client ฝั่ง server (ไม่ได้แก้ในรอบ redesign)
  config.ts           อ่านค่าจาก env — ที่เดียวที่รู้ URL และ key
  client.ts           listDomains / createEmail / fetchMessages / deleteMessage
  validate.ts         ตรวจสอบ response ก่อนนำไปใช้
  errors.ts, logger.ts, http.ts
src/app/api/          route ฝั่ง server
  domains             GET    → { domains, defaultDomain }   ใช้ตรวจว่าอีเมลที่กรอกอยู่ในโดเมนที่รองรับ
  email               POST   (มีอยู่ แต่หน้าเว็บไม่เรียกใช้แล้ว)
  messages            GET    ?email= → { messages }
  messages/[id]       DELETE → { ok: true }
src/lib/
  copy.ts             ข้อความทุกจุดในหน้าเว็บ (ภาษาอังกฤษ)
  services.ts         รายชื่อบริการที่รองรับ + จับคู่จากอีเมลผู้ส่ง
  otp.ts              ตรวจหารหัสยืนยันในอีเมล
  route.ts            อีเมลที่เปิดอยู่เก็บใน URL (?email=) — รีเฟรช/บุ๊กมาร์ก/ปุ่ม Back ใช้ได้
src/hooks/use-inbox.ts  สถานะกล่องจดหมาย: รีเฟรชอัตโนมัติ, อีเมลใหม่, อ่านแล้ว/ยังไม่อ่าน, ลบ
src/components/
  app.tsx             สลับหน้า Landing ⇄ Inbox ตาม URL
  landing.tsx         หน้ากรอกอีเมล + บริการที่รองรับ
  inbox-screen.tsx    หัวกล่องจดหมาย (อีเมล, Copy email, unread, สถานะ) + รายการ + หน้าอ่าน
  inbox.tsx           รายการอีเมล (โลโก้บริการ, รหัสพร้อมปุ่ม Copy) + สถานะว่าง/โหลด/ผิดพลาด
  message-view.tsx    หน้าอ่านอีเมล + แผงรหัสยืนยัน
  email-frame.tsx     แสดงเนื้อหาอีเมลใน iframe ที่ปิดการรันสคริปต์
  ui/                 ปุ่ม, ปุ่มคัดลอก, การแจ้งเตือน, หน้าต่างยืนยัน, โลโก้บริการ, ภาพ SVG
```

- สีทั้งหมดอยู่ใน `src/app/globals.css` (มีโหมดมืดในตัว) ถ้าจะเปลี่ยนสีหลักให้แก้ `--accent` ที่เดียว
- โลโก้บริการเป็นตัวอักษรย่อบนพื้นสีของแบรนด์ (`ui/service-logo.tsx`) ถ้ามีไฟล์โลโก้ทางการ เปลี่ยนแทนได้ที่ไฟล์นั้น
- กล่องจดหมายแสดง **เฉพาะอีเมลจากบริการใน `SERVICES`** (`src/lib/services.ts`) อีเมลจากผู้ส่งอื่น เช่น Netflix จะถูกซ่อน ไม่นับเป็นยังไม่อ่าน และไม่แจ้งเตือน (กรองที่หน้าเว็บ API ยังส่งมาครบ)
- เพิ่มบริการใหม่: เพิ่มรายการใน `SERVICES` และกำหนดสีใน `ui/service-logo.tsx`

## สิ่งที่ควรรู้เกี่ยวกับ TMail API

- API ไม่มีข้อมูลเวลาหมดอายุของกล่องจดหมาย หน้าเว็บจึงไม่ได้แสดงเวลาที่เหลือ
- ลบข้อความด้วย ID ที่ไม่มีอยู่จริง เซิร์ฟเวอร์จะตอบ HTTP 500
- เซิร์ฟเวอร์จำกัด **60 request/นาที ต่อ IP** ผู้ใช้ทุกคนเรียกผ่าน IP เดียวกันของเซิร์ฟเวอร์เว็บนี้ และหน้าเว็บรีเฟรชกล่องจดหมายทุก 10 วินาที (6 ครั้ง/นาที ต่อคน) จึงรองรับผู้ใช้เปิดหน้าเว็บพร้อมกันได้ไม่เกินราว 10 คน ถ้าต้องการมากกว่านี้ ให้เพิ่มลิมิตหรือยกเว้น IP ของเซิร์ฟเวอร์เว็บในฝั่ง TMail
