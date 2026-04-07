"use client";

import { useParams } from "next/navigation";
import  { useEffect, useState } from "react";
import Loading from "@/Component/Others/Loading";
import OwnerNavbar from "@/Component/Owner/OwnerNavbar";
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
          setError("Failed to fetch messages");
          return;
        }

        const data = await res.json();
        if(session?.user?.id !== data.owner){
            isUnAuth = true;
        }
        setMessages(data.alert || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Internet connection error");
      } finally {
        setLoading(false);
      }
    };
      


    fetchMessages();
  }, []);


  const handleDelete = async (msgId) => {
    try {
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
      setMessages(data.alert || []);
      toast.success("Message Deleted !"); ;
        return;
    } catch (err) {
      console.error("Error in deleting message:", err);
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

    <div className="space-y-4 role-shell">
        <OwnerNavbar />
      <div className="role-container">
        <div className="max-w-5xl mx-auto space-y-4 w-full">
          <div className="role-section p-5 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Inbox</p>
              <h2 className="text-2xl font-extrabold text-emerald-900 mt-1">Messages</h2>
              <p className="text-sm text-emerald-700 mt-1">Alerts from admins stay here. Clear them when resolved.</p>
            </div>
            <div className="hidden sm:block text-emerald-500 text-2xl">✉️</div>
          </div>


      {messages.length === 0 ? (
        <div className="w-full flex items-center justify-center py-10">
          <div className="p-6 bg-white border border-emerald-100 w-full max-w-md text-center rounded-2xl shadow-md shadow-emerald-100">
            <p className="text-emerald-800 font-semibold">No messages found.</p>
            <p className="text-sm text-emerald-600 mt-1">Relax, everything is clear for now.</p>
          </div>
        </div>

      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map((msg) => (
          
            <div
              key={msg._id}
              className="border border-emerald-100 rounded-2xl flex justify-between items-start p-4 shadow-sm bg-white/90 backdrop-blur"
            >
              <p className="font-medium text-emerald-900 pr-3 leading-relaxed">{msg.message}</p>
              <button className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-colors duration-200 text-sm font-semibold" onClick={()=> handleDelete(msg._id)} >
                Delete
            </button>
            </div>
            
        
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
