import ShowReviewComponent from '@/Component/IndividualMess/showReviewComponent';
import MessNotFound from '@/Component/Others/MessNotFound';

const page = async({ params }) => {
    let {id} = await params;
    try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mess/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return <MessNotFound />;
    }
    const mess = await res.json();
    return <ShowReviewComponent reviews= {mess.reviews} mess={mess} isAdmin={true} />;
  } catch (error) {
    console.error("Error fetching messes:", error?.message || error);
    return <MessNotFound />;
  }
 
}

export default page