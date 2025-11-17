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
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">{tableName}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="pb-2">{heading1}</th>
              <th className="pb-2">{heading2}</th>
              <th className="pb-2">{heading3}</th>
            </tr>
          </thead>
          <tbody>
            {recentSignups.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="py-2">{c.username}</td>
                <td className="py-2">{c.email}</td>
                <td className="py-2">
                  {new Date(c.joined).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {recentSignups.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-gray-500">
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
