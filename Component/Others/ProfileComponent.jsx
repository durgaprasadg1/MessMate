import {useSession} from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegUser } from "react-icons/fa";
const ProfileComponent = () => {
    const { data: session } = useSession();
    const isAdmin = session?.user?.isAdmin;
    const router = useRouter();
    const handleUserProfileClick = () => {
        let endpt = "";
        if (!isAdmin) endpt = `/consumer/${session.user.id}`;
        else {
          endpt = `/admin/${session.user.id}`;
        }
        router.push(endpt);
      };
      
  return <div
                className="flex items-center gap-2 hover:cursor-pointer"
                onClick={handleUserProfileClick}
              >
                
                <FaRegUser className="text-gray-700"/>
                <span className="text-sm font-medium text-gray-700 hover:text-black">
                  {session?.user?.isAdmin ? session?.user?.name : session?.user?.username}
                  
                </span>
              </div>
}

export default ProfileComponent;