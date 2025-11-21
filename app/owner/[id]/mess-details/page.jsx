"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Panel from "@/Component/Owner/Panel"
import { useParams } from "next/navigation";
import Link from "next/link";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
import {useRouter} from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/Component/Others/Loading";
import EmptynessShowBox from "@/Component/Others/EmptynessShowBox";

export default function OwnedMessPage() {

  const { id } = useParams();
  const router = useRouter();
  const [messes, setMesses] = useState([]);
  const { data: session } = useSession();
    
  useEffect(() => {
    const fetchMesses = async () => {
      try {
        const res = await fetch(`/api/owner/${id}/mess-details`);
        
        if (!res.ok) {
          console.error("Failed to fetch mess details: ", res.statusText);
          return;
        }
        
        const data = await res.json();     
        setMesses(data.messes);
      } catch (err) {
        console.error(err);
        return;
      }
    };
    fetchMesses();

   

    return;
  }, [id]);

  const handleClick = (link) => { 
    router.push(link);
  }

  if (!session || session?.user?.isOwner === false) {
      return (
        <Loading/>
      );
    }
  


  return (
    <div className="min-h-screen bg-gray-100 ">
      <OwnerNavbar />

      {messes.length === 0 ? (  
        <EmptynessShowBox heading="No Mess Registered" link={`/owner/${session?.user?.id}/new-mess`} linkmsg="Click Here to Register a Mess Now." />
      
    ):("")}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold text-center mb-10"
      >
        Your Registered Mess
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto "
      >
        {messes.map((mess) => (
          <motion.div key={mess._id} whileHover={{ scale: 1.03 }}>
          {!mess.isVerified ? <div >   <EmptynessShowBox heading="Your Mess Is Currently Under Verication" data="" link=""  /> </div>:
            <Card className="rounded-2xl shadow-lg bg-white cursor-pointer w-102">
              <CardContent className="">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {mess.name}
                  </h1>
                  <p className="text-gray-500 mt-1 text-md">
                    Type :{" "}
                    {mess.category === "both" ? "Veg + Non-Veg" : mess.category}{" "}
                    {" -> "}
                    {mess.isLimited ? "Limited" : "Unlimited"}
                  </p>
                  <p
                    className={`${
                      mess.isOpen ? " text-green-600" : " text-red-600"
                    }`}
                  >
                    {mess.isOpen ? "Open" : "Closed"}
                  </p>
                </div>
                <div className="text-left sm:mt-0">
                  <div className="flex gap-3">
                    <p className="text-gray-700">
                      <span className="font-medium">Owner:</span>{" "}
                      {mess.ownerName}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Phone:</span>{" "}
                      {mess.phoneNumber}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <p className="text-gray-700">
                      <span className="font-medium">Aadhaar:</span>{" "}
                      {mess.adharNumber}
                    </p>

                    {mess.lat && mess.lon && (
                      <p className="text-sm  flex items-center gap-2">
                        <span className="font-medium">Location :</span>
                        <Link
                          href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`}
                          target="_blank"
                        >
                          <button className="py-1 rounded text-black hover:bg-gray-100 p-1">
                            On Map
                          </button>
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
                <Panel mess={mess} />
                <div className="flex items-center justify-between gap-1 mt-1">
                    <button className="w-full bg-green-500 p-2 rounded hover:bg-green-600 text-white font-medium" onClick={()=>handleClick(`/mess/${mess._id}/messages`)}>Messages</button>
                    <button className="w-full bg-green-500 p-2 rounded hover:bg-green-600 text-white font-medium"onClick={()=> handleClick(`/mess/${mess._id}/orders`)}>Orders</button>
                </div>

            
               </CardContent>
            </Card>
            }
            <div className="container h-80 w-full ">
                    
          </div>
          </motion.div>

          



        ))}
      </motion.div>
    </div>
  );
}
