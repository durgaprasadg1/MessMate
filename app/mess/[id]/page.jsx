import Navbar from "@/Component/Others/Navbar";
import MessDetails from "../../../Component/IndividualMess/MessDetails";
import MessNotFound from "../../../Component/Others/MessNotFound";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default async function ShowMess({ params }) {
  const { id } = (await params) || {};
  const base = await getBaseUrl();

  if (!id || typeof id !== "string") {
    return <MessNotFound />;
  }

  let mess = null;

  try {
    const res = await fetch(`${base}/api/mess/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.log("Failed to fetch mess details:", {
        status: res.status,
        statusText: res.statusText,
        errorData,
      });
    } else {
      mess = await res.json();
    }
  } catch (error) {
    console.log("error in showing a Mess :", error);
  }

  if (!mess) {
    return <MessNotFound />;
  }

  return (
    <div className="md:pl-[20vw]">
      <Navbar />
      <MessDetails mess={mess} />
    </div>
  );
}
