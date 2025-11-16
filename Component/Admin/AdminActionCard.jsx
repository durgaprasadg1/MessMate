"use client";
import React from "react";
import { useRouter } from "next/navigation";

const AdminActionCard = ({ href, title, description, className = "" }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <div
      className={`p-6 bg-white rounded-lg shadow hover:shadow-md transition ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-500 mb-4">{description}</p>
        </div>
        <div>
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionCard;
