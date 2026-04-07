"use client";
import { useRouter } from "next/navigation";

const AdminActionCard = ({ href, title, description, className = "" }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <div
      className={`p-6 rounded-2xl border border-stone-200 bg-white/95 shadow-sm hover:shadow-md transition ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-stone-900 mb-2">{title}</h3>
          <p className="text-stone-600 mb-4">{description}</p>
        </div>
        <div>
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition shadow-sm"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionCard;
