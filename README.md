# MessMate

A modern Next.js (App Router) platform for managing mess/food services, bookings, orders, inventory, and user authentication.

## Badges

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge\&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge\&logo=react)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge\&logo=tailwindcss)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=for-the-badge\&logo=mongodb)
![Zod](https://img.shields.io/badge/Zod-Schema_Validation-3066BE?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)

## Overview

MessMate is a fully featured mess management system built with Next.js (App Router), designed for secure user authentication, bookings, payment verification, inventory handling, and validation via Zod. This version focuses only on the Next.js application, keeping things clean and straightforward.

## Core Features

### Authentication

* Email-based signup/login
* Secure server-side validation
* Optional NextAuth-compatible patterns

### Mess Booking & Payments

* Create mess bookings
* Razorpay payment verification
* Secure transactional flows

### Inventory & Order Management

* Add, edit, and list items
* Fully validated API routes under `app/api/`
* Mongoose-based storage operations

### Input Validation

* Strong, shared Zod schemas across server & client

### UI & UX

* Tailwind CSS styling
* Framer Motion animations
* Reusable components and clean layout

## Tech Stack

### Frontend

* Next.js (App Router)
* React 19
* Tailwind CSS
* Framer Motion
* Lucide Icons
* React Toastify

### Backend

* Mongoose (MongoDB)
* JWT
* Zod Validation

### Utilities

* Nodemailer for email flow
* Cloudinary for uploads (optional)

## Quick Start

### Prerequisites

* Node.js 18+
* npm or yarn
* MongoDB instance

### 1. Clone the repository

```
git clone <repo-url>
cd MessMate
```

### 2. Install dependencies

```
npm install
```

### 3. Add environment variables

Create a `.env.local` file:

```
MONGODB_URI=<your-mongodb-uri>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-string>

NEXT_PUBLIC_BASE_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

JWT_SECRET=<jwt-secret>
```

### 4. Run the development server

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Folder Structure

```
MessMate/
├── app/                     
├── Component/               
├── components/              
├── lib/                     
├── validators/              
├── public/                  
├── package.json             
└── README.md
```

## API Endpoints (Next.js)

### Auth

* POST /api/auth/signup
* POST /api/auth/login

### Mess & Bookings

* GET /api/mess
* POST /api/mess/[id]/booking
* PATCH /api/mess/[id]/booking

### Items

* GET /api/items
* POST /api/items
* PATCH /api/items/[id]

### Utilities

* POST /api/checkUniqueUsername

## NPM Scripts

* `npm run dev`
* `npm run build`
* `npm run start`
* `npm run lint`

## Development Notes

* Uses Zod for strict validation
* Requires stable MongoDB connection
* Framer Motion transitions
* Toastify notifications

## Contributing

1. Fork the repository
2. Create a branch:

```
git checkout -b feature/my-feature
```

3. Commit and push changes
4. Open a pull request


Feel Free to contribute 😊.

