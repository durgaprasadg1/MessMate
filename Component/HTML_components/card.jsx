
import KeyVals from './keyValuepairs'
import Button from "../Others/Button"
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {  useState } from 'react';
const Card = ({ user }) => {
  const [isBlocked, setIsBlocked] = useState(user.isBlocked);
  const [loading, setLoading] = useState(false);

  const handleBlockingOfUser = async (userId) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/blockings/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "toggleOpen" }),
      });

      if (!res.ok) {
        toast.error("Something Error Occured While Blocking the User");
        return;
      }

      setIsBlocked((prev) => {
        const newVal = !prev;
        if (newVal) {
          toast.success("User Blocked");
        } else {
          toast.success("User Unblocked");
        }
        return newVal;
      });
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white mt-1">
      <div className="p-2">
        <h5 className="font-bold mb-2">{user?.username}</h5>

        <KeyVals data="ID" val={user?._id} />
        <KeyVals data="Email" val={user?.email} />
        <KeyVals data="Phone" val={user?.phone} />
        <KeyVals data="Orders" val={user?.orders.length} />
        <KeyVals data="Reviews" val={user?.reviews.length} />

        <div className="flex justify-between items-center">
          {user?.reviews.length === 0 ? (
            <Button data="See Reviews" link={`/consumer/${user?._id}/reviews`} />
          ) : null}
          <button
            className="bg-yellow-300 text-black font-medium p-1.5 transition-colors duration-300 rounded hover:bg-yellow-500"
            onClick={() => SendWarningMail(user._id, user.email)}
          >
            Send Warning
          </button>
        </div>

        <div className="flex justify-between items-center mt-1">
          <button
            disabled={loading}
            className={
              !isBlocked
                ? "w-full bg-red-300 text-black font-medium p-1.5 transition-colors duration-300 rounded hover:bg-red-500"
                : "w-full bg-green-300 text-black font-medium p-1.5 transition-colors duration-300 rounded hover:bg-green-500"
            }
            onClick={() => handleBlockingOfUser(user._id)}
          >
            {!isBlocked ? "Block User" : "Unblock User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
