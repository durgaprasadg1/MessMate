import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const textLinkClass =
    "text-slate-500! hover:text-orange-500! no-underline! transition-colors";
  const iconLinkClass =
    "text-slate-500! hover:text-orange-500! no-underline! transition-colors";

  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {/* Brand & Description */}
          <div className="space-y-4 sm:col-span-2 xl:col-span-1">
            <h3 className="text-xl font-extrabold text-orange-600 tracking-tight">
              MessMate
            </h3>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Your neighborhood network connecting students and professionals to
              trusted, verified local mess owners. Enjoy daily fresh meals
              seamlessly.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="#" aria-label="Facebook" className={iconLinkClass}>
                <Facebook size={20} />
              </Link>
              <Link href="#" aria-label="Twitter" className={iconLinkClass}>
                <Twitter size={20} />
              </Link>
              <Link href="#" aria-label="Instagram" className={iconLinkClass}>
                <Instagram size={20} />
              </Link>
              <Link href="#" aria-label="LinkedIn" className={iconLinkClass}>
                <Linkedin size={20} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-semibold text-slate-800">Quick Links</h4>
            <ul className="space-y-2.5 text-sm leading-6">
              <li>
                <Link href="/" className={textLinkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/mess" className={textLinkClass}>
                  Explore Messes
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className={textLinkClass}>
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="#" className={textLinkClass}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="mb-4 font-semibold text-slate-800">For Users</h4>
            <ul className="space-y-2.5 text-sm leading-6">
              <li>
                <Link href="/login" className={textLinkClass}>
                  Consumer Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className={textLinkClass}>
                  Register as Consumer
                </Link>
              </li>
              <li>
                <Link href="/register-owner" className={textLinkClass}>
                  Partner with us (Owner)
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="mb-4 font-semibold text-slate-800">Contact Us</h4>
            <ul className="space-y-3 text-sm leading-6 text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-orange-400 mt-0.5 shrink-0" />
                <span className="wrap-break-word">
                  Vishwakarma Institute of Technology (Kondhwa Campus), Pune
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-orange-400 shrink-0" />
                <span className="break-all">messmated@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} MessMate. All rights reserved.
            </p>
            <p className="text-xs text-slate-400">
              Built for smooth daily meal discovery.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
