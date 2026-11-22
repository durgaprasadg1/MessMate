import ShowReviewComponent from "@/Component/IndividualMess/showReviewComponent";
import MessNotFound from "@/Component/Others/MessNotFound";
import { getPublicMess } from "@/lib/server/services/messQueries";

const page = async ({ params }) => {
  let { id } = await params;
  try {
    const { mess } = await getPublicMess(id);
    if (!mess) {
      return <MessNotFound />;
    }
    return (
      <ShowReviewComponent reviews={mess.reviews} mess={mess} isAdmin={true} />
    );
  } catch (error) {
    void error;
    return <MessNotFound />;
  }
};

export default page;
