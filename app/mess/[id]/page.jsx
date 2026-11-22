import logger from "@/lib/server/logging/logger";
import MessDetails from "../../../Component/IndividualMess/MessDetails";
import MessNotFound from "../../../Component/Others/MessNotFound";
import { getPublicMess } from "@/lib/server/services/messQueries";

const log = logger.child({ page: "mess" });

export default async function ShowMess({ params }) {
  const { id } = (await params) || {};

  if (!id || typeof id !== "string") {
    return <MessNotFound />;
  }

  let mess = null;
  try {
    // direct read (cached): no HTTP request back to our own server
    ({ mess } = await getPublicMess(id));
  } catch (error) {
    log.error("Error showing a mess", { err: error });
  }

  if (!mess) {
    return <MessNotFound />;
  }

  return (
    <div className="md:pl-[20vw]">
      <MessDetails mess={mess} />
    </div>
  );
}
