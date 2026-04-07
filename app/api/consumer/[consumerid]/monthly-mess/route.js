import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";
import { getJsonCache, setJsonCache } from "@/lib/redis";

const TTL_SECONDS = 60 * 60 * 18;

const isMembershipPaymentComplete = (registration = {}) => {
  const mode = (registration.payment_mode || "").toLowerCase();
  if (mode === "cash") return true;
  return (
    registration.payment_verified === true ||
    registration.payment_status === "paid"
  );
};

export async function GET(request, { params }) {
  try {
    const { consumerid } = (await params) || {};

    if (!consumerid) {
      return NextResponse.json(
        { message: "Invalid or missing userId" },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.id !== consumerid) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const tenantId = request.headers.get("x-tenant-id") || "public";
    const cacheKey = `tenant:${tenantId}:consumer:${consumerid}:monthly-mess:v2`;
    const cached = await getJsonCache(cacheKey);
    if (cached !== null) {
      return NextResponse.json({ monthlyMess: cached }, { status: 200 });
    }

    const { data: records = [] } = await supabase
      .from("new_mess_customer")
      .select("*, mess:mess_id(*), consumer:consumer_id(*)")
      .eq("consumer_id", consumerid);

    const paidMemberships = records.filter(isMembershipPaymentComplete);

    if (!paidMemberships || paidMemberships.length === 0) {
      return NextResponse.json(
        { message: "No Monthly Mess subscription found for this user." },
        { status: 404 },
      );
    }

    await setJsonCache(cacheKey, paidMemberships, TTL_SECONDS);

    return NextResponse.json({ monthlyMess: paidMemberships }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
