# TMail Web

หน้าเว็บให้ลูกค้ากรอกอีเมลที่มีอยู่แล้ว เพื่อเข้าดูกล่องจดหมายและคัดลอกรหัสยืนยันจาก iQIYI, WeTV และ Disney+ เว็บเรียก TMail API ของ `tmp.accinw.com` ผ่านฝั่ง server (Next.js) เพื่อไม่ให้ API key หลุดไปถึงเบราว์เซอร์

**Flow:** กรอกอีเมล → Access Inbox → รออีเมล (รีเฟรชอัตโนมัติ) → อ่าน → คัดลอกรหัส

ระบบไม่มีการสร้าง สุ่ม หรือเลือกโดเมนของอีเมล ทั้งในหน้าเว็บและใน API

## เริ่มใช้งานในเครื่อง

```bash
npm install
cp .env.example .env.local   # แล้วใส่ TMAIL_API_KEY
npm run dev                  # http://localhost:3000
```

ลิงก์ตรงเข้ากล่องจดหมาย: `https://<เว็บ>/?email=customer@accinw.com` ส่งให้ลูกค้าได้เลย ลูกค้าไม่ต้องพิมพ์อีเมลเอง

## Deploy บน Vercel

1. ที่ [vercel.com/new](https://vercel.com/new) เลือก **Import** repo `SPWMRK/tmail-services` (Vercel จะตรวจเจอว่าเป็น Next.js เอง ไม่ต้องตั้ง build command)
2. ก่อนกด Deploy เปิด **Environment Variables** แล้วใส่:

   | Key | Value |
   |---|---|
   | `TMAIL_BASE_URL` | `https://tmp.accinw.com` |
   | `TMAIL_DOMAIN` | `accinw.com` |
   | `TMAIL_API_KEY` | API key จากหน้า Admin ของ TMail |

3. กด **Deploy** หลังจากนั้นทุกครั้งที่ push ขึ้น `main` Vercel จะ deploy ให้อัตโนมัติ
4. ถ้าแก้ environment variable ทีหลัง ต้องกด **Redeploy** ค่าใหม่ถึงจะมีผล

`vercel.json` ตั้ง function ให้รันที่ **สิงคโปร์ (`sin1`)** เพราะใกล้เซิร์ฟเวอร์ TMail ที่อยู่กรุงเทพฯ ที่สุด

## ตัวแปร environment

| ตัวแปร | จำเป็น | ความหมาย |
|---|---|---|
| `TMAIL_BASE_URL` | ✓ | URL ของเซิร์ฟเวอร์ TMail เช่น `https://tmp.accinw.com` |
| `TMAIL_DOMAIN` | ✓ | โดเมนหลักของระบบ |
| `TMAIL_API_KEY` | ✓ | API key ที่ตั้งไว้ในหน้า Admin ของ TMail |
| `TMAIL_TIMEOUT_MS` | | เวลารอสูงสุดต่อ request (ค่าเริ่มต้น 10000) |
| `TMAIL_DEBUG` | | `true` = log ทุก request (ค่าเริ่มต้น: เปิดตอน dev, ปิดตอน production) |

## กฎที่ server บังคับใช้

อยู่ที่ `src/lib/tmail/inbox.ts` บังคับทุก request ไม่ว่าจะเรียกผ่านหน้าเว็บหรือเรียก API ตรงๆ:

1. อีเมลต้องอยู่ในโดเมนที่ TMail รองรับ (ดึงรายชื่อโดเมนจาก TMail แล้ว cache ไว้ 10 นาที) อีเมลโดเมนอื่นได้ 404
2. ส่งออกเฉพาะอีเมลจากบริการใน `SERVICES` (`src/lib/services.ts`) อีเมลจากผู้ส่งอื่น เช่น Netflix จะไม่ถูกส่งออกจาก server เลย
3. การลบต้องระบุกล่อง (`?email=`) และอีเมลที่จะลบต้องอยู่ในกล่องนั้นจริง ป้องกันการไล่ลบอีเมลของคนอื่นด้วยเลข ID

นอกจากนี้ยังตั้ง security headers ไว้ใน `next.config.ts`:
- `Referrer-Policy: no-referrer` เพื่อไม่ให้ `?email=` หลุดไปเว็บอื่น
- กันไม่ให้เว็บอื่นฝังหน้าเราใน iframe
- หน้าที่มี `?email=` ได้ `noindex` จะได้ไม่ถูก search engine เก็บไป

## API routes

| Route | ผลลัพธ์ |
|---|---|
| `GET /api/domains` | `{ domains, defaultDomain }` |
| `GET /api/messages?email=` | `{ messages }` เฉพาะบริการที่รองรับ |
| `DELETE /api/messages/:id?email=` | `{ ok: true }` |

## โครงสร้าง

```
src/lib/tmail/        ฝั่ง server เท่านั้น
  config.ts           อ่านค่าจาก env — ที่เดียวที่รู้ URL และ key
  client.ts           listDomains / createEmail / fetchMessages / deleteMessage (createEmail ไม่ได้เปิดเป็น route)
  inbox.ts            กฎของกล่องจดหมาย (โดเมน, บริการที่รองรับ, สิทธิ์ลบ)
  validate.ts         ตรวจสอบ response ก่อนนำไปใช้
  errors.ts, logger.ts (ปิดบัง API key ใน log), http.ts
src/lib/
  copy.ts             ข้อความทุกจุดในหน้าเว็บ (ภาษาอังกฤษ)
  services.ts         รายชื่อบริการที่รองรับ + จับคู่จากอีเมลผู้ส่ง (ใช้ทั้ง server และหน้าเว็บ)
  otp.ts              ตรวจหารหัสยืนยันในอีเมล
  route.ts            อีเมลที่เปิดอยู่เก็บใน URL (?email=) — รีเฟรช/บุ๊กมาร์ก/ปุ่ม Back ใช้ได้
src/hooks/use-inbox.ts  สถานะกล่องจดหมาย: รีเฟรชอัตโนมัติ, อีเมลใหม่, อ่านแล้ว/ยังไม่อ่าน, ลบ
src/components/       หน้า Landing, กล่องจดหมาย, หน้าอ่านอีเมล + ui/
```

- สีทั้งหมดอยู่ใน `src/app/globals.css` (มีโหมดมืดในตัว) ถ้าจะเปลี่ยนสีหลักให้แก้ `--accent` ที่เดียว
- โลโก้บริการเป็นตัวอักษรย่อบนพื้นสีของแบรนด์ (`ui/service-logo.tsx`) ถ้ามีไฟล์โลโก้ทางการ เปลี่ยนแทนได้ที่ไฟล์นั้น
- เพิ่มบริการใหม่: เพิ่มรายการใน `SERVICES` และกำหนดสีใน `ui/service-logo.tsx`

## สิ่งที่ควรรู้

- **Rate limit ของ TMail:** เซิร์ฟเวอร์ TMail จำกัด 60 request/นาที ต่อ IP และหน้าเว็บรีเฟรชทุก 10 วินาที (6 ครั้ง/นาที ต่อคนที่เปิดหน้าอยู่) บน Vercel คำขอจะออกจาก IP ที่เปลี่ยนไปเรื่อยๆ และใช้ร่วมกันหลาย function จึงยกเว้นด้วย IP ไม่ได้ ถ้ามีลูกค้าเปิดพร้อมกันเยอะ ให้เพิ่มลิมิตของ API ในฝั่ง TMail
- **การเข้าถึงกล่อง:** ใครที่รู้ที่อยู่อีเมลก็เปิดกล่องนั้นได้ เป็นธรรมชาติของระบบนี้ ถ้าแพ็กเกจ Vercel รองรับ แนะนำให้ตั้ง rate limit ที่ Vercel Firewall สำหรับ `/api/*` เพื่อกันการไล่เดาอีเมล
- API ไม่มีข้อมูลเวลาหมดอายุของกล่องจดหมาย หน้าเว็บจึงไม่ได้แสดงเวลาที่เหลือ
- ลบข้อความด้วย ID ที่ไม่มีอยู่จริง TMail จะตอบ HTTP 500
