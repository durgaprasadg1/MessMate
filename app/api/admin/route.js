import { connectDB } from "@/lib/mongodb";
import Consumer from "@/models/consumer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const users = await Consumer.find({})
      .sort({ _id: -1 })
      .limit(200)
      .select("username email")
      .lean();

    return Response.json(
      { success: true, users },
      { status: 200 }
    );
  } catch (error) {
    console.error("Users API Error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
