# Danh mục hành chính 34 tỉnh/thành năm 2025

Hệ thống dùng danh mục hành chính sau sắp xếp năm 2025 để nhập nơi sinh và địa chỉ thường trú.

## Danh sách 34 tỉnh/thành

Hà Nội; Huế; Lai Châu; Điện Biên; Sơn La; Lạng Sơn; Quảng Ninh; Thanh Hóa; Nghệ An; Hà Tĩnh; Cao Bằng; Tuyên Quang; Lào Cai; Thái Nguyên; Phú Thọ; Bắc Ninh; Hưng Yên; Hải Phòng; Ninh Bình; Quảng Trị; Đà Nẵng; Quảng Ngãi; Gia Lai; Khánh Hòa; Lâm Đồng; Đắk Lắk; Thành phố Hồ Chí Minh; Đồng Nai; Tây Ninh; Cần Thơ; Vĩnh Long; Đồng Tháp; Cà Mau; An Giang.

## Dữ liệu đã commit

- Tổng số tỉnh/thành: 34.
- Tổng số xã/phường/đặc khu trong dữ liệu: 3.321.
- File tỉnh/thành: `src/data/administrative-units/provinces.json`.
- File xã/phường: `src/data/administrative-units/wards/<province-code>.json`.
- Helper TypeScript: `src/lib/administrative-units.ts` và `src/lib/administrative-wards.ts`.
- API nội bộ:
  - `GET /api/administrative-units/provinces`
  - `GET /api/administrative-units/wards?provinceCode=96`

## Nguồn dữ liệu

Dữ liệu được sinh từ Province Open API v2 sau sáp nhập 07/2025: `https://provinces.open-api.vn/api/v2/?depth=2`.

## Cách cập nhật khi có bản mới

1. Tải lại dữ liệu từ nguồn chính thức hoặc API nguồn.
2. Giữ nguyên cấu trúc `provinces.json` và từng file `wards/<province-code>.json`.
3. Kiểm tra tổng số tỉnh/thành, tổng số xã/phường và các mã hành chính.
4. Chạy `npm run lint`, `npm run build`, `npx prisma generate`.

Không sửa tay trực tiếp danh mục hành chính trong component UI. Component chỉ đọc dữ liệu qua helper/API nội bộ.

