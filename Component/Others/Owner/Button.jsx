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
        className="bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors duration-300 rounded border border-emerald-200"
        onClick={() => handleClick(link)}
      > 
        {data}
      </Button>
    </div>
  );
};

export default ButtonComponent;
