"use client"
import {useSession} from "next-auth/react";
const Loading = () => {
  const {data : session} = useSession();
  const isOwner = session?.user?.isOwner;
  return (
    <div className={isOwner ? "bg-gray-950 flex flex-col items-center justify-center min-h-screen  " : "flex flex-col items-center justify-center min-h-screen"}>
      

      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"> 
          
        </div>
      </div>

    
    </div>
  );
};

export default Loading;
