"use client";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import PersonalInfo from "@/Component/Consumer/PersonalInfo";
import { useSession } from "next-auth/react";
const OwnerPage = () => {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-gray-800">
      <OwnerNavbar />
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <PersonalInfo consumerid={session?.user?.id} />
      </div>
    </div>
  );
};

export default OwnerPage;
