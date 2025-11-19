"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Store, ClipboardList } from "lucide-react";
import OwnerNavbar from "../../Component/Owner/OwnerNavbar";
import { useSession } from "next-auth/react";

export default function OwnerLandingPage() {
  const { data: session } = useSession();
  if (!session || session?.user?.isOwner === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full flex items-center justify-center py-8">
          <div className="p-6 bg-white max-w-md w-full rounded-2xl shadow-md border border-gray-100 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Un-Authorized Access
            </h3>
            <p className="text-sm text-gray-500">
              You don't have any access. Register as Mess Owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <OwnerNavbar />
      <section className="bg-gray-800 text-white py-20 px-6 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold mb-4"
        >
          Mess Owner Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg max-w-2xl text-gray-300"
        >
          Manage your mess, track performance, update menus, and maintain
          service quality — all in one place.
        </motion.p>
        <>
          <Button className="bg-gray-600 hover:bg-black text-white  text-lg rounded">
            Get Started
          </Button>
        </>
      </section>

      <section className="py-14 px-6 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 text-center">
            <Store className="mx-auto h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Mess Overview</h2>
            <p className="text-gray-600">
              View statistics, performance, ratings, and all essential details.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 text-center">
            <ClipboardList className="mx-auto h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Menu & Updates</h2>
            <p className="text-gray-600">
              Update daily menu, add announcements, and communicate with
              students.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 text-center">
            <Home className="mx-auto h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analytics </h2>
            <p className="text-gray-600">
              Manage mess and analyze performance metrics.
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-6 text-center mt-auto">
        © 2025 MessMate — All Rights Reserved
      </footer>
    </div>
  );
}
