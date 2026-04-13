import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import MessMenuComponent from "@/Component/IndividualMess/FillMenuComponent";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default async function UpdateMenuPage({ params }) {
  const { id } = await params;

  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/mess/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <>
        <OwnerNavbar />

        <div className="min-h-screen  flex items-center justify-center bg-gray-950">
          <div className="p-7 bg-gray-800 rounded text-white  text-center">
            ----- Mess not found ------
          </div>
        </div>
      </>
    );
  }

  const mess = await res.json();

  return (
    <div className="role-shell">
      <OwnerNavbar />
      <main className="role-container">
        <div className="space-y-4">
          <div className="role-section p-5 sm:p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">
              Menu & Pricing
            </p>
            <h2 className="text-3xl font-extrabold text-emerald-900 mt-2">
              Update Menu for {mess.name}
            </h2>
            <p className="text-sm text-emerald-700 mt-2">
              Keep your diners excited with a fresh, clear menu. Use the tabs
              below to switch between Veg and Non-Veg.
            </p>
          </div>

          <MessMenuComponent messId={id} mess={mess} category={mess.category} />
        </div>
      </main>
    </div>
  );
}
