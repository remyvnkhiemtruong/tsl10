# Công bố trúng tuyển

Hệ thống chỉ hỗ trợ thao tác nghiệp vụ của admin/hội đồng tuyển sinh, không tự quyết định thí sinh trúng tuyển.

## Quy trình admin

1. Vào `/admin/trung-tuyen`.
2. Lọc hồ sơ theo trạng thái, kết quả tuyển sinh, đợt xét tuyển, phương án môn học, trường THCS hoặc xã/phường.
3. Cập nhật kết quả: `Chưa xét`, `Trúng tuyển`, `Không trúng tuyển`, `Dự bị`, `Hủy kết quả`.
4. Chỉ công bố hồ sơ có kết quả `Trúng tuyển`.
5. Có thể gỡ công bố; dữ liệu kết quả nội bộ không bị xóa.

Mọi thao tác cập nhật kết quả, công bố, gỡ công bố và công bố hàng loạt đều ghi audit log.

## Công khai

Trang `/cong-bo-trung-tuyen` và API `/api/public/admission-ranking` chỉ trả:

```ts
admissionPublished = true
admissionResult = "TRUNG_TUYEN"
deletedAt = null
```

Không có tab/filter công khai cho không trúng tuyển, dự bị, hủy kết quả hoặc chưa xét.

## Export

- Công khai: `/api/public/admission-ranking/export`, file `bang-xep-hang-trung-tuyen-vvk-2026.xlsx`, không có CCCD/email/số điện thoại/địa chỉ.
- Nội bộ admin: `/api/admin/export/excel`, file `noi-bo-ket-qua-tuyen-sinh-vvk-2026.xlsx`, yêu cầu đăng nhập admin.
