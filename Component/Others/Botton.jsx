import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const Botton = ({ text, link, functionAfterClick, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async (e) => {
    try {
      setLoading(true);
      if (functionAfterClick) await functionAfterClick(e);
      if (link) {
        router.push(link);
        router.refresh();
      }
    } catch (err) {
      console.error("Button action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 block">
      <button
        className={`${className} w-full px-4 py-2 rounded transition duration-300 ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
        onClick={() => handleClick()}
        disabled={loading}
      >
        {loading ? <Spinner /> : text}
      </button>
    </div>
  );
};

export default Botton;
