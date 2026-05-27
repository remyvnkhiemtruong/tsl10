Bạn là senior full-stack engineer. Hãy hoàn thiện template này thành hệ thống web chuyên nghiệp chạy được trên **Vercel** tên là:

“Cổng đăng ký dự tuyển vào lớp 10 THPT Võ Văn Kiệt”
Năm học: 2026 - 2027

Mục tiêu:
Xây dựng website đăng ký xét tuyển lớp 10 trực tuyến cho Trường THPT Võ Văn Kiệt, cho phép học sinh/phụ huynh nhập thông tin, upload học bạ/ảnh/PDF/minh chứng, chọn phương án môn học, nộp hồ sơ, tra cứu trạng thái; đồng thời cung cấp trang quản trị cho nhà trường để kiểm tra, duyệt, xuất Excel/PDF và quản lý hồ sơ.

YÊU CẦU DEPLOY VERCEL BẮT BUỘC:
1. App phải deploy được trên Vercel, không dùng custom server.
2. Sử dụng Next.js App Router + TypeScript + Tailwind + Prisma + PostgreSQL.
3. Production upload phải dùng Vercel Blob hoặc S3-compatible storage, không lưu file production vào local filesystem.
4. Giữ `vercel.json` với build command `npm run vercel-build`.
5. Script Vercel build phải chạy `npx prisma generate` trước `next build`.
6. Migration production dùng `npx prisma migrate deploy`; không tự ý seed tài khoản mặc định trong production nếu chưa được yêu cầu.
7. Tất cả biến môi trường cần có trong `.env.example` và `.env.vercel.example`.
8. Có hướng dẫn deploy Vercel rõ trong README/DEPLOY_VERCEL.md.

Yêu cầu bắt buộc:
1. Sửa toàn bộ lỗi TypeScript, lint, build nếu có.
2. Hoàn thiện form đăng ký nhiều bước, validation Zod, upload file, submit hồ sơ.
3. Hoàn thiện trang tra cứu hồ sơ bằng mã hồ sơ + số định danh + ngày sinh.
4. Hoàn thiện admin login, dashboard, danh sách hồ sơ, chi tiết hồ sơ.
5. Hoàn thiện duyệt file, cập nhật trạng thái, ghi log xử lý hồ sơ.
6. Hoàn thiện xuất Excel và PDF phiếu đăng ký.
7. Bảo mật file upload: không để public link file trong giao diện học sinh; admin xem qua API có kiểm tra quyền.
8. Chống nộp trùng theo số định danh cá nhân.
9. Có route `/api/health` để kiểm tra deploy.
10. Tạo README hướng dẫn chạy local và deploy Vercel rõ ràng.

Các phương án môn học lớp 10:
- Phương án 1: Vật lí; Hoá học; Tin học; Công nghệ Công nghiệp
- Phương án 2: Vật lí; Hoá học; Tin học; Âm nhạc
- Phương án 3: Hoá học; Sinh học; Tin học; Âm nhạc
- Phương án 4: Hoá học; Sinh học; Tin học; Địa lí
- Phương án 5: GDKT&PL; Âm nhạc; Tin học; Địa lí
- Phương án 6: GDKT&PL; Mĩ thuật; Tin học; Địa lí

Đối tượng ưu tiên:
- Con thương binh/liệt sĩ
- Dân tộc thiểu số Khơ me, Hoa, ...
- Có cha hoặc mẹ là người dân tộc thiểu số
- Học sinh ở vùng có điều kiện kinh tế - xã hội đặc biệt khó khăn: ấp Vĩnh Lộc, ấp Vĩnh Phú B, ấp Long Đức

Đối tượng khác:
- Hộ nghèo
- Hộ cận nghèo
- Mồ côi cha hoặc mẹ
- Mồ côi cha lẫn mẹ

Điểm khuyến khích:
- Giải nhất: 1.5
- Giải nhì: 1.0
- Giải ba: 0.5

File upload:
- Cho phép jpg, jpeg, png, pdf
- Ảnh 4x6 tối đa 5MB
- Ảnh học bạ tối đa 10MB/file
- PDF học bạ tối đa 25MB/file
- Minh chứng tối đa 10MB/file
- Production storage: Vercel Blob bằng `BLOB_READ_WRITE_TOKEN`

PDF phiếu đăng ký cần có:
- Quốc hiệu, tiêu ngữ
- ĐƠN ĐĂNG KÝ DỰ TUYỂN VÀO LỚP 10
- Năm học 2026 - 2027
- Kính gửi: Hiệu trưởng trường THPT Võ Văn Kiệt
- I. Thông tin học sinh
- II. Thông tin học tập
- III. Thông tin liên hệ
- IV. Đối tượng ưu tiên, khuyến khích
- V. Nguyện vọng học các môn lựa chọn lớp 10
- VI. Cam kết
- Phước Long, ngày ... tháng ... năm 2026
- Xác nhận của cha/mẹ/người giám hộ
- Người làm đơn
- Mã hồ sơ và QR tra cứu

Sau khi hoàn thành, hãy chạy:
- npm run lint
- npm run build
- npx prisma generate

Báo cáo lại:
1. File/thư mục đã thay đổi
2. Cách cài đặt local
3. Cách chạy database local
4. Cách migrate/seed
5. Cách chạy dev server
6. Cách deploy Vercel
7. Danh sách biến môi trường Vercel
8. Cách đăng nhập admin
9. Chức năng đã hoàn thành
10. Kết quả lint/build
