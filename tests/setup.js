// Deterministic test environment (no real services are contacted).
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.RAZORPAY_SECRET = "rzp_test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_webhook_secret";
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_key";
process.env.SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
process.env.LOG_LEVEL = "silent";
