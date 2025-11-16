"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "./Loading";
import { useSession } from "next-auth/react";
import PersonalInfoWalaBox from "./PersonalInfoWalaBox";

export default function PersonalInfo({ consumerid }) {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.isAdmin;

  useEffect(() => {
    if (!consumerid) return;
    if (session === undefined) return;

    const fetchUser = async () => {
      try {
        const domain = session?.user?.isAdmin ? "admin" : "consumer";

        const res = await fetch(`/api/${domain}/${consumerid}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Error fetching user");
          return;
        }

        const pickedUser = data.consumer || data.admin;
        setUser(pickedUser);

      } catch (err) {
        console.error("Error fetching user:", err);
        toast.error("Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [consumerid, session]);

  if (loading) return <Loading />;

  if (!user) return <></>;

  console.log("User Hai Hum : ",user)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Personal Information
        </h1>
        

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {isAdmin ? <PersonalInfoWalaBox keyy="Name" value={user.name} />: <PersonalInfoWalaBox keyy="Username" value={user.username} /> }
          {isAdmin ? <PersonalInfoWalaBox keyy="Phone" value={user.phoneNumber} />: <PersonalInfoWalaBox keyy="Phone" value={user.phone} /> }
          
          <PersonalInfoWalaBox keyy="Email" value={user.email} />
          <PersonalInfoWalaBox keyy="Address" value={user.address} />
          <PersonalInfoWalaBox keyy="User ID" value={user._id} />

          {!session?.user?.isAdmin && (
            <div className="p-5 bg-gray-100 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">
                Infuse your delightful creations...
              </p>
              <div className="flex gap-2">
                <Link href={`/consumer/${user._id}/new-mess`}>
                  <button className="bg-gray-600 text-white px-3 py-2 rounded shadow-md hover:bg-black transition duration-200 ">
                    Add mess
                  </button>
                </Link>
                <div className="bg-gray-600 rounded p-2 w-30 text-white hover:bg-black">
                  
                  <Link href={`/consumer/${user._id}/edit-info`}>
                    <button className="text-white text-center">Edit your info</button>
                  </Link>
                </div>
              </div>
            </div>
          )}


          
        </div>
      </div>
    </div>
  );
}
