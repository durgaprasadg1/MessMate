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
import MenuComponent from "@/Component/IndividualMess/MenuComponent";

export default function OwnedMessPage() {

  const { id } = useParams();
  const router = useRouter();
  const [messes, setMesses] = useState([]);
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner;
  console.log("Is Owner: ", isOwner);
    
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

  if (!session || isOwner === false) {
      return (
        <Loading/>
      );
    }
    

  return (
    <div className="min-h-screen bg-gray-800 pb-10">
      <OwnerNavbar />

      {messes.length === 0 ? (  
        <EmptynessShowBox heading="No Mess Registered" link={`/owner/${session?.user?.id}/new-mess`} linkmsg="Click Here to Register a Mess Now." />
      
    ):(<div className="text-5xl text-amber-400 text-center font-medium">
        You have registered mess.
      </div>)}
      
        {messes.map((mess) => (
          <div key={mess._id} className="p-6 flex gap-3" >
          {!mess.isVerified ? <div >   <EmptynessShowBox heading="Your Mess Is Currently Under Verication" data="" link=""  /> </div>:
            <Card className="rounded-2xl shadow-lg bg-zinc-800 cursor-pointer w-102">
              <CardContent className="">
                <div>
                 <h4 className="text-white ">🍱{mess.name}</h4>
                  <p className="text-white mt-1 text-md">
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
                    <p className="text-white ">
                      <span className="font-medium">Owner:</span>{" "}
                      {mess.ownerName}
                    </p>
                    <p className="text-white ">
                      <span className="font-medium">Phone:</span>{" "}
                      {mess.phoneNumber}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <p className="text-white ">
                      <span className="font-medium">Aadhaar:</span>{" "}
                      {mess.adharNumber}
                    </p>

                    {mess.lat && mess.lon && (
                      <p className="text-sm  flex items-center gap-2">
                        <span className="font-medium text-white">Location :</span>
                        <Link
                          href={`https://www.google.com/maps?q=${mess.lat},${mess.lon}`}
                          target="_blank"
                        >
                          <button className="py-1 rounded text-white  hover:bg-zinc-700 p-1">
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
                <button className="w-full bg-white p-2 rounded mt-2"onClick={()=>handleClick(`/mess/${mess._id}/analytics`)}>View Analytics</button>

            
               </CardContent>
            </Card>
            }
            <div className="container h-80 w-full " >
            

                 {mess.vegMenu.length > 0 || mess.nonVegMenu.length >  0 ? (<div>
                  {mess.vegMenu?.length > 0 && (
                    <MenuComponent mess={mess} isOwner={isOwner} />
          )}

          </div>
                 ) : (<>
                  {mess.vegMenu.length === 0 && (
                    <EmptynessShowBox heading="No Veg Menu Added Yet" link={`/owner/${session?.user?.id}/mess/${mess._id}/add-menu`} linkmsg="Click Here to Add Veg Menu Now." />
                  )}
                  {mess.nonVegMenu.length === 0 && (
                    <EmptynessShowBox heading="No Non-Veg Menu Added Yet" link={`/owner/${session?.user?.id}/mess/${mess._id}/add-menu`} linkmsg="Click Here to Add Non-Veg Menu Now." />
                  )}

                 </>)
}
                  
          </div>
          </div>

          



        ))}
      
    </div>
  );
}
