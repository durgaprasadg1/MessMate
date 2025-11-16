import { Label } from "@/components/ui/label";

const LabelForRendering = ({ labelName }) => {
  return <Label className="block text-gray-700 font-semibold mb-2">
    {labelName}
        </Label>
};

export default LabelForRendering;