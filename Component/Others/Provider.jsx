"use client";

import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
        <ToastContainer position="top-right" autoClose={3000} pauseOnHover />
      </NotificationProvider>
    </SessionProvider>
  );
}
