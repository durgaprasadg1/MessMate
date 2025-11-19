"use client";

import { useParams } from "next/navigation";
import  { useEffect, useState } from "react";
import Loading from "@/Component/Others/Loading";
import Navbar from "@/Component/Others/Navbar";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

const MessageComponent = () => {
  const {data : session} = useSession();
  const {id} = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/mess/${id}`);
        if (!res.ok) {
          setError(data.message || "Failed to fetch messages");
          return;
        }

        const data = await res.json();
        if(session?.user?.id !== data.owner){
            isUnAuth = true;
        }

        console.log("Fetched Mess Data:", data.owner);
        setMessages(data.alert || []);
      } catch (err) {
        setError("Internet connection error");
      } finally {
        setLoading(false);
      }
    };
      


    fetchMessages();
  }, []);


  const handleDelete = async (msgId) => {
    try {
      console.log("Deleting Message ID:", msgId);
      const res = await fetch(`/api/admin/sendmsg/${msgId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId: msgId }),
      }); 
      const data = await res.json();
      if (!res.ok) {
        toast.error("Something went wrong!"); ;
        return;
      }
      toast.success("Message Deleted !"); ;
        return;
    } catch (err) {
      toast.error("Internet connection error");
    } 
  };

  if (loading)
    return (
      <Loading/>
    );

   
  if (error)
    return (
      <div className="p-4 text-red-600 font-medium">
        {error}
      </div>
    );

  return (

    <div className="space-y-4 p-4  min-h-screen">
        <Navbar/>
      <h2 className="text-xl font-semibold mt-5">Messages</h2>


      {messages.length === 0 ? (
        <p className="text-gray-600">No messages found.</p>
      ) : (
        <div className=" grid grid-cols-3 gap-4">
          {messages.map((msg) => (
          
            <div
              key={msg._id}
              className="border rounded flex justify-between items-center p-3 shadow-sm bg-gray-100"
            >
              <p className="font-medium">{msg.message}</p>
              <button className="bg-emerald-500 p-2 rounded text-black border-gray-300 hover:bg-emerald-600 transition-colors duration-300 " onClick={()=> handleDelete(msg._id)} >
                Delete
            </button>
            </div>
            
        
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageComponent;
