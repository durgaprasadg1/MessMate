"use client";

import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ExploreProvider } from "@/contexts/ExploreContext";
import { SWRConfig } from "swr";

/**
 * `session` is read on the server (root layout) and handed to the client, so
 * `useSession()` already knows who is signed in on the very first paint: no
 * "loading" state, no logged-out flash, no redirect delay on /login.
 */
export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchInterval={0}>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateIfStale: true,
          dedupingInterval: 5000,
          keepPreviousData: true,
          errorRetryCount: 2,
        }}
      >
        <NotificationProvider>
          <ExploreProvider>
            {children}
            <ToastContainer position="top-right" autoClose={3000} pauseOnHover />
          </ExploreProvider>
        </NotificationProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
