import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
const LabelForRendering = ({ labelName }) => {
  const { data: session } = useSession();
  const isOwner = (session?.user?.isOwner) || false;
  return <Label className={`block text-white  font-semibold mb-2`}>
    {labelName}
        </Label>
};

export default LabelForRendering;