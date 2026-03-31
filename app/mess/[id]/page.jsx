import Navbar from "@/Component/Others/Navbar";
import MessDetails from "../../../Component/IndividualMess/MessDetails";
import MessNotFound from "../../../Component/Others/MessNotFound";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default async function ShowMess({ params }) {
  try {
    const { id } = await params || {};
    const base = getBaseUrl();

    if (!id || typeof id !== "string") {
      return <MessNotFound />;
    }

  
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
      return <MessNotFound />;
    }
    const mess = await res.json();
    return (
      <div>
        <Navbar />
        <MessDetails mess={mess} />
      </div>
    );
  } catch (error) {
    console.log("error in showing a Mess :", error);

    return <MessNotFound />;
  }
}
