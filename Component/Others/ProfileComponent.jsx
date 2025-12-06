'use client';
import {useSession} from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegUser } from "react-icons/fa";
const ProfileComponent = ()=> {
    const { data: session } = useSession();
    const isAdmin = session?.user?.isAdmin;
    const isOwner = session?.user?.isOwner;
    const router = useRouter();
    const handleUserProfileClick = () => {


        let endpt = "";
        if (isAdmin) endpt = `/admin/${session?.user?.id}`;
        else if (isOwner) {
          endpt = `/owner/${session?.user?.id}`;
        }
        else {
          endpt = `/consumer/${session?.user?.id}`;
        }
        router.push(endpt);
      };
      
  return <div
                className="flex items-center gap-2 hover:cursor-pointer"
                onClick={handleUserProfileClick}
              >
                
                <FaRegUser className={isOwner? "text-white": isAdmin ? "text-amber-300" :"text-gray-700"}/>
                <span className={isOwner? "text-white":"text-sm font-medium text-amber-300 hover:text-amber-500"}>
                  {session?.user?.username}
                  
                  
                </span>
              </div>
}

export default ProfileComponent;