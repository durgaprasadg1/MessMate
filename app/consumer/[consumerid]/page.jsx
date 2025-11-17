'use client'
import PersonalInfo from "@/Component/Consumer/PersonalInfo";
import Navbar from "@/Component/Others/Navbar";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
export default  function ConsumerPage({ params }) {
  const { consumerid } = useParams();
  const {data :session} =  useSession();
  const isCurrentUserTheSameCustomer = session?.user?.id === consumerid;
 

  return( 
  <div>
    <Navbar/>
    <br /><br />
    
      {isCurrentUserTheSameCustomer?<PersonalInfo consumerid={consumerid} />:""}
    
    
  </div>);
}