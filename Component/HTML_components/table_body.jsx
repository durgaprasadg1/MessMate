import { useContext } from "react";
import { tableContext } from "@/hooks/tableContext";

const TableBody = ({
  tableName = "Table",
  heading1 = "Col1",
  heading2 = "Col2",
  heading3 = "Col3",
}) => {
  const { recentSignups = [] } = useContext(tableContext) || {};

  return (
    <div className="role-section p-5">
      <h3 className="text-lg font-semibold text-stone-900 mb-3">{tableName}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-800">
          <thead>
            <tr className="text-stone-500">
              <th className="pb-2 text-sm font-semibold text-stone-700">{heading1}</th>
              <th className="pb-2 text-sm font-semibold text-stone-700">{heading2}</th>
              <th className="pb-2 text-sm font-semibold text-stone-700">{heading3}</th>
              
            </tr>
          </thead>
          <tbody>
            {recentSignups.map((c) => (
              <tr key={c._id || Date.now()+Math.random(1,9403430)} className="border-t border-stone-100 text-stone-800">
                <td className="py-2">{c.username}</td>
                <td className="py-2">{c.email}</td>
               
              </tr>
            ))}
            {recentSignups.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-stone-500">
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableBody;
