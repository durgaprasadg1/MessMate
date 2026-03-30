import Navbar from "@/Component/Others/Navbar";
import MessDetails from "../../../Component/IndividualMess/MessDetails";
import MessNotFound from "../../../Component/Others/MessNotFound";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default async function ShowMess({ params }) {
  try {
    const { id } = params || {};
    const base = getBaseUrl();

    if (!id || typeof id !== "string") {
      console.error("[ShowMess] Missing mess id in route params", params);
      return <MessNotFound />;
    }

    // DEBUG: Log the ID and URL being fetched
    console.log("[ShowMess] Received id:", id);
    console.log("[ShowMess] Base URL:", base);
    console.log("[ShowMess] Fetching from:", `${base}/api/mess/${encodeURIComponent(id)}`);

    const res = await fetch(`${base}/api/mess/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      // DEBUG: Log failed response
      const errorData = await res.json().catch(() => ({}));
      console.error(
        "[ShowMess] API Error - Status:",
        res.status,
        "Data:",
        errorData,
      );
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
