import React from 'react'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-slate-50 pt-16 pb-8 border-t border-orange-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-xl font-extrabold text-orange-600 tracking-tight">MessMate</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your neighborhood network connecting students and professionals to trusted, verified local mess owners. Enjoy daily fresh meals seamlessly.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors"><Facebook size={20} /></Link>
              <Link href="#" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors"><Twitter size={20} /></Link>
              <Link href="#" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors"><Instagram size={20} /></Link>
              <Link href="#" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors"><Linkedin size={20} /></Link>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Home</Link></li>
              <li><Link href="/mess" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Explore Messes</Link></li>
              <li><Link href="/terms-and-conditions" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="#" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          {/* For Users */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">For Users</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/login" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Consumer Login</Link></li>
              <li><Link href="/signup" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Register as Consumer</Link></li>
              <li><Link href="/register-owner" className="!text-slate-500 hover:!text-orange-500 !no-underline transition-colors">Partner with us (Owner)</Link></li>
            </ul>
          </div>
          
          {/* Contact Details */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-orange-400 mt-0.5 shrink-0" />
                <span>Vishwakarma Institute of Technology (Kondhwa Campus), Pune </span>
              </li>
              {/* <li className="flex items-center gap-3">
                <Phone size={16} className="text-orange-400 shrink-0" />
                <span>+</span>
              </li> */}
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-orange-400 shrink-0" />
                <span>messmated@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 text-center text-sm text-slate-400">
          <p>© {new Date().getFullYear()} MessMate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer