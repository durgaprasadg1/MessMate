"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Rocket,
} from "lucide-react";
import OwnerNavbar from "../../Component/Owner/OwnerNavbar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OwnerLandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = session?.user?.isOwner;

  if (!session || session?.user?.isOwner === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-full flex items-center justify-center py-8 px-4">
          <div className="p-8 bg-gray-800 max-w-lg w-full rounded-2xl shadow-2xl border border-gray-700 text-center">
            <LayoutDashboard className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">
              Authorization Required
            </h3>
            <p className="text-sm text-gray-400">
              You do not have the necessary permissions to access the Owner
              Dashboard. Please ensure you are registered and logged in as a Mess
              Owner.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white w-full"
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const ownerId = session?.user?.id;

  const features = [
    {
      icon: UtensilsCrossed,
      title: "Mess Overview",
      description:
        "Access your mess's profile, operational status, ratings, and primary contact details.",
      link: `/owner`,
      cta: "View Mess Profile",
    },
    {
      icon: ClipboardList,
      title: "Menu & Pricing",
      description:
        "Easily update daily menus, set custom pricing, and notify students of changes instantly.",
      link: `/owner`,
      cta: "Manage Menu",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description:
        "Analyze key metrics like order volume, revenue, and customer feedback to optimize operations.",
      link: `/owner`,
      cta: "View Analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <OwnerNavbar />
      <main className="grow">
        <section className="relative overflow-hidden bg-gray-950 py-24 sm:py-32 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-6xl font-extrabold tracking-tight text-white sm:text-7xl mb-4"
            >
              <span className="text-indigo-400">Owner</span> Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-xl max-w-3xl mx-auto text-gray-400 mb-8"
            >
              Empower your business with real-time management tools. Control your
              mess, track performance, and elevate your service quality.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                onClick={() => router.push(`/owner/${ownerId}/owned-mess`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg transition duration-300"
              >
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Access Your Mess
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Key Management Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
              >
                <Card className="bg-gray-800 border border-gray-700 hover:border-indigo-600 transition duration-300 rounded-xl h-full shadow-xl">
                  <CardContent className="p-8 text-left h-full flex flex-col justify-between">
                    <div>
                      <feature.icon className="h-10 w-10 text-indigo-400 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {feature.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(feature.link)}
                      className="w-full bg-gray-700 border-gray-600 text-indigo-300 hover:bg-gray-600 hover:text-indigo-200"
                    >
                      {feature.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-16 px-6 bg-gray-900">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between p-8 rounded-xl bg-gray-800 border border-indigo-500/50 shadow-2xl">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-3xl font-bold text-white mb-2">
                Register a New Mess
              </h2>
              <p className="text-lg text-gray-400">
                Expand your reach. Get your next mess onboarded quickly.
              </p>
            </div>
            <Button
              onClick={() => router.push(`/owner/${ownerId}/new-mess`)}
              className="bg-teal-500 hover:bg-teal-600 text-white text-md px-6 py-3 rounded-lg shadow-md transition duration-300 flex items-center"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start Registration
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-6 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm">
            &copy; 2025 MessMate Pro. All Rights Reserved.
          </p>
          <p className="text-xs mt-1">
            Developed for Mess Owners by MessMate Team.
          </p>
        </div>
      </footer>
    </div>
  );
}