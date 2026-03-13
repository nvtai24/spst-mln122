# 📈 Cung – Cầu Market Simulator

> **Sản phẩm sáng tạo — Môn Kinh tế Chính trị Mác–Lênin**
> Trò chơi mô phỏng thị trường tương tác, giúp người học *trực tiếp trải nghiệm* các quy luật kinh tế thay vì chỉ đọc lý thuyết.

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Concept & Triết lý thiết kế](#concept--triết-lý-thiết-kế)
- [Cơ chế thị trường](#cơ-chế-thị-trường)
- [Tính năng chính](#tính-năng-chính)
- [Chế độ chơi](#chế-độ-chơi)
- [Cách chơi chi tiết](#cách-chơi-chi-tiết)
- [Hệ thống tính điểm](#hệ-thống-tính-điểm)
- [Nội dung lý thuyết tích hợp](#nội-dung-lý-thuyết-tích-hợp)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Công nghệ](#công-nghệ)

---

## Giới thiệu

**Cung – Cầu Market Simulator** là một web game giáo dục xây dựng trên nền tảng React + Chart.js, mô phỏng hoạt động của thị trường hàng hóa theo lý thuyết kinh tế cổ điển và Mác–Lênin.

Thay vì học thuộc lý thuyết về đường cung, đường cầu, điểm cân bằng một cách thụ động, người chơi được đặt vào vai trò **nhà hoạch định chính sách** — trực tiếp kéo thanh trượt, áp đặt chính sách, phản ứng với cú sốc thị trường, và lập tức thấy hậu quả trên đồ thị cập nhật real-time.

---

## Concept & Triết lý thiết kế

### Vấn đề cần giải quyết

Kinh tế Chính trị Mác–Lênin thường được dạy theo hướng **lý thuyết → ghi nhớ → kiểm tra**. Sinh viên đọc định nghĩa "trần giá gây thiếu hàng" nhưng không có cơ hội *cảm nhận* tại sao điều đó xảy ra, cũng không thấy được mối quan hệ nhân quả trực quan giữa chính sách và kết quả.

### Giải pháp

Game tạo ra **vòng phản hồi tức thì (immediate feedback loop)**:

```
Người chơi thay đổi biến số
        ↓
Đồ thị cung/cầu cập nhật ngay lập tức
        ↓
Điểm cân bằng mới hiện ra
        ↓
Thặng dư, tổn thất phúc lợi được tính và hiển thị
        ↓
Người chơi hiểu tại sao, không chỉ biết rằng
```

### Nguyên tắc thiết kế

1. **Trực quan trước, lý thuyết sau** — đồ thị thay đổi trước, giải thích xuất hiện sau
2. **Mọi hành động đều có hậu quả** — không có "phím undo" trong kinh tế thực
3. **Gắn với thực tế Việt Nam** — mỗi khái niệm đều có ví dụ từ lịch sử kinh tế VN
4. **Thách thức tăng dần** — từ tự do khám phá đến nhiệm vụ có áp lực thời gian

---

## Cơ chế thị trường

### Mô hình toán học

Thị trường được mô phỏng bằng hệ phương trình tuyến tính:

| Đường | Phương trình | Ý nghĩa |
|---|---|---|
| Cầu (D) | `P = D_intercept − 0.9 × Q` | Giá cao → lượng cầu giảm |
| Cung (S) | `P = S_intercept + 0.7 × Q` | Giá cao → lượng cung tăng |

**Điểm cân bằng** được tính bằng cách giải hệ phương trình:

```
Q* = (D_intercept − S_intercept) / (0.9 + 0.7)
P* = D_intercept − 0.9 × Q*
```

### Các yếu tố tác động

**D_intercept** (vị trí đường cầu) phụ thuộc:
- Cầu cơ bản (`demandBase`)
- Thu nhập người dân (`income`)
- Sở thích / Xu hướng (`preference`)

**S_intercept** (vị trí đường cung) phụ thuộc:
- Cung cơ bản (`supplyBase`) — tác động nghịch
- Chi phí sản xuất (`cost`) — tác động thuận (chi phí cao → cung giảm)
- Công nghệ / Năng suất (`tech`) — tác động nghịch (tiến bộ → cung tăng)

---

## Tính năng chính

### 1. Đồ thị Cung – Cầu real-time

- Đường Cầu **màu đỏ** — dốc xuống
- Đường Cung **màu xanh lá** — dốc lên
- Điểm cân bằng **chấm vàng** — giao điểm hai đường
- Đường can thiệp (trần/sàn giá) — đường ngang đứt nét
- Toàn bộ cập nhật tức thì, animation mượt 300ms

### 2. Bảng điều chỉnh thị trường (6 slider)

| Slider | Nhóm | Tăng thì... |
|---|---|---|
| Cầu cơ bản | Cầu | Đường D dịch phải → giá và lượng tăng |
| Thu nhập người dân | Cầu | D dịch phải (dân giàu → mua nhiều hơn) |
| Sở thích / Xu hướng | Cầu | D dịch phải (hàng hot, viral) |
| Cung cơ bản | Cung | Đường S dịch phải → giá giảm, lượng tăng |
| Chi phí sản xuất | Cung | S dịch **trái** → giá tăng, lượng giảm ⚠️ |
| Công nghệ / Năng suất | Cung | S dịch phải → giá giảm, lượng tăng ✅ |

### 3. Can thiệp Chính phủ (4 công cụ)

#### 🔴 Trần giá (Price Ceiling)
- Nhà nước quy định **giá tối đa** thấp hơn P*
- Hậu quả: Nhà sản xuất cung ít hơn, người mua muốn nhiều hơn → **thiếu hàng**, chợ đen xuất hiện
- Ví dụ VN: Giá xăng dầu thời bao cấp (1975–1986)

#### 🟢 Sàn giá (Price Floor)
- Nhà nước quy định **giá tối thiểu** cao hơn P*
- Hậu quả: Nhà sản xuất muốn bán nhiều, người mua không mua hết → **dư thừa hàng hóa**
- Ví dụ: Giá sàn thu mua lúa để bảo vệ nông dân

#### 💰 Đánh thuế
- Làm tăng chi phí sản xuất → đường S dịch trái
- Hậu quả: Giá tăng, lượng giao dịch giảm, xuất hiện **tổn thất phúc lợi (DWL)**
- Người mua trả nhiều hơn, người bán nhận ít hơn — cả hai cùng chịu thiệt

#### 🎁 Trợ cấp (Subsidy)
- Nhà nước bù chi phí cho nhà sản xuất → đường S dịch phải
- Hậu quả: Giá giảm, lượng tăng — ngắn hạn có lợi nhưng tốn ngân sách nhà nước
- Ví dụ: Trợ giá điện, trợ cấp nông nghiệp

### 4. Sự kiện ngẫu nhiên (8 loại)

Mô phỏng các cú sốc kinh tế thực tế:

| Sự kiện | Tác động |
|---|---|
| 🌾 Mùa màng thất bát | Cung giảm −20 |
| 🦠 Dịch bệnh bùng phát | Cầu giảm −15 |
| 🚢 Hàng nhập khẩu ồ ạt | Cung tăng +20 |
| 📱 Xu hướng mạng xã hội | Sở thích tăng +25 |
| ⛽ Giá dầu thế giới tăng | Chi phí tăng +20 |
| 🤖 Công nghệ mới ra đời | Năng suất tăng +20 |
| 💵 Tiền lương tăng | Thu nhập tăng +15 |
| 🏭 Nhà máy đóng cửa | Cung giảm −15 |

Ngoài ra có **💥 Khủng hoảng kinh tế** — cú sốc tổng hợp: Cầu −25, Cung −20, Chi phí +30 cùng lúc.

### 5. Nhật ký sự kiện

Ghi lại toàn bộ lịch sử diễn biến thị trường theo thứ tự thời gian, với màu sắc phân biệt sự kiện tốt/xấu.

### 6. Ghi chú lý thuyết động

Góc phải dưới tự động thay đổi nội dung phù hợp với tình trạng can thiệp hiện tại, kèm ví dụ thực tế từ lịch sử kinh tế Việt Nam.

---

## Chế độ chơi

### Chế độ Tự do (Free Mode)

Mặc định khi vào game. Người chơi tự do khám phá, kéo slider, thử các công cụ can thiệp, kích hoạt sự kiện mà không có áp lực thắng/thua. Phù hợp để học và thử nghiệm.

### Chế độ Nhiệm vụ (Mission Mode)

Nhấn nút **🎯 Chế độ Nhiệm vụ** trên thanh tiêu đề để bắt đầu.

Gồm **3 vòng** với độ khó tăng dần:

---

#### 📐 Vòng 1 — Ổn định thị trường
- **Loại:** REACH (đạt ngưỡng)
- **Thời gian:** 50 giây
- **Tình huống:** Thị trường đang rối loạn — cung yếu, chi phí cao, cầu thấp. Điểm phúc lợi chỉ ~30.
- **Mục tiêu:** Đưa điểm phúc lợi lên **≥ 80**
- **Thắng:** Đạt điểm mục tiêu trước khi hết giờ
- **Thua:** Hết 50 giây mà điểm vẫn dưới 80
- **Gợi ý:** Tăng Cung cơ bản + Công nghệ, giảm Chi phí → đường S dịch phải mạnh

---

#### 🏛️ Vòng 2 — Gỡ bỏ can thiệp sai lầm
- **Loại:** REACH (đạt ngưỡng)
- **Thời gian:** 45 giây
- **Tình huống:** Chính phủ đang áp **TRẦN GIÁ** → thị trường thiếu hàng trầm trọng. Điểm phúc lợi rất thấp.
- **Mục tiêu:** Đưa điểm phúc lợi lên **≥ 70**
- **Thắng:** Đạt điểm mục tiêu trước khi hết giờ
- **Thua:** Hết 45 giây mà điểm vẫn dưới 70
- **Gợi ý:** Bỏ trần giá trước → sau đó chọn Trợ cấp để giữ giá thấp mà không gây thiếu hàng

---

#### 🌪️ Vòng 3 — Chống khủng hoảng
- **Loại:** SURVIVE (duy trì liên tục)
- **Thời gian:** 60 giây
- **Tình huống:** Cú sốc kinh tế xấu tự động xảy ra **mỗi 10 giây**. Thị trường biến động không ngừng.
- **Mục tiêu:** Giữ điểm phúc lợi **≥ 55 liên tục** trong suốt 60 giây
- **Thắng:** Sống sót hết 60 giây mà điểm không rơi xuống dưới 55
- **Thua:** Điểm phúc lợi rơi xuống dưới 55 **bất kỳ lúc nào**
- **Gợi ý:** Luôn theo dõi nhật ký sự kiện, phản ứng nhanh — dùng Trợ cấp khi cung giảm, tăng Công nghệ để chống lạm phát chi phí

---

### Bảng xếp hạng cuối

Sau khi hoàn thành 3 vòng (hoặc bỏ qua), game hiển thị màn hình kết quả:

| Số vòng đạt | Xếp hạng | Nhận xét |
|---|---|---|
| 3/3 | **S** 🌟 | Xuất sắc! Bạn là nhà kinh tế tài ba. |
| 2/3 | **A** | Giỏi! Một vòng còn vướng mắc. |
| 1/3 | **B** | Khá! Cần luyện thêm phản ứng thị trường. |
| 0/3 | **C** | Cần cố gắng! Đọc lý thuyết rồi thử lại. |

---

## Cách chơi chi tiết

### Bước 1 — Đọc hiểu màn hình chính

Giao diện chia làm 3 cột:
- **Cột trái:** Chọn sản phẩm + 6 thanh trượt điều chỉnh cung/cầu
- **Cột giữa:** Đồ thị cung/cầu + thông số cân bằng + phúc lợi + nhật ký
- **Cột phải:** Điểm số + can thiệp chính phủ + sự kiện + lý thuyết

### Bước 2 — Chọn sản phẩm thị trường

Có 5 loại thị trường để trải nghiệm các bối cảnh khác nhau:
- 🌾 Gạo
- ⛽ Xăng dầu
- 🏠 Bất động sản
- 📱 Điện thoại
- 👷 Lao động

### Bước 3 — Điều chỉnh thị trường

Kéo các thanh trượt và quan sát:
1. Đường cung/cầu dịch chuyển trên đồ thị
2. Điểm vàng (P\*, Q\*) di chuyển đến vị trí cân bằng mới
3. Thanh CS/PS/DWL thay đổi
4. Điểm phúc lợi cập nhật

### Bước 4 — Thử can thiệp

Nhấn một trong 4 nút can thiệp ở cột phải và quan sát:
- Đường ngang xuất hiện trên đồ thị (trần/sàn giá)
- Trạng thái thị trường thay đổi (thiếu hàng/dư thừa)
- Chợ đen xuất hiện nếu có trần giá
- Ghi chú lý thuyết cập nhật giải thích hậu quả

### Bước 5 — Kích hoạt sự kiện

Nhấn **⚡ Kích hoạt sự kiện** để tạo cú sốc ngẫu nhiên. Thử phản ứng lại bằng cách:
- Điều chỉnh slider để bù đắp
- Dùng công cụ can thiệp phù hợp
- Hoặc quan sát thị trường tự điều chỉnh

### Bước 6 — Chơi Chế độ Nhiệm vụ

1. Nhấn **🎯 Chế độ Nhiệm vụ** trên header
2. Đọc briefing của vòng: tình huống, mục tiêu, gợi ý
3. Nhấn **▶ Bắt đầu** — timer bắt đầu đếm ngược
4. Điều chỉnh thị trường để đạt mục tiêu trước khi hết giờ
5. Xem kết quả và tiếp tục vòng tiếp theo

---

## Hệ thống tính điểm

### Công thức

```
Điểm phúc lợi = (CS + PS − DWL × 3) / (CS + PS) × 100
```

Trong đó:
- **CS (Consumer Surplus)** = `0.5 × (D_intercept − P*) × Q*`
- **PS (Producer Surplus)** = `0.5 × (P* − S_intercept) × Q*`
- **DWL (Deadweight Loss)** = phần tổn thất do can thiệp (tính theo %)

### Ý nghĩa

| Điểm | Màu | Trạng thái |
|---|---|---|
| 70–100 | 🟢 Xanh | Thị trường hoạt động tốt |
| 40–69 | 🟡 Vàng | Có vấn đề, cần điều chỉnh |
| 0–39 | 🔴 Đỏ | Thị trường rối loạn |

**Tại sao DWL bị nhân 3?** Vì tổn thất phúc lợi là thiệt hại vĩnh viễn cho xã hội — mang ý nghĩa kinh tế nặng nề hơn so với việc CS hay PS giảm (vì giảm CS/PS vẫn có thể là sự phân phối lại).

---

## Nội dung lý thuyết tích hợp

Game trực tiếp minh họa các nội dung trong chương trình Kinh tế Chính trị Mác–Lênin:

| Chủ đề lý thuyết | Thể hiện trong game |
|---|---|
| Hàng hóa và giá trị | 5 loại sản phẩm thị trường khác nhau |
| Quy luật giá trị | Giá tự điều chỉnh về P* theo cung cầu |
| Quy luật cung cầu | 6 slider tác động trực tiếp lên 2 đường |
| Cơ chế thị trường | Điểm cân bằng tự hình thành |
| Vai trò nhà nước | 4 công cụ can thiệp + hậu quả |
| Thặng dư — bóc lột? | CS/PS minh họa phân phối giá trị |
| Khủng hoảng kinh tế | Chế độ survive vòng 3 |
| Kinh tế hàng hóa XHCN | Bối cảnh ví dụ thực tế Việt Nam |

---

## Cài đặt & Chạy

### Yêu cầu

- Node.js ≥ 18
- npm ≥ 9

### Cài đặt

```bash
git clone <repo-url>
cd mln122
npm install
```

### Chạy development server

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

### Build production

```bash
npm run build
npm run preview
```

---

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 |
| Build tool | Vite 6 |
| Đồ thị | Chart.js 4 |
| Styling | CSS thuần + CSS Variables |
| Runtime | Trình duyệt (không cần backend) |

---

## Tác giả

Sản phẩm sáng tạo — Học phần **Kinh tế Chính trị Mác–Lênin (MLN122)**

---

*"Bàn tay vô hình dẫn dắt thị trường về điểm cân bằng." — Adam Smith*
