# Confidential Chat FE (Next.js)

Ứng dụng frontend cho Confidential Chat, xây dựng với Next.js 15, React 19, Tailwind CSS v4 và shadcn/ui (Radix UI). Tối ưu cho phát triển nhanh, dễ mở rộng, và triển khai lên Vercel.

## Stack

- Next.js 15 (`app/` router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- shadcn/ui + Radix UI (`components/ui/*`)
- Vercel Analytics

## Yêu cầu

- Node.js ≥ 18 (khuyến nghị 20+)
- npm hoặc pnpm (repo có `pnpm-lock.yaml`, nhưng script dùng npm — có thể dùng pnpm bình thường)

## Cài đặt

```bash
# bằng npm
npm install

# (tuỳ chọn) bằng pnpm
pnpm install
```

## Chạy dev

```bash
npm run dev
```
Mở URL hiển thị trên terminal (thường là `http://localhost:3000`).

## Build & Start (production)

```bash
npm run build
npm start
```

Lưu ý: `next.config.mjs` hiện tắt chặn lỗi trong build để không fail CI:
- `eslint.ignoreDuringBuilds = true`
- `typescript.ignoreBuildErrors = true`

## Scripts

- `dev`: chạy server phát triển
- `build`: build ứng dụng
- `start`: chạy server production
- `lint`: chạy linter (Next.js ESLint)

Ví dụ:
```bash
npm run lint
```

## Cấu trúc thư mục chính

```
confidential-chat-fe/
  app/
    globals.css
    layout.tsx
    page.tsx
    messages/
      page.tsx
  components/
    ui/                 # các thành phần shadcn/ui (Radix)
    *.tsx               # thành phần tính năng: chat, modal, layout...
  hooks/
  lib/
  public/
  styles/
    globals.css         # (nếu dùng, tuỳ dự án)
  package.json
  tsconfig.json
  next.config.mjs
  postcss.config.mjs
  components.json       # cấu hình shadcn/ui, alias, tailwind
```

### Alias & shadcn/ui

`components.json` định nghĩa alias:
- `components` → `@/components`
- `ui` → `@/components/ui`
- `utils` → `@/lib/utils`
- `lib` → `@/lib`
- `hooks` → `@/hooks`

Thêm component UI mới (theo chuẩn shadcn/ui): đặt file trong `components/ui/` và import qua `@/components/ui/...`.

## Tailwind CSS v4

Cấu hình PostCSS:
```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```
Styles toàn cục: `app/globals.css`. Đảm bảo đã import trong `app/layout.tsx`.

## TypeScript

`tsconfig.json` bật `strict`, `paths` alias `@/*` → `./*`. Module resolution dùng `bundler` (phù hợp Next 15).

## Ảnh & tối ưu hoá

`next.config.mjs` đặt `images.unoptimized = true` để tránh yêu cầu tối ưu hoá ảnh runtime (hữu ích khi deploy tĩnh hoặc môi trường chưa cấu hình Image Optimization).

## Môi trường (ENV)

FE thường không cần secret. Nếu cần biến public, sử dụng tiền tố `NEXT_PUBLIC_` để có thể truy cập ở client.

Ví dụ:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```
Sử dụng trong code: `process.env.NEXT_PUBLIC_API_BASE_URL`.

## Deploy (Vercel đề xuất)

1. Push repo lên GitHub/GitLab/Bitbucket.
2. Import project vào Vercel, chọn framework Next.js.
3. Thiết lập biến môi trường (nếu có), build command mặc định.
4. Deploy. Vercel sẽ tự dùng `next start` cho production.

## Phát triển giao diện

- Thành phần tái sử dụng nằm ở `components/ui/*` (shadcn/ui).
- Thành phần nghiệp vụ: `components/*` còn lại (ví dụ: `message-composer.tsx`, `messaging-layout.tsx`).
- Trang chính: `app/page.tsx`; trang tin nhắn: `app/messages/page.tsx`.

## Ghi chú chất lượng

- Hiện build bỏ qua lỗi ESLint/TypeScript để tăng tốc; khi ổn định, cân nhắc bật lại để siết chất lượng.
- Giữ tên file/component rõ ràng, dễ tìm kiếm.

## Vấn đề thường gặp

- Sai phiên bản Node: kiểm tra `node -v` (>=18).
- CSS không áp dụng: chắc chắn đã import `app/globals.css` và cấu hình PostCSS đúng.
- Lỗi đường dẫn import: xác minh alias `@/*` trong `tsconfig.json` trùng với cấu trúc thư mục.

---
Nếu bạn muốn bổ sung hướng dẫn kết nối BE hoặc biến môi trường cụ thể, cho mình endpoint và mình cập nhật phần ENV + data flow chi tiết.
