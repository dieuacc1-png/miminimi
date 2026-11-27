# Soạn giáo án từ ảnh

Gửi ảnh trang sách / vở bài tập tiểu học → web tự soạn giáo án (theo Công văn 2345), mỗi tiết một file Word (.docx), có xem trước, nút tải xuống và nút gửi Zalo trên điện thoại.

Bản này dùng **Google Gemini (gói miễn phí)** nên ai mở link cũng dùng được, không cần tài khoản.

## Cấu trúc

| File | Là gì |
|---|---|
| `index.html` | Giao diện web |
| `docx.umd.js` | Thư viện tạo file Word ngay trong trình duyệt |
| `api/generate.js` | Máy chủ nhỏ gọi Gemini, giữ kín API key |
| `vercel.json` | Cài đặt cho Vercel |
| `claude-artifact/` | Bản cũ chạy trong Claude (không cần máy chủ) |

## Đưa web lên mạng (khoảng 15 phút)

### 1. Lấy API key Gemini (miễn phí)
1. Vào https://aistudio.google.com/apikey, đăng nhập Google.
2. Bấm **Create API key** → sao chép key (dạng `AIza...`). Không gửi key này cho ai.

### 2. Đưa lên Vercel (miễn phí)
1. Vào https://vercel.com → **Sign Up / Log in** → chọn **Continue with GitHub** (tài khoản `dieuacc1-png`).
2. Bấm **Add New… → Project**, chọn repo **miminimi** → **Import**.
3. Mở mục **Environment Variables**, thêm:
   - `GEMINI_API_KEY` = key vừa sao chép (bắt buộc)
   - `APP_PASSWORD` = một mã tuỳ ý, nếu muốn chỉ người có mã mới dùng được (tuỳ chọn)
   - `LIMIT_PER_HOUR` = số lượt tối đa mỗi giờ cho một người, mặc định 60 (tuỳ chọn)
   - `GEMINI_MODEL` = tên model Gemini muốn dùng, ví dụ `gemini-2.5-flash` (tuỳ chọn; để trống thì web tự thử các model Flash thông dụng)
4. Bấm **Deploy**. Xong sẽ có link dạng `miminimi.vercel.app` → gửi link này qua Zalo.

Đổi biến môi trường sau này: **Project → Settings → Environment Variables**, sửa xong vào **Deployments → Redeploy**.

## Lưu ý
- Gói miễn phí của Gemini giới hạn số lượt mỗi phút và mỗi ngày (xem trong AI Studio). Khi hết lượt, web báo và người dùng đợi rồi thử lại.
- Ở gói miễn phí, Google có thể dùng dữ liệu gửi lên để cải thiện sản phẩm. Không gửi ảnh có thông tin cá nhân của học sinh.
- Giáo án do AI soạn: luôn kiểm tra lại đáp án trước khi dùng. Chỗ AI không chắc chắn được ghi ở mục "Điều chỉnh sau bài dạy".
