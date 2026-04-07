"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Loading from "@/Component/Others/Loading";
import { toast } from "react-toastify";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import { DataTable } from "@/Component/ShadCnUI/table";

export default function YourMessRegisteredUser() {
  const messId = useParams().id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [filterAllowed, setFilterAllowed] = useState("all");

  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newJoiningDate, setNewJoiningDate] = useState("");

  const [showAddDaysModal, setShowAddDaysModal] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState("");

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const showInvoiceModalFunc = (user) => {
    setSelectedInvoice(user);
    setShowInvoiceModal(true);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/owner/${messId}/new-reg-customers`);
      const data = await res.json();

      if (!res.ok) return setUsers([]);

      const processed = data?.newMessCustomer?.map((user) => {
        const today = new Date();
        const joining = new Date(user.joiningDate);
        const passedDays = Math.floor(
          (today - joining) / (1000 * 60 * 60 * 24)
        );

        const totalDuration = user?.messDuration || 30;
        const remainingDays = Math.max(totalDuration - passedDays, 0);

        return {
          ...user,
          remainingDays,
          highlight:
            remainingDays === 0 ? "over" : remainingDays < 5 ? "low" : "normal",
          joiningDateFormatted: joining.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };
      });

      setUsers(processed || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messId) fetchUsers();
  }, [messId]);

  const filteredUsers = useMemo(() => {
    if (filterAllowed === "allowed")
      return users.filter((u) => u.isAllowed === true);
    if (filterAllowed === "notallowed")
      return users.filter((u) => u.isAllowed === false);
    return users;
  }, [users, filterAllowed]);

  const openDateModal = (userId, joiningDate) => {
    setSelectedUser(userId);
    const formatted = new Date(joiningDate).toISOString().split("T")[0];
    setNewJoiningDate(formatted);
    setShowDateModal(true);
  };

  const saveNewDate = async () => {
    if (!newJoiningDate) return toast.error("Please choose a date");

    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/${messId}/new-reg-customers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          joiningDate: newJoiningDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Joining date updated");
        setShowDateModal(false);
        fetchUsers();
      } else toast.error(data.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAllow = async (userId, currentState) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/${messId}/new-reg-customers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          allow: !currentState,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
      } else toast.error(data.message);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm("Are you sure?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/${messId}/new-reg-customers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Deleted successfully");
        fetchUsers();
      } else toast.error(data.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openAddDaysModal = (userId) => {
    setSelectedUser(userId);
    setDaysToAdd("");
    setShowAddDaysModal(true);
  };

  const saveAddedDays = async () => {
    if (!daysToAdd || isNaN(daysToAdd) || daysToAdd <= 0)
      return toast.error("Enter valid days");

    setActionLoading(true);
    try {
      const res = await fetch(`/api/owner/${messId}/new-reg-customers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          addDays: Number(daysToAdd),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Days added successfully");
        setShowAddDaysModal(false);
        fetchUsers();
      } else toast.error(data.message);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-900">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-emerald-900">{row.original.phoneNum}</span>
        ),
      },
      {
        accessorKey: "foodPreference",
        header: "Food",
        cell: ({ row }) => (
          <span className="text-emerald-900">
            {row.original.foodPreference === "Both"
              ? "Veg + Non-Veg"
              : row.original.foodPreference}
          </span>
        ),
      },
      {
        accessorKey: "duration",
        header: "Meal",
        cell: ({ row }) => (
          <span className="text-emerald-900">
            {row.original.duration === "daynight"
              ? "Day & Night"
              : row.original.duration}
          </span>
        ),
      },
      {
        accessorKey: "joiningDateFormatted",
        header: "Joining",
        cell: ({ row }) => (
          <span className="text-emerald-900">
            {row.original.joiningDateFormatted}
          </span>
        ),
      },
      {
        accessorKey: "remainingDays",
        header: "Left",
        cell: ({ row }) => (
          <span
            className={
              row.original.highlight === "over"
                ? "text-rose-700 font-bold"
                : row.original.highlight === "low"
                ? "text-amber-700 font-semibold"
                : "text-emerald-700 font-semibold"
            }
          >
            {row.original.remainingDays}
          </span>
        ),
      },
      {
        accessorKey: "paymentMode",
        header: "Payment",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
           
            {row.original.paymentMode === "upi" &&
              row.original.paymentVerified && (
                <button
                  onClick={() => showInvoiceModalFunc(row.original)}
                  className="px-2 py-0.5 text-xs rounded bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {row.original.paymentMode === "upi" ? "Online : " : "Cash : "} View Invoice
                </button>
              )}
          </div>
        ),
      },
      {
        accessorKey: "isAllowed",
        header: "Allowed",
        cell: ({ row }) => (
          <span
            className={
              row.original.isAllowed
                ? "text-emerald-700 font-semibold"
                : "text-rose-600 font-semibold"
            }
          >
            {row.original.isAllowed ? "Yes" : "No"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 text-white">
            <button
              onClick={() =>
                openDateModal(row.original._id, row.original.joiningDate)
              }
              className="px-3 py-1 text-xs rounded bg-teal-500 hover:bg-teal-600 text-white"
            >
              Update Date
            </button>

            <button
              onClick={() => openAddDaysModal(row.original._id)}
              className="px-3 py-1 text-xs rounded bg-amber-500 text-black hover:bg-amber-600"
            >
              Add Days
            </button>

            <button
              onClick={() =>
                toggleAllow(row.original._id, row.original.isAllowed)
              }
              className={`px-3 py-1 text-xs rounded ${
                row.original.isAllowed
                  ? "bg-slate-500 hover:bg-slate-600"
                : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {row.original.isAllowed ? "Disallow" : "Allow"}
            </button>

            <button
              onClick={() => deleteUser(row.original._id)}
              className="px-3 py-1 text-xs rounded bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [showInvoiceModalFunc]
  );

  if (loading) return <Loading />;

  return (
    <div className="role-shell relative">
      <OwnerNavbar />

      {actionLoading && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50  z-50">
          <Loading />
        </div>
      )}

      <main className="role-container">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 mb-4 sm:mb-6">
          Registered Monthly Mess Users
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setFilterAllowed("allowed")}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded text-sm sm:text-base font-medium ${
              filterAllowed === "allowed"
                ? "bg-emerald-600 text-white"
                : "bg-white text-stone-600 border border-stone-200"
            }`}
          >
            Already Joined ({users.filter((u) => u.isAllowed === true).length})
          </button>
          <button
            onClick={() => setFilterAllowed("notallowed")}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded text-sm sm:text-base font-medium ${
              filterAllowed === "notallowed"
                ? "bg-rose-600 text-white"
                : "bg-white text-stone-600 border border-stone-200"
            }`}
          >
            Join Them ({users.filter((u) => u.isAllowed === false).length})
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-center text-stone-500 mt-10 text-lg">
            No customers found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-xl -mx-0">
            <div className="inline-block min-w-full align-middle role-section p-2">
              <DataTable columns={columns} data={filteredUsers} />
            </div>
          </div>
        )}
      </main>

      {showDateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">
              Select New Joining Date
            </h3>
            <input
              type="date"
              value={newJoiningDate}
              onChange={(e) => setNewJoiningDate(e.target.value)}
              className="border border-stone-200 rounded px-3 py-2 w-full mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDateModal(false)}
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={saveNewDate}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddDaysModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Add Extra Days</h3>
            <input
              type="number"
              value={daysToAdd}
              min="1"
              onChange={(e) => setDaysToAdd(e.target.value)}
              placeholder="Enter days"
              className="border border-stone-200 rounded px-3 py-2 w-full mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddDaysModal(false)}
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={saveAddedDays}
                className="px-4 py-2 bg-amber-500 text-black rounded hover:bg-amber-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              Payment Invoice
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Name:</span>
                <span className="font-semibold text-gray-800">
                  {selectedInvoice.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold text-gray-800">
                  {selectedInvoice.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-800">
                  {selectedInvoice.duration}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600 text-lg">
                  ₹{selectedInvoice.totalAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-mono text-xs text-gray-800 break-all">
                  {selectedInvoice.razorpayPaymentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs text-gray-800 break-all">
                  {selectedInvoice.razorpayOrderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className="font-semibold text-green-600">
                  {selectedInvoice.paymentVerified ? "✓ Verified" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration Date:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(
                    selectedInvoice.createdAt || selectedInvoice.joiningDate
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
