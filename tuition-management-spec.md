# TÀI LIỆU ĐẶC TẢ ỨNG DỤNG QUẢN LÝ HỌC PHÍ DẠY THÊM

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mục tiêu
Xây dựng ứng dụng web quản lý học phí dạy thêm cho giáo viên cá nhân, hỗ trợ:
- Quản lý học sinh theo nhóm/lớp
- Điểm danh và theo dõi buổi học
- Tính toán học phí tự động theo buổi
- Theo dõi công nợ (đã đóng/chưa đóng)
- Responsive trên PC, tablet, điện thoại

### 1.2 Người dùng
- Một người dùng duy nhất (giáo viên)
- Không cần hệ thống đăng nhập phức tạp (có thể dùng PIN đơn giản hoặc không cần)

### 1.3 Công nghệ yêu cầu
- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (local)
- **Build tool**: Vite

---

## 2. CẤU TRÚC DỮ LIỆU (MongoDB Collections)

### 2.1 Collection: `students` (Học sinh)

```javascript
{
  _id: ObjectId,
  name: String,                    // Tên học sinh (required)
  phone: String,                   // SĐT liên hệ (phụ huynh)
  school: String,                  // Trường đang học
  grade: Number,                   // Khối lớp (6, 7, 8, 9...)
  feePerSession: Number,           // Học phí mỗi buổi (VNĐ)
  type: "individual" | "group",    // Loại hình: cá nhân hoặc nhóm
  groupId: ObjectId | null,        // Thuộc nhóm nào (nếu học nhóm)
  notes: String,                   // Ghi chú
  active: Boolean,                 // Còn học hay đã nghỉ
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Collection: `groups` (Nhóm học)

```javascript
{
  _id: ObjectId,
  name: String,                    // Tên nhóm (VD: "Nhóm 7", "Lớp 9A")
  description: String,             // Mô tả
  schedule: [{                     // Lịch học cố định
    dayOfWeek: Number,             // 0=CN, 1=T2, 2=T3...6=T7
    startTime: String,             // "14:00"
    endTime: String,               // "16:00"
    subject: String                // Môn học
  }],
  defaultFeePerSession: Number,    // Học phí mặc định cho nhóm
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 Collection: `sessions` (Buổi học)

```javascript
{
  _id: ObjectId,
  date: Date,                      // Ngày học
  startTime: String,               // Giờ bắt đầu
  endTime: String,                 // Giờ kết thúc
  groupId: ObjectId | null,        // Buổi học nhóm
  studentIds: [ObjectId],          // Danh sách học sinh tham gia
  type: "scheduled" | "makeup",    // Lịch cố định hoặc học bù
  subject: String,                 // Môn học
  notes: String,                   // Ghi chú (lý do học bù...)
  attendance: [{                   // Điểm danh
    studentId: ObjectId,
    status: "present" | "absent" | "late" | "excused",
    note: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 2.4 Collection: `payments` (Thanh toán)

```javascript
{
  _id: ObjectId,
  studentId: ObjectId,             // Học sinh
  amount: Number,                  // Số tiền đóng
  paymentDate: Date,               // Ngày đóng
  periodStart: Date,               // Đóng cho kỳ từ ngày
  periodEnd: Date,                 // Đến ngày
  sessionsCount: Number,           // Số buổi đã tính
  method: "cash" | "transfer",     // Hình thức thanh toán
  notes: String,
  createdAt: Date
}
```

### 2.5 Collection: `settings` (Cài đặt)

```javascript
{
  _id: ObjectId,
  key: String,                     // Tên cài đặt
  value: Mixed                     // Giá trị
}

// Các cài đặt mặc định:
// - defaultFeePerSession: 200000
// - currency: "VNĐ"
// - reminderDays: 5 (nhắc đóng tiền trước x ngày)
```

---

## 3. GIAO DIỆN NGƯỜI DÙNG

### 3.1 Layout chính

```
┌─────────────────────────────────────────────────────────┐
│  LOGO    Quản lý học phí           [≡ Menu / Sidebar]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              NỘI DUNG CHÍNH                      │   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Dashboard] [Học sinh] [Nhóm] [Điểm danh] [Học phí]   │  <- Mobile: Bottom nav
└─────────────────────────────────────────────────────────┘
```

### 3.2 Các màn hình chính

#### A. Dashboard (Trang chủ)
- Thống kê tổng quan:
  - Tổng học sinh đang học
  - Tổng buổi học trong tháng
  - Tổng thu trong tháng
  - Công nợ chưa thu
- Lịch học hôm nay/tuần này
- Danh sách học sinh cần nhắc đóng tiền
- Biểu đồ thu nhập theo tháng (6 tháng gần nhất)

#### B. Quản lý Học sinh
- Danh sách học sinh (table với search, filter theo nhóm/lớp/trạng thái)
- Form thêm/sửa học sinh
- Chi tiết học sinh:
  - Thông tin cá nhân
  - Lịch sử điểm danh
  - Lịch sử thanh toán
  - Công nợ hiện tại

#### C. Quản lý Nhóm
- Danh sách nhóm học
- Form thêm/sửa nhóm (kèm lịch học)
- Chi tiết nhóm:
  - Danh sách học sinh trong nhóm
  - Lịch học
  - Thêm/xóa học sinh khỏi nhóm

#### D. Điểm danh
- Lịch dạng calendar view (tháng)
- Chọn ngày -> hiển thị các buổi học
- Form điểm danh nhanh:
  - Chọn nhóm/học sinh cá nhân
  - Tick điểm danh (có mặt/vắng/có phép)
- Thêm buổi học bù

#### E. Quản lý Học phí
- Bảng công nợ tổng hợp theo tháng
- Chi tiết từng học sinh:
  - Số buổi đã học (kỳ này)
  - Học phí/buổi
  - Tổng tiền phải đóng
  - Đã đóng
  - Còn nợ
- Form ghi nhận thanh toán
- Xuất báo cáo (PDF/Excel)

#### F. Cài đặt
- Học phí mặc định
- Thông tin giáo viên
- Sao lưu/khôi phục dữ liệu

---

## 4. API ENDPOINTS

### 4.1 Students API

```
GET    /api/students              - Danh sách học sinh (có filter, pagination)
GET    /api/students/:id          - Chi tiết học sinh
POST   /api/students              - Thêm học sinh
PUT    /api/students/:id          - Cập nhật học sinh
DELETE /api/students/:id          - Xóa học sinh (soft delete -> active=false)
GET    /api/students/:id/sessions - Lịch sử buổi học của học sinh
GET    /api/students/:id/payments - Lịch sử thanh toán của học sinh
GET    /api/students/:id/balance  - Công nợ hiện tại
```

### 4.2 Groups API

```
GET    /api/groups                - Danh sách nhóm
GET    /api/groups/:id            - Chi tiết nhóm
POST   /api/groups                - Thêm nhóm
PUT    /api/groups/:id            - Cập nhật nhóm
DELETE /api/groups/:id            - Xóa nhóm
GET    /api/groups/:id/students   - Danh sách học sinh trong nhóm
POST   /api/groups/:id/students   - Thêm học sinh vào nhóm
DELETE /api/groups/:id/students/:studentId - Xóa học sinh khỏi nhóm
```

### 4.3 Sessions API

```
GET    /api/sessions              - Danh sách buổi học (filter theo ngày, nhóm)
GET    /api/sessions/:id          - Chi tiết buổi học
POST   /api/sessions              - Tạo buổi học mới
PUT    /api/sessions/:id          - Cập nhật buổi học
DELETE /api/sessions/:id          - Xóa buổi học
POST   /api/sessions/:id/attendance - Điểm danh buổi học
GET    /api/sessions/calendar     - Lấy data cho calendar view
POST   /api/sessions/generate     - Tự động tạo buổi học theo lịch cố định
```

### 4.4 Payments API

```
GET    /api/payments              - Danh sách thanh toán
GET    /api/payments/:id          - Chi tiết thanh toán
POST   /api/payments              - Ghi nhận thanh toán mới
PUT    /api/payments/:id          - Cập nhật thanh toán
DELETE /api/payments/:id          - Xóa thanh toán
```

### 4.5 Reports API

```
GET    /api/reports/summary       - Thống kê tổng quan
GET    /api/reports/monthly       - Báo cáo theo tháng
GET    /api/reports/student/:id   - Báo cáo chi tiết học sinh
GET    /api/reports/balance       - Bảng công nợ tổng hợp
GET    /api/reports/export        - Xuất báo cáo (PDF/Excel)
```

### 4.6 Settings API

```
GET    /api/settings              - Lấy tất cả cài đặt
PUT    /api/settings              - Cập nhật cài đặt
POST   /api/backup                - Tạo bản sao lưu
POST   /api/restore               - Khôi phục dữ liệu
```

---

## 5. LOGIC TÍNH TOÁN HỌC PHÍ

### 5.1 Công thức tính tiền

```javascript
// Tính học phí cho một học sinh trong một khoảng thời gian
function calculateFee(studentId, startDate, endDate) {
  // 1. Lấy tất cả buổi học mà học sinh có mặt trong khoảng thời gian
  const sessions = getAttendedSessions(studentId, startDate, endDate);
  
  // 2. Lấy học phí/buổi của học sinh
  const student = getStudent(studentId);
  const feePerSession = student.feePerSession;
  
  // 3. Tính tổng
  const totalSessions = sessions.length;
  const totalFee = totalSessions * feePerSession;
  
  return {
    sessions: totalSessions,
    feePerSession: feePerSession,
    totalFee: totalFee
  };
}
```

### 5.2 Tính công nợ

```javascript
// Tính công nợ hiện tại của học sinh
function calculateBalance(studentId) {
  // 1. Tổng tiền phải đóng (tất cả buổi đã học và có mặt)
  const totalFee = calculateTotalFee(studentId);
  
  // 2. Tổng tiền đã đóng
  const totalPaid = getTotalPayments(studentId);
  
  // 3. Công nợ = Phải đóng - Đã đóng
  const balance = totalFee - totalPaid;
  
  return {
    totalFee: totalFee,
    totalPaid: totalPaid,
    balance: balance,  // Dương = còn nợ, Âm = đóng dư
    status: balance > 0 ? "debt" : balance < 0 ? "credit" : "paid"
  };
}
```

### 5.3 Trạng thái điểm danh

- `present`: Có mặt -> Tính tiền
- `absent`: Vắng không phép -> Tính tiền (tùy cài đặt)
- `late`: Đi muộn -> Tính tiền
- `excused`: Vắng có phép -> Không tính tiền

---

## 6. CẤU TRÚC THƯ MỤC DỰ ÁN

```
tuition-management/
├── client/                     # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/         # UI Components
│   │   │   ├── common/         # Button, Input, Modal, Table...
│   │   │   ├── layout/         # Header, Sidebar, BottomNav
│   │   │   ├── students/       # Student-related components
│   │   │   ├── groups/         # Group-related components
│   │   │   ├── sessions/       # Session/Attendance components
│   │   │   ├── payments/       # Payment components
│   │   │   └── dashboard/      # Dashboard widgets
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API calls
│   │   ├── store/              # State management (Zustand/Context)
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helper functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                     # Backend Node.js
│   ├── src/
│   │   ├── config/             # DB config, env config
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Error handling, validation
│   │   ├── utils/              # Helper functions
│   │   └── index.ts            # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml          # MongoDB container
├── package.json                # Root package.json (scripts)
└── README.md
```

---

## 7. YÊU CẦU GIAO DIỆN CHI TIẾT

### 7.1 Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px    /* Điện thoại lớn */
md: 768px    /* Tablet */
lg: 1024px   /* Laptop */
xl: 1280px   /* Desktop */
```

### 7.2 Màu sắc (Color Palette)

```css
/* Primary - Blue */
primary-50:  #eff6ff
primary-500: #3b82f6
primary-600: #2563eb
primary-700: #1d4ed8

/* Success - Green */
success-500: #22c55e

/* Warning - Yellow */
warning-500: #eab308

/* Danger - Red */
danger-500: #ef4444

/* Neutral - Gray */
gray-50:  #f9fafb
gray-100: #f3f4f6
gray-500: #6b7280
gray-900: #111827
```

### 7.3 Components cần thiết

**Common:**
- Button (primary, secondary, danger, ghost)
- Input (text, number, date, select)
- Modal
- Table (sortable, pagination)
- Card
- Badge/Tag
- Loading spinner
- Toast notifications
- Empty state
- Confirm dialog

**Layout:**
- Header với menu hamburger (mobile)
- Sidebar (desktop) / Bottom nav (mobile)
- Breadcrumb
- Page title

**Specific:**
- Calendar (month view với dots đánh dấu ngày có lịch)
- StudentCard
- GroupCard
- AttendanceCheckbox
- PaymentForm
- BalanceDisplay
- StatCard (cho dashboard)
- Chart (bar/line cho thống kê)

---

## 8. LUỒNG SỬ DỤNG CHÍNH

### 8.1 Thêm học sinh mới

```
1. Vào trang Học sinh
2. Click "Thêm học sinh"
3. Nhập thông tin:
   - Tên (bắt buộc)
   - SĐT phụ huynh
   - Trường/Lớp
   - Loại hình (cá nhân/nhóm)
   - Nếu nhóm -> chọn nhóm
   - Học phí/buổi
4. Lưu
```

### 8.2 Tạo nhóm học mới

```
1. Vào trang Nhóm
2. Click "Thêm nhóm"
3. Nhập thông tin:
   - Tên nhóm
   - Lịch học (chọn ngày trong tuần + giờ)
   - Học phí mặc định
4. Lưu
5. Thêm học sinh vào nhóm
```

### 8.3 Điểm danh

```
1. Vào trang Điểm danh
2. Chọn ngày trên calendar
3. Hiển thị các buổi học trong ngày
   - Nếu chưa có -> tạo buổi mới hoặc tự động từ lịch cố định
4. Tick điểm danh cho từng học sinh
5. Lưu
```

### 8.4 Tính và thu học phí

```
1. Vào trang Học phí
2. Chọn kỳ tính (tháng hoặc tùy chỉnh ngày)
3. Xem bảng tổng hợp:
   - Mỗi dòng = 1 học sinh
   - Cột: Tên | Số buổi | Đơn giá | Thành tiền | Đã đóng | Còn nợ
4. Click vào học sinh để xem chi tiết
5. Click "Ghi nhận thanh toán" để nhập số tiền đã đóng
```

### 8.5 Thêm buổi học bù

```
1. Vào trang Điểm danh
2. Click "Thêm buổi học"
3. Chọn loại: "Học bù"
4. Chọn ngày, giờ
5. Chọn nhóm hoặc học sinh
6. Ghi chú lý do (bù cho ngày nào, lý do nghỉ)
7. Lưu
```

---

## 9. TÍNH NĂNG BỔ SUNG (Phase 2)

- [ ] Gửi thông báo nhắc đóng tiền (SMS/Zalo integration)
- [ ] In phiếu thu
- [ ] Thống kê theo môn học
- [ ] Quản lý nhiều giáo viên
- [ ] Đồng bộ cloud (MongoDB Atlas)
- [ ] PWA (Progressive Web App) - offline support
- [ ] Dark mode

---

## 10. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY

### 10.1 Yêu cầu hệ thống

- Node.js >= 18
- MongoDB >= 6.0 (local hoặc Docker)
- npm hoặc yarn

### 10.2 Cài đặt

```bash
# Clone project
git clone <repo>
cd tuition-management

# Cài đặt dependencies
npm install

# Chạy MongoDB (Docker)
docker-compose up -d

# Chạy development
npm run dev

# Build production
npm run build
```

### 10.3 Environment Variables

```env
# Server
PORT=3001
MONGODB_URI=mongodb://localhost:27017/tuition-management
NODE_ENV=development

# Client
VITE_API_URL=http://localhost:3001/api
```

---

## 11. GHI CHÚ CHO DEVELOPER

### 11.1 Ưu tiên khi code

1. **Mobile-first**: Thiết kế cho mobile trước, sau đó responsive lên tablet/desktop
2. **Simple UX**: Giáo viên cần thao tác nhanh, ít click
3. **Data integrity**: Validate kỹ, không để mất dữ liệu
4. **Performance**: Pagination, lazy loading cho danh sách dài

### 11.2 Conventions

- Tên biến/hàm: camelCase
- Tên component: PascalCase
- Tên file component: PascalCase.tsx
- Tên file khác: kebab-case.ts
- API response format: `{ success: boolean, data?: any, error?: string }`

### 11.3 Testing

- Unit test cho business logic (tính tiền, công nợ)
- Integration test cho API
- E2E test cho các luồng chính

---

## 12. SAMPLE DATA

### Học sinh mẫu

```javascript
[
  { name: "Nguyễn Văn An", grade: 9, feePerSession: 200000, type: "group" },
  { name: "Trần Thị Bình", grade: 8, feePerSession: 250000, type: "individual" },
  { name: "Lê Văn Cường", grade: 7, feePerSession: 200000, type: "group" },
  // ...
]
```

### Nhóm mẫu

```javascript
[
  {
    name: "Nhóm 9",
    schedule: [
      { dayOfWeek: 2, startTime: "14:00", endTime: "16:00", subject: "Toán" },
      { dayOfWeek: 5, startTime: "14:00", endTime: "16:00", subject: "Toán" }
    ],
    defaultFeePerSession: 200000
  },
  // ...
]
```

---

**END OF SPECIFICATION DOCUMENT**

Version: 1.0
Last updated: 2026-01-10
