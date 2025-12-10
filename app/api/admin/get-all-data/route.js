import { connectDB } from "@/lib/mongodb";
import Mess from "@/models/mess";

export async function GET() {
  await connectDB();

  const { default: Consumer } = await import("@/models/consumer");
  const totalUsers = await Consumer.countDocuments({});
  const totalMesses = await Mess.countDocuments({});
  const pendingCount = await Mess.countDocuments({ isVerified: false });

  const recentSignups = await Consumer.find({})
    .sort({ _id: -1 })
    .limit(5)
    .select("username email")
    .lean();

  const pendingMesses = await Mess.find({ isVerified: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name createdAt")
    .lean();

  return Response.json({
    stats: {
      totalUsers,
      totalMesses,
      pendingCount,
    },
    recentSignups: recentSignups.map((c) => ({
      ...c,
      joined: c._id.getTimestamp(),
    })),
    pendingMesses,
  });
}
