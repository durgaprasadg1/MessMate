import EditMess from "@/Component/IndividualMess/EditMess";
const MessInfoEdit = async ({ params }) => {
  const { id } = await params;
  return (
    <div className="bg-gray-800">
      <EditMess messID={id} />
    </div>
  );
};

export default MessInfoEdit;
