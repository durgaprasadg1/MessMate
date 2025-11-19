import EditMess from "@/Component/IndividualMess/EditMess";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
const MessInfoEdit = async ({ params }) => {
  const { id } = await params;
  return (
    <div>
      <OwnerNavbar />
      <EditMess messID={id} />
    </div>
  );
};

export default MessInfoEdit;
