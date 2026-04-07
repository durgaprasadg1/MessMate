import AdminSidebar from "@/Component/Admin/AdminSidebar";
import VerificationComponent from "@/Component/Admin/VerificationComponent";
const AdminForVerification = () => {
  return (
    <div className="role-shell">
      <AdminSidebar />
      <div className="role-container">
        <div className="role-section p-5 sm:p-6">
        <VerificationComponent />
        </div>
      </div>
    </div>
  );
};

export default AdminForVerification;
