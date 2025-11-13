import PersonalInfo from "../../../Component/PersonalInfo";
import Navbar from "../../../Component/Navbar";
export default async function ConsumerPage({ params }) {
  const { id } = await params; 

  return( 
  <div>
    <Navbar/>
    <br /><br />
    <PersonalInfo consumerid={id} />
  </div>);
}