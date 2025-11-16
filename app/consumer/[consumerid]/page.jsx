import PersonalInfo from "@/Component/Consumer/PersonalInfo";
import Navbar from "@/Component/Others/Navbar";
export default async function ConsumerPage({ params }) {
  const { consumerid } = await params; 

  return( 
  <div>
    <Navbar/>
    <br /><br />
    <PersonalInfo consumerid={consumerid} />
  </div>);
}