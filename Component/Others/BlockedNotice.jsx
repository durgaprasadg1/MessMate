// Component/Others/BlockedNotice.tsx

export default function BlockedNotice() {
  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-3">Account Access Restricted</h2>
      <p className="text-gray-700 mb-2">
        Your account has been blocked due to activity that does not align with our
        usage policies.
      </p>
      <p className="text-gray-700">
        If you believe this is a mistake or want to request a review, please contact
        our support team.
      </p>
    </div>
  );
}
