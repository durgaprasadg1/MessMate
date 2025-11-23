# MessMate

MessMate is a modern Next.js (App Router) application for managing mess/food services, bookings, orders and inventory with a companion Express + Mongoose backend for data operations. It focuses on secure authentication, robust server-side validation (Zod), transactional data updates for atomic operations, and a polished UI powered by Tailwind CSS and Framer Motion animations.

## Key Features

- **User authentication**: Sign-up / Sign-in flows with server-side validation and NextAuth-compatible patterns.
- **Booking & payments**: Create and verify bookings (Razorpay integration present in codebase).
- **Inventory & orders**: Medicine/pharmacy/order/supplier APIs (Express + Mongoose) with transaction-safe updates.
- **Form validation**: Zod schemas used both on client and server to enforce consistent input validation.
- **Polished UI**: Tailwind CSS styling and Framer Motion for page transitions and component micro-interactions.
- **Email notifications**: Verification and transactional email patterns using Nodemailer / Cloudinary support for uploads.

## Tech Stack

- Frontend: `Next.js` (App Router), `React 19`, `Tailwind CSS`, `Framer Motion`.
- Backend: `Node.js`, `Express` (in `DB/p`), `Mongoose` (MongoDB) for models and transactional updates.
- Validation: `Zod` for schemas and request validation.
- Auth & Payments: `next-auth` patterns, `jsonwebtoken`, `razorpay` integration scaffolding.
- Utilities & UI: `lucide-react`, `react-toastify`, `recharts`, `cloudinary`.

## Quick Start (Developer)

Prerequisites:

- Node.js (v18+ recommended)
- npm (or yarn)
- A MongoDB instance (for transactions, a replica set recommended).

1. Clone the repo

```powershell
git clone <repo-url>
cd 'C:\Users\HP\Desktop\Next\MessMate'
```

2. Install dependencies

```powershell
npm install
```

3. Create a `.env` file in the project root (see environment variables below)

4. Run the app

```powershell
npm run dev
```

The Next.js app runs on the port configured by Next (default `http://localhost:3000`).

If you also want to run the Express API server present in `DB/p`, open a second terminal and:

```powershell
cd 'C:\Users\HP\Desktop\Next\MessMate\DB\p'
npm install
npm run dev || node index.js
```

## NPM Scripts

- `npm run dev` : Start Next.js in development mode.
- `npm run build`: Build production assets.
- `npm run start`: Start Next.js in production mode after build.
- `npm run lint` : Run ESLint.
- `npm run test:auth` : Run included auth-related tests (if present).
- `npm run test:e2e-auth` : End-to-end auth tests (if present).

## Environment Variables

Create a `.env` (or `.env.local`) in the project root with the variables below (replace placeholders):

- `MONGODB_URI` : MongoDB connection string (used by both Next app and Express backend).
- `NEXTAUTH_URL` : Base URL for NextAuth callbacks (e.g. `http://localhost:3000`).
- `NEXTAUTH_SECRET` : Secret key for NextAuth (random string).
- `NEXT_PUBLIC_BASE_URL` : Public base URL (e.g. `http://localhost:3000`).
- `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` : If using Cloudinary for uploads.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` : Razorpay credentials for payments.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` : SMTP credentials for sending emails.
- `JWT_SECRET` : JWT signing secret if using custom JWT flows.

Tip: Keep secrets out of source control and store production secrets in your hosting provider's environment configuration.

## API Endpoints (Examples)

Note: The project includes two API surfaces — Next.js App Router APIs (`app/api/...`) and an Express backend under `DB/p`.

Next.js API examples (App Router):

- `POST /api/checkUniqueUsername` — checks if a username is available (see `app/api/checkUniqueUsername/route.ts`).
- `POST /api/mess/:id/booking` — create a booking for a mess (see `app/api/mess/[id]/booking/route.js`).
- `PATCH /api/mess/:id/booking` — verify/complete payment for a booking.
- `POST /api/auth/*` — next-auth endpoints if NextAuth is configured under `/api/auth`.

Express backend (optional server in `DB/p`):

- `GET /api/medicine` — list medicines (see `DB/p/Router/medicine.js`).
- `POST /api/medicine` — create a medicine.
- `GET /api/pharmacy` — list pharmacies (see `DB/p/Router/pharmacy.js`).
- `POST /api/order` — create an order (transaction-safe flow, see `DB/p/Router/order.js`).
- `POST /api/supplier` — supplier endpoints.

Example curl (Next API):

```bash
curl -X POST 'http://localhost:3000/api/checkUniqueUsername' \
	-H 'Content-Type: application/json' \
	-d '{"username":"alice"}'
```

Example curl (Express API):

```bash
curl -X GET 'http://localhost:4000/api/medicine'
```

Adjust host/port based on your local configuration.

## Screenshots

Include screenshots to show the app UI. Add images to `public/screenshots/` and embed them below.

Example:

![Landing Page](./public/screenshots/landing.png)
![Dashboard](./public/screenshots/dashboard.png)

If you don't yet have screenshots, create the `public/screenshots/` folder and add images named above to show in this README.

## Folder Structure (high level)

`MessMate/`

- `app/` : Next.js App Router pages and API routes (`app/layout.tsx`, `app/page.tsx`, `app/api/...`).
- `Component/` : Reusable UI components (Navbar, Provider, Animated layouts).
- `components/` : UI building blocks and small components.
- `lib/` : Server-side helpers (database connection, validation helper).
- `validators/` : Zod schemas used across server/client for validation.
- `DB/` and `DB/p/` : Legacy/companion Express + Mongoose backend, models and routers.
- `public/` : Static assets and screenshots.
- `prisma/` : (If present) schema for Prisma (some projects contain it for other demos).
- `package.json` : Project scripts & dependencies.

Explore these folders for specific implementations (booking flows, auth, and API handlers).

## Development Notes & Recommendations

- Transactions: Several flows use Mongoose transactions for atomic updates — ensure your MongoDB instance supports transactions (replica set).
- Validation: Zod schemas ensure consistent validation. When adding new endpoints, add matching Zod schemas and server-side checks.
- Animations: `Component/Others/AnimatedLayout.jsx` wraps the app to provide page transitions (requires `framer-motion`).
- Testing: There are small test scripts present (`tests/` references in `package.json`) — expand tests to cover booking and auth flows.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Install dependencies and run locally
4. Open a Pull Request with a clear description of changes

Please follow existing code style and run `npm run lint` before opening PRs.

## Troubleshooting

- If server fails to start due to MongoDB transaction errors, confirm `MONGODB_URI` points to a replica set-enabled deployment or run a single-node replica set locally for development.
- If `framer-motion` is missing, install it with `npm i framer-motion`.
- For email sending errors, verify SMTP env variables.

## License & Contact

This project template does not include a license file by default. Add a `LICENSE` if you intend to publish. For questions or issues, open an issue on the repository or contact the maintainers listed in the project metadata.

---

If you'd like, I can also:

- Run the dev server and report any runtime errors.
- Add example Postman collection for the API endpoints.
- Auto-generate screenshots placeholders from running pages locally.

Would you like me to run the dev server now and capture any console errors?
