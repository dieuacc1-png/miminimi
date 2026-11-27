# Soạn giáo án từ ảnh

Trang web: gửi ảnh trang sách/vở bài tập tiểu học → tự soạn giáo án (theo Công văn 2345), mỗi tiết một file Word (.docx), có xem trước và nút tải xuống.

- `index.html` – giao diện và logic (gọi Claude qua capability `sample` của Claude artifact).
- `docx.umd.js` – thư viện docx 8.5.0 để tạo file Word ngay trong trình duyệt.

Lưu ý: trang dùng `claude.use("sample")` và `claude.use("downloads")`, nên chỉ chạy khi mở dưới dạng Claude artifact.
