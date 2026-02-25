import React from "react";
const MessNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600 text-xl">
      <div className="w-full flex items-center justify-center py-8">
            <div className="p-6 bg-white max-w-md w-full rounded-2xl shadow-md border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    MessMate
              </h3>
             
              <p className="text-sm text-gray-500">
                 Mess not found!
              </p>
 
            </div>
          </div>
    </div>
  );
};

export default MessNotFound;
