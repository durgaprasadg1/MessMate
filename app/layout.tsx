import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import NextTopLoader from "nextjs-toploader";
// Classic serif families, self-hosted (no request to Google at runtime or build time)
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/lora";
import "./globals.css";
import Provider from "../Component/Others/Provider";
import AppShell from "../Component/Others/AppShell";
import Script from "next/script";
import { authOptions } from "@/lib/server/auth/authOptions";

export const metadata: Metadata = {
  title: "MessMate",
  description: "Your Ultimate Mess Management Solution",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read once on the server so the client starts with the right session.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
          integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
        />
      </head>
      <body className="antialiased">
        {/* thin orange progress bar: instant feedback the moment a link is clicked */}
        <NextTopLoader color="#f97316" height={3} showSpinner={false} shadow="0 0 10px #f97316,0 0 5px #f97316" />
        <Provider session={session}>
          <AppShell>{children}</AppShell>
        </Provider>
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
