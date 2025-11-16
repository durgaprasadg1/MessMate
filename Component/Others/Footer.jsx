import React from 'react'

const Footer = () => {
  return (
    <div>
        <footer className="border-t border-slate-200 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    © {new Date().getFullYear()} MessMate — Connecting students &
                    community kitchens
                </div>
            </div>
        </footer>
      </div>
  )
}

export default Footer