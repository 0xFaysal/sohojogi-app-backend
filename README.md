# SHOJOGI Backend

NestJS backend scaffold for the SHOJOGI decentralized B2B2C e-commerce and supply-chain ecosystem.

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

Required environment variables:

```env
MONGO_URI=mongodb://127.0.0.1:27017/shojogi
JWT_SECRET=replace-with-secure-secret
PORT=3000
```

## Main Modules

- `auth`: JWT registration, login, and profile routes.
- `email`: SMTP mail delivery through the configured provider.
- `otp`: Email OTP generation, delivery, attempt limiting, expiry, and verification.
- `users`: Mongoose user model and `/users/me` protected route.
- `ledger`: Merchant Baki ledger, repayments, and Baki score updates.
- `storefront`: Merchant shop profiles and B2C product listings.
- `sourcing`: Dealer catalog, wholesale orders, and cooperative group buying.
- `stock-alerts`: Threshold-based stock alert records.
- `chat`: JWT-authenticated Socket.IO chat plus REST history endpoints.

## Key Routes

Routes are prefixed with `/api/v1` by default.

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `PATCH /api/v1/auth/change-password`
- `GET /api/v1/auth/profile`
- `POST /api/v1/otp/request`
- `POST /api/v1/otp/verify`
- `GET /api/v1/users/me`
- `POST /api/v1/ledger/dues`
- `PATCH /api/v1/ledger/:id/repayments`
- `POST /api/v1/storefront/merchant/store`
- `POST /api/v1/storefront/merchant/products`
- `GET /api/v1/stock-alerts`
- `GET /api/v1/sourcing/catalog`
- `POST /api/v1/sourcing/orders`
- `POST /api/v1/sourcing/group-buys/join`
- `GET /api/v1/chat/threads`
- `GET /api/v1/chat/threads/:threadId/messages`
- `POST /api/v1/chat/threads/:threadId/messages`

## Socket.IO Events

Authenticate with:

```ts
io('http://localhost:3000', {
  auth: { token: accessToken },
});
```

Supported events:

- `message`
- `typing`
- `readReceipt`

## Environment Notes

The local `.env` file is ignored by Git. Keep real SMTP, JWT, Cloudinary, and admin credentials there only. Use `.env.example` as the safe template for teammates.
