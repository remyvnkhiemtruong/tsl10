# Danh mục trường THCS Cà Mau mới

Hệ thống dùng danh mục trường THCS Cà Mau mới cho dropdown ở form đăng ký và admin edit.

## File dữ liệu

- Seed đối chiếu: `data/import/danh_sach_thcs_ca_mau_moi_ten_truong_dia_chi_cu_moi_seed.csv`.
- File import chính thức: `data/import/danh_sach_thcs_ca_mau_moi_dia_chi_moi_hoan_chinh.csv`.
- JSON runtime: `src/data/secondary-schools/ca-mau-secondary-schools.json`.
- Helper: `src/lib/secondary-schools.ts`.

CSV chính thức chỉ có đúng 03 cột:

```text
name,old_address,new_address
```

`new_address` phải là một địa chỉ duy nhất và kết thúc bằng `tỉnh Cà Mau`. Không dùng địa chỉ dạng `Khu vực`, `Chưa rõ`, dấu `/`, hoặc nhiều xã/phường trong cùng một ô.

## Kiểm tra dữ liệu

Chạy:

```bash
npm run validate:secondary-schools
```

Build sẽ fail nếu CSV sai header, thiếu dữ liệu, trùng tuyệt đối, có địa chỉ mới mơ hồ hoặc có cột ngoài 03 cột chính thức.

## Dropdown

Dropdown tìm theo tên trường, địa chỉ cũ và địa chỉ mới. Nếu thí sinh chọn `Trường khác / nhập thủ công`, admin cần rà soát và chuẩn hóa sau khi tiếp nhận hồ sơ.
