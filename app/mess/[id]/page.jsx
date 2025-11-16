import Navbar from "@/Component/Others/Navbar";
import MessDetails from "../../../Component/IndividualMess/MessDetails";
import MessNotFound from "../../../Component/Others/MessNotFound";

export default async function ShowMess({ params }) {
  try {
    const { id } = await params;
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const res = await fetch(`${base}/api/mess/${id}`, { cache: "no-store" });

    if (!res.ok) {
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
