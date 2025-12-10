import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const { default: Consumer } = await import("@/models/consumer");
    const users = await Consumer.find({})
      .sort({ _id: -1 })
      .limit(200)
      .select("username email")
      .lean();

    return Response.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Users API Error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
