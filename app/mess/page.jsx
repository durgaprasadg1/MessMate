import AllMesses from '../../Component/AllMess'
import MessNotFound from '../../Component/MessNotFound'
import { toast } from 'react-toastify';
export default async function AllMess(){
  try {
     const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mess`, {cache : "no-store"});
      if(!res.ok){
        <MessNotFound/>
      }
      let messes =await res.json();
      
    return <AllMesses messes={messes}/>
  } catch (error) {
      toast.error("Error fetching mess data");
      console.error("Error In Getting Mess" ,err);
    return ;
  }
 
};

