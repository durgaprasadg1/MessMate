import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
const LabelForRendering = ({ labelName }) => {
  const { data: session } = useSession();
  return <Label className={`block text-gray-700 font-semibold mb-2`}>
    {labelName}
        </Label>
};

export default LabelForRendering;