import AdminNavbar from "@/Component/Admin/AdminNavbar";
import VerificationComponent from "@/Component/Admin/VerificationComponent";
const AdminForVerification = () => {
  return (
    <div className="min-h-screen bg-zinc-900">
      <AdminNavbar />
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <VerificationComponent />
      </div>
    </div>
  );
};

export default AdminForVerification;
