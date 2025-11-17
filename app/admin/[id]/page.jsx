import AdminNavbar from "@/Component/Admin/AdminNavbar";
import PersonalInfo from "../../../Component/Consumer/PersonalInfo";
export default async function ConsumerPage({ params }) {
  const { id } = await params;

  return (
    <div>
      <AdminNavbar />
      
      <PersonalInfo consumerid={id} />
    </div>
  );
}
