"use client";

import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/Component/Others/Navbar";
export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg border rounded-2xl bg-white mt-17">
          <CardContent className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Terms & Conditions
            </h1>
            <p className="text-gray-600 text-center">
              Last Updated: {new Date().toLocaleDateString()}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to <strong>MessMate</strong>. These Terms & Conditions
                (“Terms”) govern your access to and use of the MessMate
                application, including all features related to mess management,
                food booking, inventory tracking, and administrative controls.
                By using the application, you acknowledge that you have read,
                understood, and agreed to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                2. Eligibility
              </h2>
              <p className="text-gray-700">
                You must be legally competent and authorized to use this
                application. Institutional users must additionally comply with
                their respective campus, hostel, or organizational policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                3. User Account & Responsibilities
              </h2>

              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  You are responsible for maintaining the confidentiality of
                  your login credentials.
                </li>
                <li>
                  All activities performed through your account are considered
                  your responsibility.
                </li>
                <li>
                  You must provide accurate and up-to-date information.
                </li>
                <li>
                  Misuse, unauthorized access, or attempts to manipulate system
                  data will result in suspension or termination of access.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                4. Food Booking, Payments & Cancellations
              </h2>
              <p className="text-gray-700 mb-2">
                MessMate allows meal bookings, transaction tracking, and
                payment-related operations. The following terms apply:
              </p>

              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Bookings are subject to availability and institutional guidelines.</li>
                <li>
                  Any meal cancellation or modification must follow the rules
                  defined by the mess administration.
                </li>
                <li>
                  Payments, once processed, follow the refund policies of the
                  institution or payment partner.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                5. Data Collection & Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We collect and process user information strictly for providing
                mess-related services. This includes identity details, booking
                history, feedback, and transaction metadata. Your data is handled
                in accordance with applicable data protection standards. We do
                not sell or rent your information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                6. Prohibited Activities
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Attempting to hack, reverse engineer, or exploit the app.</li>
                <li>Providing false identity or impersonating another user.</li>
                <li>Using the app for fraudulent, illegal, or unauthorized actions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                7. Administrative Rights & Modifications
              </h2>
              <p className="text-gray-700">
                MessMate administrators reserve the right to modify menus,
                booking rules, user access levels, and operational timings as
                required. Updates will be communicated through the application or
                official channels.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                8. Limitation of Liability
              </h2>
              <p className="text-gray-700">
                While we strive for accuracy and uptime, MessMate shall not be
                held liable for service interruptions, system errors, data loss,
                or consequences arising from inaccurate user inputs or third-party
                failures.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                9. Suspension & Termination
              </h2>
              <p className="text-gray-700">
                We may suspend or terminate your access without prior notice if
                you violate these Terms or engage in actions that threaten the
                integrity, security, or functioning of the system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                10. Updates to Terms
              </h2>
              <p className="text-gray-700">
                We may revise these Terms periodically. Continued use of the
                application after such updates constitutes acceptance of the
                revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                11. Contact Information
              </h2>
              <p className="text-gray-700">
                For queries regarding these Terms, users may contact the mess
                administration or technical support team through the official
                communication channels available inside the app.
              </p>
            </section>

            <p className="text-center text-sm text-gray-500 pt-4">
              © {new Date().getFullYear()} MessMate. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
