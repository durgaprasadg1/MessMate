import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions.js";
import { homeFor } from "../../navRouting.js";

/**
 * For sign-in / register pages: a signed-in visitor is sent to their own
 * dashboard on the server, so the form is never even rendered for them.
 */
export async function redirectIfSignedIn() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(homeFor(session.user));
}
