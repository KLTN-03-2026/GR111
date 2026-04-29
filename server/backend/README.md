# Backend - Sports Field Booking Platform

Backend service duoc xay dung bang Next.js (App Router), Prisma va Socket.IO de phuc vu he thong dat san the thao.

## 1) Tong quan

- Framework: Next.js 16 (route handlers trong `src/app/api`).
- Runtime: Node.js + TypeScript.
- Database: PostgreSQL qua Prisma.
- Realtime: Socket.IO (chay tren custom HTTP server).
- Hang doi/cache: Redis.
- Tich hop ngoai: Stripe, Cloudinary, Google/Facebook login, Mapbox, Gemini/AI.

## 2) Kien truc thu muc chinh

- `server.ts`: custom server khoi tao Next.js + Socket.IO + background jobs + module listeners.
- `src/app/api`: tat ca REST API endpoints.
- `src/modules`: business logic theo domain (booking, club, user, admin, marketing...).
- `src/lib`: helper dung chung (jwt, redis, socket, cloudinary, response, events...).
- `src/validations`: schema validate input.
- `src/jobs`: cron/background jobs.
- `src/proxy.ts`: CORS cho toan bo `/api/*` (bao gom xu ly preflight `OPTIONS`).
- `prisma/schema.prisma`: schema database.
- `prisma/migrations`: lich su migration.
- `prisma/seed.ts`: seed du lieu mau.

## 3) Yeu cau he thong

- Node.js 20+ (khuyen nghi dung LTS moi nhat).
- npm 10+.
- PostgreSQL 14+.
- Redis 6+.

## 4) Cai dat local

1. Di chuyen vao thu muc backend:

```bash
cd server/backend
```

2. Cai dependency:

```bash
npm install
```

3. Tao file env:

```bash
cp .env.example .env
```

4. Cau hinh cac bien trong `.env` (it nhat can `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`).

5. Chay migration va generate Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

6. (Tuy chon) Seed du lieu:

```bash
npx prisma db seed
```

7. Chay backend:

```bash
npm run dev
```

Mac dinh server chay o `http://localhost:3000`.

## 5) Bien moi truong

Danh sach chinh trong `.env.example`:

- Database
  - `DATABASE_URL`
- JWT/Auth
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
- App URL
  - `NEXT_PUBLIC_APP_URL`
  - `API_URL`
- Redis
  - `REDIS_URL`
- SMTP (quen mat khau/gui mail)
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
- OAuth
  - `FACEBOOK_APP_ID`
  - `FACEBOOK_APP_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Cloudinary
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Mapbox
  - `NEXT_PUBLIC_MAPBOX_TOKEN`
- AI
  - `GOOGLE_CLOUD_API_KEY`
  - `GEMINI_API_KEY`

Khuyen nghi:
- Khong commit file `.env`.
- Dung secret manh cho `JWT_SECRET`.
- Tach env cho dev/staging/prod.

## 6) Scripts

- `npm run dev`: chay backend bang `tsx server.ts` (co custom server + socket/jobs/listeners).
- `npm run build`: build Next.js.
- `npm run start`: chay ban build production.
- `npm run lint`: chay ESLint.
- `npm run test`: chay unit test voi Vitest.
- `npm run test:watch`: watch mode cho Vitest.

## 7) Database (Prisma)

- File cau hinh Prisma: `prisma.config.ts`.
- Schema: `prisma/schema.prisma`.
- Prisma client duoc generate vao: `src/generated/prisma`.

Lenh hay dung:

```bash
npx prisma migrate dev
npx prisma migrate deploy
npx prisma generate
npx prisma studio
npx prisma db seed
```

## 8) CORS va giao tiep voi frontend

- CORS duoc xu ly tai `src/proxy.ts`.
- Ap dung cho matcher: `/api/:path*`.
- Co xu ly preflight `OPTIONS`.
- Origin local dang duoc allow:
  - `http://localhost:5173`
  - `http://localhost:3001`
  - `http://127.0.0.1:5173`

Neu doi frontend URL, cap nhat danh sach `ALLOWED_ORIGINS` trong `src/proxy.ts`.

## 9) Realtime va background jobs

Khi chay `npm run dev`, backend se khoi tao:

- Socket.IO server (qua `initSocket`).
- Booking expiration jobs (qua `initBookingJobs`).
- Domain listeners:
  - `initBookingListeners`
  - `initSlotListeners`

Tat ca duoc boot trong `server.ts`.

## 10) Testing va quality

- Test framework: Vitest (`vitest.config.ts`).
- Pattern test file: `src/**/*.test.ts`.
- Lint truoc khi merge:

```bash
npm run lint
npm run test
```

## 11) Trien khai production

1. Cai dependency:

```bash
npm ci
```

2. Build:

```bash
npm run build
```

3. Migrate DB:

```bash
npx prisma migrate deploy
```

4. Chay server:

```bash
npm run start
```

Luu y:
- Set day du env production.
- Dam bao PostgreSQL/Redis da san sang.
- Neu thay doi `next.config.ts` hoac env quan trong, restart service.

## 12) Troubleshooting nhanh

- Loi ket noi DB:
  - Kiem tra `DATABASE_URL`.
  - Kiem tra PostgreSQL dang chay va co quyen truy cap.
- Loi CORS:
  - Kiem tra `Origin` frontend co trong `ALLOWED_ORIGINS` hay khong.
  - Kiem tra request den dung duong dan `/api/*`.
- Loi Redis:
  - Kiem tra `REDIS_URL` va trang thai Redis service.
- Loi migration:
  - Chay lai `npx prisma generate`.
  - Kiem tra file migration moi nhat trong `prisma/migrations`.

## 13) Ghi chu cho team

- Route API nen dat theo domain trong `src/app/api`.
- Business logic nen nam trong `src/modules`, tranh viet logic day dac trong route handlers.
- Luon validate input tai boundary (`src/validations`) va tra response thong nhat.
