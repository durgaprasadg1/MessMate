"use client";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import PersonalInfo from "@/Component/Consumer/PersonalInfo";
import { useSession } from "next-auth/react";
const OwnerPage = () => {
  const { data: session } = useSession();
  return (
    <div className="role-shell">
      <OwnerNavbar />
      <div className="role-container">
        <div className="role-section p-6 sm:p-8">
          <PersonalInfo consumerid={session?.user?.id} />
        </div>
      </div>
    </div>
  );
};

export default OwnerPage;
