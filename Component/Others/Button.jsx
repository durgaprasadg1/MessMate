"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

const ButtonComponent = ({ data, link }) => {
  const { data: session } = useSession();

  const router = useRouter();

  const handleClick = (link) => {
    if (link) {
      router.push(link);
    }
  };

  return (
    <div>
      <Button
        className={session?.user?.isAdmin  ? "bg-purple-300 text-black font-medium hover:bg-purple-500 transition-colors duration-300 rounded" : " bg-gray-600 text-white font-medium hover:bg-black transition-colors duration-300 rounded"}
        onClick={() => handleClick(link)}
      > 
        {data}
      </Button>
    </div>
  );
};

export default ButtonComponent;
