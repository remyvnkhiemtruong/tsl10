# Quy trình xét tuyển VVK 2026

## Học sinh đăng ký

1. Điền thông tin cá nhân, trường THCS, năm học lớp 9, kết quả học tập/rèn luyện lớp 6-9.
2. Chọn địa chỉ thường trú từ danh mục 34 tỉnh/thành và xã/phường phụ thuộc.
3. Chọn diện ưu tiên nếu có.
4. Chỉ khai tối đa 01 giải thưởng dùng để cộng điểm khuyến khích. Giải khác ghi vào ghi chú, không cộng điểm.
5. Chọn phương án môn học lớp 10.
6. Upload ảnh 4x6 và giấy khai sinh hoặc CCCD/số định danh. Học bạ không bắt buộc upload, nhưng được khuyến khích để xử lý nhanh hơn.
7. Sau khi nộp, dùng mã hồ sơ + CCCD/số định danh + ngày sinh để tra cứu và tải đơn đăng ký PDF.

## Điểm dự kiến

Điểm xét tuyển dự kiến = `A + B + C`.

- `A`: tổng điểm trung bình môn cả năm các môn có điểm số của 4 năm THCS.
- `B`: tổng điểm quy đổi học tập/rèn luyện 4 năm THCS.
- `C`: điểm ưu tiên theo nhóm hợp lệ và điểm khuyến khích tối đa 01 giải cấp tỉnh.

Hệ thống chỉ tính điểm dự kiến phục vụ hội đồng tuyển sinh, không tự kết luận trúng tuyển.

## Admin xử lý hồ sơ

Admin có thể chỉnh toàn bộ hồ sơ tại `/admin/ho-so/[id]/chinh-sua`, gồm thông tin cá nhân, trường THCS, điểm, địa chỉ, ưu tiên, giải thưởng, phương án môn học, trạng thái hồ sơ và ghi chú.

Admin cập nhật hồ sơ trực tiếp/bản giấy ở trang chi tiết:

- `Chưa nộp hồ sơ trực tiếp` hoặc `Đã nộp hồ sơ trực tiếp`.
- `Chưa kiểm tra`, `Hợp lệ`, `Chưa hợp lệ`, `Cần bổ sung`.
- Ghi chú công khai hiển thị cho thí sinh; ghi chú nội bộ chỉ admin thấy.

Trạng thái hồ sơ hợp lệ không phải là kết quả trúng tuyển.

## PDF đơn đăng ký

Đơn đăng ký dự tuyển PDF được sinh server-side bằng `pdf-lib`, nhúng font Noto Sans tiếng Việt, không dùng `window.print()`, Chrome print, Puppeteer hoặc ảnh chụp màn hình.

Route:

- Admin: `/api/admin/applications/[id]/registration-form-pdf`.
- Thí sinh: `/api/applications/registration-form-pdf`, yêu cầu mã hồ sơ + CCCD/số định danh + ngày sinh.

Tên file:

```text
don-dang-ky-du-tuyen-lop-10-vvk-2026-{applicationCode}.pdf
```

## Liên hệ và lịch

Admin cập nhật thông tin trường, ban giám hiệu, hạn khóa đăng ký, ngày công bố đợt 1/2 và bật/tắt tra cứu kết quả cá nhân tại `/admin/cau-hinh`.
