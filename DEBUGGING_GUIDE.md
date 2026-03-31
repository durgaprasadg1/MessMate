# "View Details" Not Found - Debugging Guide

## Quick Summary of Fixes Applied

✅ **Added comprehensive logging** to track the ID through the entire flow  
✅ **Added ID validation** on the backend to catch invalid MongoDB IDs  
✅ **Fixed environment variables** - added `NEXT_PUBLIC_BASE_URL` to `.env`  
✅ **Improved error messages** with detailed console logs

---

## Step-by-Step Debugging

### **Step 1: Check Frontend ID Passing**

1. Open your browser's Dev Console (F12)
2. Click "View Details" on a mess card
3. Look for logs like:
   ```
   [ShowMess] Received id: 507f1f77bcf86cd799439011
   [ShowMess] Base URL: http://localhost:3000
   [ShowMess] Fetching from: http://localhost:3000/api/mess/507f1f77bcf86cd799439011
   ```

**What to check:**

- ✓ Is the ID 24 characters long?
- ✓ Does it match a real mess ID in your database?
- ✓ Is the Base URL correct?

---

### **Step 2: Check Backend API Response**

1. Open browser Network tab (F12 → Network)
2. Click "View Details"
3. Look for the request to `/api/mess/[id]`
4. Check:
   - Status code (should be 200, not 404)
   - Response headers
   - Response body

**Backend logs in terminal should show:**

```
[API GET /mess/:id] Received id: 507f1f77bcf86cd799439011 Type: string
[API GET /mess/:id] Found mess: 507f1f77bcf86cd799439011 Your Mess Name
```

---

### **Step 3: Verify Database Connection**

1. Start the app: `npm run dev`
2. Create a mess or note an existing mess ID
3. Check server logs for:
   - `connectDB()` was called successfully
   - No connection errors

**If you see connection errors:**

```bash
# Test MongoDB connection
node -e "const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('MongoDB connected');
    process.exit(0);
  }).catch(err => {
    console.error('MongoDB error:', err);
    process.exit(1);
  })"
```

---

### **Step 4: Check Environment Variables**

**For Local Development:**

```bash
# Your .env should have:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

**For Production (Vercel/Other):**

```
Set in your hosting platform's environment variables:
- NEXT_PUBLIC_BASE_URL=https://your-domain.com
- NEXTAUTH_URL=https://your-domain.com
- All other vars from .env
```

**Verify they're loaded:**

```bash
# Run in your app to check:
npm run dev
# Then check that [ShowMess] logs show the correct URL
```

---

### **Step 5: Check MongoDB Query**

If ID is received but mess isn't found, there may be a data issue:

```bash
# Connect to MongoDB Atlas
# Use MongoDB Compass or mongosh:
mongosh "your-connection-string"

# Run this query:
use messmatedb  # or your database name
db.messes.findById(ObjectId("507f1f77bcf86cd799439011"))

# If no result, the mess doesn't exist in DB
# Check with:
db.messes.find().limit(1)  # Show any mess
```

---

### **Step 6: Common Issues & Solutions**

| Issue                          | Cause                                   | Fix                                        |
| ------------------------------ | --------------------------------------- | ------------------------------------------ |
| "Mess not found" in production | `NEXT_PUBLIC_BASE_URL` not set or wrong | Set correct URL in `.env` and redeploy     |
| "Mess not found" locally       | Wrong ID format or mess doesn't exist   | Check logs, verify mess exists in DB       |
| ID looks like "undefined"      | Router params not awaited               | ✅ Already fixed (we added `await params`) |
| Empty ID received              | Route parameter not captured            | Check that route file is `[id]/page.jsx`   |
| 500 error instead of 404       | Database connection failed              | Check `MONGODB_URI`, try connection test   |

---

## Testing Checklist

After applying fixes, test in this order:

- [ ] **Local Dev**: Run `npm run dev`, click "View Details", check console logs
- [ ] **Logs Show Correct ID**: Frontend logs show 24-char ID
- [ ] **Backend Receives ID**: Backend logs show the same ID
- [ ] **Database Query Works**: Backend log shows "Found mess" with name
- [ ] **Page Loads**: See mess details instead of "Not Found"
- [ ] **Production**: Deploy and test with real domain URL

---

## Log Output Examples

### ✅ **Success**: Everything working

```
[ShowMess] Received id: 507f1f77bcf86cd799439011
[ShowMess] Base URL: http://localhost:3000
[ShowMess] Fetching from: http://localhost:3000/api/mess/507f1f77bcf86cd799439011

[API GET /mess/:id] Received id: 507f1f77bcf86cd799439011 Type: string
[API GET /mess/:id] Found mess: 507f1f77bcf86cd799439011 Yummy Mess
```

### ❌ **Error**: ID format issue

```
[ShowMess] Received id: invalid-id-xyz
[API GET /mess/:id] Invalid ID format. Expected 24-char hex string, got: invalid-id-xyz
```

### ❌ **Error**: Mess not in DB

```
[API GET /mess/:id] Received id: 507f1f77bcf86cd799439011
[API GET /mess/:id] Mess not found for id: 507f1f77bcf86cd799439011
```

---

## If Problem Persists

1. **Clear `.next` cache**: `rm -r .next` (or `rmdir /s .next` on Windows)
2. **Restart dev server**: Kill and run `npm run dev` again
3. **Check all logs**: Look at both browser console AND terminal
4. **Share logs**: Provide the exact logs from steps 1-2 for investigation

---

## Files Modified

- ✅ `app/mess/[id]/page.jsx` - Added frontend logging
- ✅ `app/api/mess/[id]/route.js` - Added backend logging and validation
- ✅ `.env` - Added `NEXT_PUBLIC_BASE_URL` with comments
