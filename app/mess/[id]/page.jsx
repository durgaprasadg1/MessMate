import Navbar from "@/Component/Others/Navbar";
import MessDetails from "../../../Component/IndividualMess/MessDetails";
import MessNotFound from "../../../Component/Others/MessNotFound";
import { connectDB } from "@/lib/mongodb";
import {
  validateObjectId,
  logValidationError,
} from "@/lib/validateObjectId";

export default async function ShowMess({ params }) {
  try {
    const { id } = (await params) || {};

    if (!id || typeof id !== "string") {
      return <MessNotFound />;
    }

    const validation = validateObjectId(id);
    if (!validation.isValid) {
      logValidationError("ShowMess page", id, validation);
      return <MessNotFound />;
    }

    await connectDB();
    const { default: Mess } = await import("../../../models/mess");

    const mess = await Mess.findById(id)
      .populate("alert")
      .populate("vegMenuRef")
      .populate("nonVegMenuRef")
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
      });

    if (!mess) {
      return <MessNotFound />;
    }

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
