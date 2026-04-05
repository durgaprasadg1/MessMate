# MessMate

MessMate is a full-stack mess management platform built on the Next.js App Router. It supports consumer ordering, mess owner operations, and administrative workflows with server-side authentication, payments, notifications, analytics, and Redis-backed caching.

## What this project delivers

### Consumer experience

- Browse mess listings and view individual mess details
- Place orders and complete payments
- Track order history and monthly subscriptions
- Receive notifications and leave reviews

### Mess owner tools

- Manage mess availability and menu details
- View incoming orders and update order states
- Monitor analytics and performance trends
- Handle monthly customer registrations

### Admin operations

- Review and verify mess registrations
- Access system-wide user and mess insights
- Manage user and mess status

## Tech stack

### Frontend

- Next.js App Router
- React 19
- Tailwind CSS 4
- Radix UI primitives
- Recharts for analytics

### Backend and services

- Supabase Postgres with server-side access
- NextAuth session handling
- Redis for caching (18 hour TTL)
- Razorpay payments
- Nodemailer for email flows
- Cloudinary for media uploads
- Socket.io for real-time updates

## Architecture notes

- A custom HTTP server in [server.js](server.js) initializes the Next.js app and the Socket.io server.
- Supabase access is centralized in [lib/supabaseClient.js](lib/supabaseClient.js) using a service role key for server-side calls.
- Redis helpers are in [lib/redis.js](lib/redis.js) and provide JSON caching with TTL and safe fallback behavior.
- Route handlers use server-side sessions to gate protected flows.

## Project structure

```
MessMate/
  app/
  Component/
  components/
  contexts/
  hooks/
  lib/
  public/
  validators/
  tests/
  server.js
  redis.js
  next.config.ts
  package.json
  README.md
```

## Local setup

### Prerequisites

- Node.js 18 or newer
- A Supabase project with database access
- Redis instance (optional but recommended for caching)
- Razorpay account for payments (optional in local testing)
- SMTP credentials for mail flows (optional)

### Install dependencies

```
npm install
```

### Environment variables

Create a .env.local file in the project root:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
NEXT_PUBLIC_BASE_URL=http://localhost:3000

REDIS_URL=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Notes:

- Redis is optional. If REDIS_URL is missing, the app runs without caching.
- Use a service role key only on the server. Do not expose it to clients.

### Run in development

```
npm run dev
```

### Build and run production

```
npm run build
npm run start
```

## Scripts

- npm run dev: start the custom server in development
- npm run build: create the production build
- npm run start: run the production server
- npm run lint: lint the codebase
- npm run test:auth: run auth unit tests
- npm run test:e2e-auth: run auth end-to-end tests

## Caching behavior

- Redis caches are keyed by tenant and user identifiers where applicable.
- TTL is 18 hours for cached reads.
- Cache invalidation occurs on mutating operations.

## Contributing

1. Create a branch
2. Make your changes
3. Open a pull request with a clear description of updates
