# PAYPREMINIQ

**PAYPREMINIQ – Smart Payment Intelligence**

ระบบจัดการสัญญาผ่อนชำระและติดตามการชำระเงิน โดยคงโครงสร้างหน้าจอ ปุ่ม เมนู ฟอร์ม ฟังก์ชัน และโครงสร้างข้อมูลเดิมของ PAYPREMINIQ เป็นหลัก

## โครงสร้างปัจจุบัน

```text
PAYPREMINIQ/
├── index.html
├── style.css
├── app.js
├── build.json
├── manifest.json
├── sw.js
├── icon-192.png
├── icon-512.png
└── products/
    ├── redmi-watch-5-lite.png
    ├── soundcore-r60i-nc.png
    └── vivo-v70.png
```

## ระบบหลัก

- LocalStorage สำหรับข้อมูล PAYPREMINIQ บนอุปกรณ์
- ระบบ recovery สำหรับช่วยกู้คืนข้อมูลก่อนหน้า
- Firebase Authentication และ Firestore สำหรับ Cloud
- PWA / Service Worker สำหรับการเปิดใช้งานแบบ standalone และการอัปเดตไฟล์
- ระบบ Import / Export ข้อมูล
- ระบบคำนวณและติดตามงวดชำระตามโครงสร้างข้อมูลเดิมของแอป

## Data Safety

- ข้อมูล LocalStorage ที่มีข้อมูลจริงจะไม่ถูกลบเพียงเพราะ Cloud ว่างหรือผิดรูปแบบ
- เมื่อเครื่องว่างแต่ Cloud มีข้อมูล ระบบสามารถกู้ข้อมูลจาก Cloud ลงเครื่อง
- เก็บข้อมูลก่อนหน้าไว้ใน `paypreminiq_recovery` เพื่อช่วยกู้คืนกรณีข้อมูลถูกแทนที่โดยไม่ตั้งใจ
- การซิงก์ Cloud ใช้แนวทาง conservative เพื่อไม่ให้ข้อมูลจากอีกฝั่งถูกเขียนทับโดยอัตโนมัติโดยไม่มีข้อมูล revision รายรายการ

## Firebase

PAYPREMINIQ ใช้ Firebase project ของ PAYPREMINIQ สำหรับ Authentication และ Firestore โดยโหลด Firebase แบบ lazy/background เพื่อไม่ให้การเชื่อมต่อ Cloud ขัดขวางการเปิดแอปและการใช้งาน Local mode

## PWA และการอัปเดต

`build.json` เป็น source of truth ของ build version โดย Service Worker ใช้ build version เพื่อสร้าง cache รุ่นใหม่และลบ cache รุ่นเก่า การอัปเดตไฟล์หลักใช้ network-first และมี fallback จาก cache เมื่อออฟไลน์

## หลักการพัฒนา

- ใช้ `PAYPREMINIQ-main.zip` เป็น Master/Baseline จนกว่าจะมีคำสั่งให้ล็อกเวอร์ชันใหม่
- รักษา UI เดิม สีเดิม และ visual identity เดิม
- ไม่เปลี่ยนโครงสร้างข้อมูลโดยไม่จำเป็น
- ไม่สร้างหน้าจอ ปุ่ม เมนู หรือข้อมูลใหม่แทนของเดิม
- แก้เฉพาะจุดที่จำเป็นต่อความถูกต้อง ความปลอดภัยของข้อมูล และการทำงานของระบบ
