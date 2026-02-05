# Deployment Guide - Environment Variables

## The Problem

The app was showing "No mess found" in production because `NEXT_PUBLIC_BASE_URL` was hardcoded to `http://localhost:3000` in the `.env` file.

## The Solution

We've updated the code to automatically detect the correct URL in both local and production environments.

## Environment Variables Setup

### Local Development

Use `.env.local` (already created) with:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Production (Vercel/Other hosting)

Set these environment variables in your hosting platform:

1. **NEXTAUTH_URL** - Set this to your production domain
   - Example: `https://your-domain.vercel.app` or `https://yourdomain.com`

2. **All other variables from .env.example**:
   - MONGODB_URI
   - NEXTAUTH_SECRET
   - JWT_SECRET
   - CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET
   - RAZORPAY_KEY_ID, RAZORPAY_SECRET
   - MAIL_USER, MAIL_PASS
   - PORT (optional, usually auto-set by platform)

3. **DO NOT SET** `NEXT_PUBLIC_BASE_URL` in production
   - The app will automatically use the correct URL
   - Vercel sets `VERCEL_URL` automatically

## Changes Made

1. **Created `lib/getBaseUrl.js`**: A utility function that:
   - Returns empty string for client-side (uses relative URLs)
   - Detects Vercel URL automatically
   - Falls back to localhost for local dev

2. **Updated all fetch calls**:
   - Removed hardcoded `process.env.NEXT_PUBLIC_BASE_URL`
   - Using `getBaseUrl()` or relative paths

3. **Fixed password reset emails**:
   - Now uses request headers to detect the actual domain
   - Falls back to NEXTAUTH_URL

## Testing

### Local

```bash
npm run dev
```

Visit http://localhost:3000/mess - should show all messes

### Production

After deploying:

1. Make sure NEXTAUTH_URL is set to your production domain
2. Clear cache and redeploy
3. Visit your-domain.com/mess - should show all messes

## Vercel Deployment Steps

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables (use .env.example as reference)
4. Set **NEXTAUTH_URL** to your Vercel domain: `https://your-app.vercel.app`
5. Deploy!

## Important Notes

- `.env` and `.env.local` are in `.gitignore` - never commit them
- Use `.env.example` as a reference for required variables
- In production, the app auto-detects the URL - no need for NEXT_PUBLIC_BASE_URL
- Password reset emails will use the correct domain automatically
