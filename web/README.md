# SkillHub frontend

Đặc tả chức năng, ranh giới module và cấu trúc thư mục mục tiêu: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

React JSX + Vite, JavaScript thuần. Giao diện lấy bố cục ảnh tham khảo: thanh menu xanh, thanh tài khoản, banner và thẻ thao tác. Không có point, VIP hay thanh toán.

## Chạy

```sh
npm install
npm run dev
```

`npm run build` tạo bản production trong `dist/`.

## Cấu trúc

- `src/components`: layout và thành phần tái sử dụng.
- `src/pages`: trang tổng quan và khung các phân hệ (tải khi cần).
- `src/data/navigation.js`: danh mục điều hướng.
- `src/styles.css`: token màu, bố cục, responsive và accessibility.

## Phạm vi hiện tại

Trang tổng quan bám ảnh tham khảo, menu điều hướng bằng URL hash, hướng dẫn dạng dialog, menu tài khoản và thông báo. Các phân hệ khác hiển thị rõ trạng thái chưa có dữ liệu, chưa triển khai nghiệp vụ. Không có backend, tài khoản thật, lưu dữ liệu hoặc tổ chức thi thật.

## Hướng mở rộng

Tách từng phân hệ thành `src/features/{learning,questions,assessments,examinations,reports}` gồm pages/components/services. Đặt kết nối API trong `src/services`, cấu hình qua biến môi trường công khai, không đưa bí mật vào frontend. Backend chịu trách nhiệm phân quyền, thời gian thi, phiên bản đề và chấm điểm. Triển khai từng luồng hoàn chỉnh và thêm phân trang phía server khi dữ liệu lớn.

Hiệu năng: trang module được lazy-load, icon import riêng, không dùng font từ xa hoặc bộ UI lớn. Cần đo trên thiết bị thật và với dữ liệu thật trước khi cam kết tốc độ. Responsive ở các mốc 600px/1100px, hỗ trợ reduced-motion và focus bàn phím.
