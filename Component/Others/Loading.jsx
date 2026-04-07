"use client"
import {useSession} from "next-auth/react";
const Loading = () => {
  const {data : session} = useSession();
  const isOwner = session?.user?.isOwner;
  return (
    <div className="flex flex-col items-center justify-center py-10">

      <div className="relative flex items-center justify-center">
        <div className={isOwner ? "w-12 h-12 border-4 border-emerald-400/70 border-t-transparent rounded-full animate-spin" : "w-12 h-12 border-4 border-orange-300/70 border-t-transparent rounded-full animate-spin"}> 
          
        </div>
      </div>

    
    </div>
  );
};

export default Loading;
