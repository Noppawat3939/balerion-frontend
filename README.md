# Salmon Allocation Management System

ระบบ UI สำหรับจัดสรรปลาแซลมอนจาก Supplier/Warehouse ไปยัง Order ของลูกค้า โดย Stock มีจำกัด และแบ่งตาม Business Rules ที่กำหนด

**Live Demo:** https://noppawat3939.github.io/balerion-frontend/

---

## Tech Stack

| ส่วน       | เทคโนโลยี                                      |
| ---------- | ----------------------------------------------- |
| Framework  | React 19 + TypeScript                           |
| Build Tool | Vite + Bun                                      |
| Styling    | Tailwind CSS v4                                 |
| UI Library | shadcn/ui + Radix UI                            |
| Testing    | Vitest (103 unit tests)                         |
| Font       | Kanit (Thai-first typography)                   |

---

## Setup & Run

```bash
# ติดตั้ง dependencies
bun install

# รันแบบ development
bun run dev

# รัน unit tests
bun run test

# build สำหรับ production
bun run build

# วัด performance (benchmark)
bun run benchmark
```

---

## Features

### 1. Auto-Allocation (ทำงานทันทีเมื่อโหลดหน้า)

ระบบรันอัลกอริทึมจัดสรรโดยอัตโนมัติเมื่อเปิดหน้าเว็บ และแสดงผลในตารางทันที

### 2. Manual Allocation

ผู้ใช้แก้ไข `Allocated Qty` ในแต่ละ row ได้ผ่าน Modal พร้อม validation แบบ real-time:

- ห้ามเกิน remaining stock ที่เหลือ
- ห้ามเกิน remaining credit ของลูกค้า
- Stock และ credit อัปเดตทันทีหลังบันทึก

### 3. Search & Filter (รองรับ 5,000+ orders)

- **Search** — ค้นหาตาม Order ID หรือ Sub Order ID (debounce 300ms)
- **Filter** — กรองตาม Type (EMERGENCY / OVERDUE / DAILY), Customer, Warehouse, Supplier
- **Pagination** — แสดง 100 rows ต่อหน้า เพื่อ performance สูงสุด

### 4. Allocation Summary Dashboard

แสดง summary cards ที่ด้านบน:

- **Sub-orders** — จำนวน sub-orders ทั้งหมด
- **ขอรวม** — หน่วยรวมที่ลูกค้าขอ
- **จัดสรรได้** — หน่วยรวมที่จัดสรรได้จริง
- **Fulfillment Rate** — % ที่จัดสรรได้เทียบกับที่ขอ
- **สถานะการจัดสรร** — Breakdown: ครบ / บางส่วน / ไม่ได้
- **วงเงินต่อลูกค้า** — Credit utilization progress bar ต่อ customer

### 5. Customer Credit Management

Panel ด้านขวาแสดงข้อมูลวงเงินต่อ customer พร้อมปุ่ม Edit:

- แสดง Credit Limit / Used Credit / Remaining Credit
- Progress bar ระบายสี: เขียว < 70%, เหลือง 70–90%, แดง > 90%
- Block บันทึกถ้า credit limit ใหม่ < usedCredit ปัจจุบัน
- Row ที่เกิน credit ใหม่จะถูก highlight ทันทีในตาราง

### 6. Stock Summary Panel

แสดง stock คงเหลือแบบ group by Warehouse → Supplier → Item อัปเดต real-time เมื่อ allocation เปลี่ยน

### 7. Export Allocation Result

ปุ่ม Export CSV / JSON ที่ header — ชื่อไฟล์ `salmon_allocation_YYYY-MM-DD.csv / .json`

Fields ที่ export: Sub Order ID, Item, Warehouse, Supplier, Type, Request Qty, Allocated Qty, Unit Price (฿), Total Price (฿), Customer, Status

### 8. Reset & Re-Allocate

ปุ่ม Reset ที่ header:

- แสดง Confirmation Dialog ก่อน
- Reset stock กลับค่าเริ่มต้น + `usedCredit = 0` ทุก customer
- รัน auto-allocation ใหม่ทั้งหมด
- **ไม่ reset** credit limit ที่ user ปรับไว้

### 9. What-If Simulation

ปุ่ม What-If ที่ header เปิด Simulation Panel:

- ปรับ stock delta ต่อ Warehouse/Supplier/Item ได้
- ปรับ credit limit จำลองต่อ customer ได้
- เพิ่ม order จำลองใหม่ได้ (Item, Qty, Type, Customer)
- กด **Simulate** → รัน auto-allocation ด้วยค่าจำลอง (ไม่กระทบ data จริง)
- แสดง diff table: สีเขียว = ได้มากขึ้น, สีแดง = ได้น้อยลง, สีเทา = ไม่เปลี่ยน
- Summary: Before vs After (total allocated, fulfillment rate %)
- กด **Apply** → นำ simulation ไป apply จริง
- กด **Discard** → ทิ้ง simulation กลับค่าเดิม

---

## Allocation Algorithm

### Priority Sorting

จัดเรียง sub-orders ก่อน allocate ตามลำดับนี้:

1. **Type priority**: `EMERGENCY` → `OVERDUE` → `DAILY`
2. **ภายใน type เดียวกัน**: เรียงตาม `createDate` จากเก่าสุด (FIFO)

ตัวอย่าง:

| Sub Order        | Type      | Create Date | ลำดับ |
| ---------------- | --------- | ----------- | ----- |
| ORDER-0003-001   | OVERDUE   | 2024-12-28  | 1     |
| ORDER-0002-001   | EMERGENCY | 2025-01-03  | 2     |
| ORDER-0002-002   | EMERGENCY | 2025-01-03  | 3     |
| ORDER-0001-001   | DAILY     | 2025-01-01  | 4     |

### Allocation Steps (ต่อ sub-order)

```
1. Resolve wildcard (WH-000 / SP-000)
   - WH-000 → เลือก warehouse ที่ stock เหลือเยอะสุดสำหรับ item + supplier นั้น
   - SP-000 → เลือก supplier ที่ stock เหลือเยอะสุดสำหรับ item + warehouse นั้น
   - ทั้งคู่ wildcard → เลือก combination ที่ stock รวมเยอะสุด

2. คำนวณ allocatedQty = min(requestQty, availableStock, maxQtyByCredit)
   - Partial allocation: ถ้า stock ไม่พอให้เท่าที่มี (ไม่ใช่ all-or-nothing)

3. คำนวณ unitPrice = basePrice × multiplier (ตาม order type)
   - ปัดเศษด้วย Banker's Rounding 2 ตำแหน่ง

4. คำนวณ totalPrice = allocatedQty × unitPrice
   - ปัดเศษด้วย Banker's Rounding

5. หัก availableStock
6. เพิ่ม usedCredit ของ customer
```

### Banker's Rounding

ใช้กับ `unitPrice` และ `totalPrice` (2 ตำแหน่งทศนิยม)

| ค่าเดิม | ผลลัพธ์ | เหตุผล                           |
| ------- | ------- | -------------------------------- |
| 148.185 | 148.18  | ตำแหน่งที่ 3 = 5, เลขคู่ → คงเดิม |
| 148.175 | 148.18  | ตำแหน่งที่ 3 = 5, เลขคี่ → ปัดขึ้น |
| 148.188 | 148.19  | ตำแหน่งที่ 3 > 5 → ปัดขึ้น       |
| 148.122 | 148.12  | ตำแหน่งที่ 3 < 5 → ปัดลง          |

Implementation ใช้ `Intl.NumberFormat` พร้อม `roundingMode: "halfEven"` ซึ่งเป็น standard Banker's Rounding ของ JavaScript:

```ts
export function bankerRound(value: number, decimals = 2) {
  const formatter = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    roundingMode: "halfEven",
    useGrouping: false,
  });
  return parseFloat(formatter.format(value));
}
```

### Credit Limit

```
remainingCredit = creditLimit - usedCredit
maxQtyByCredit  = Math.floor(remainingCredit / unitPrice)
```

เมื่อ allocate สำเร็จ: `usedCredit += totalPrice`

---

## Initiative Features

| Feature                      | รายละเอียด                                                               |
| ---------------------------- | ----------------------------------------------------------------------- |
| **Allocation Summary Dashboard** | Summary cards + breakdown + credit utilization — เห็นภาพรวมทันที       |
| **Export CSV / JSON**            | ส่งออกผลลัพธ์ให้ทีม warehouse / finance ได้เลย                         |
| **Reset & Re-Allocate**          | เริ่ม allocation ใหม่โดยคง credit limit ที่ปรับไว้                      |
| **What-If Simulation**           | ลอง "ถ้า..." ก่อน commit — ปรับ stock/credit/order จำลองโดยไม่กระทบข้อมูลจริง |
| **Customer Credit Management**   | แก้ credit limit ได้ใน UI พร้อม warning เมื่อ allocation เกิน            |

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # PageHeader
│   └── panels/          # AllocationTable, Dashboard, Modals, Panels
├── hooks/               # useAllocation, useWhatIf, useDebounceSearch
├── lib/                 # allocation-engine, helpers, utils
├── mock/                # orders, stocks, prices, customers
├── scripts/             # benchmark.ts
├── styles/              # globals.css (Tailwind + shadcn theme)
└── types/               # TypeScript interfaces
```
