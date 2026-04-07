import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

const isMembershipPaymentComplete = (registration = {}) => {
  const mode = (registration.payment_mode || "").toLowerCase();
  if (mode === "cash") return true;
  return (
    registration.payment_verified === true ||
    registration.payment_status === "paid"
  );
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: registrations = [] } = await supabase
      .from("new_mess_customer")
      .select("*, mess:mess_id(name, category, monthly_mess_duration)")
      .eq("consumer_id", session.user.id);

    const paidRegistrations = registrations.filter(isMembershipPaymentComplete);

    const today = new Date();
    const activeRegistrations = paidRegistrations.filter((reg) => {
      const joining = new Date(reg.joining_date);
      const diffDays = Math.floor((today - joining) / (1000 * 60 * 60 * 24));
      const totalDuration = Number(reg.mess?.monthly_mess_duration || 30);
      const remaining = Math.max(totalDuration - diffDays, 0);
      return remaining > 0;
    });

    return NextResponse.json(
      {
        registrations: activeRegistrations.map((reg) => ({
          duration: reg.duration,
          messName: reg.mess?.name,
          messCategory: reg.mess?.category,
          foodPreference: reg.food_preference,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
