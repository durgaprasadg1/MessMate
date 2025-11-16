import PersonalInfo from "@/Component/Consumer/PersonalInfo";
import Navbar from "@/Component/Others/Navbar";
import {useSession} from "next-auth/react";
export default async function ConsumerPage({ params }) {
  const { consumerid } = params;
  const {data :session} = await useSession();
  const isCurrentUserTheSameCustomer = session?.user?.id === consumerid;
 

  return( 
  <div>
    <Navbar/>
    <br /><br />
    {
      isCurrentUserTheSameCustomer? <PersonalInfo consumerid={consumerid} /> : "Unauthorized Access"
    }
    
  </div>);
}