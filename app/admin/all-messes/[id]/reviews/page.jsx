import ShowReviewComponent from "@/Component/IndividualMess/showReviewComponent";
import MessNotFound from "@/Component/Others/MessNotFound";
import { getBaseUrl } from "@/lib/getBaseUrl";

const page = async ({ params }) => {
  let { id } = await params;
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/mess/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return <MessNotFound />;
    }
    const mess = await res.json();
    return (
      <ShowReviewComponent reviews={mess.reviews} mess={mess} isAdmin={true} />
    );
  } catch (error) {
    console.error("Error fetching messes:", error?.message || error);
    return <MessNotFound />;
  }
};

export default page;
