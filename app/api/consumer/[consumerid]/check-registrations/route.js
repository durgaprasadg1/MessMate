import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import NewMessCustomer from "@/models/newMessCustomer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find all active registrations for this user
    const registrations = await NewMessCustomer.find({
      customer: session.user.id,
    }).populate("mess", "name category");

    // Filter for active registrations (with remaining days)
    const today = new Date();
    const activeRegistrations = registrations.filter((reg) => {
      const joining = new Date(reg.joiningDate);
      const diffDays = Math.floor((today - joining) / (1000 * 60 * 60 * 24));
      const totalDuration = reg.messDuration || 30;
      const remaining = Math.max(totalDuration - diffDays, 0);
      return remaining > 0;
    });

    return NextResponse.json(
      {
        registrations: activeRegistrations.map((reg) => ({
          duration: reg.duration,
          messName: reg.mess?.name,
          messCategory: reg.mess?.category,
          foodPreference: reg.foodPreference,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
