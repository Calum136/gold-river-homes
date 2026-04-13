"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/calculator", label: "Calculator" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 border border-gold/40 rounded flex items-center justify-center">
              <span className="font-accent text-gold text-xl font-semibold leading-none">GR</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-text-white text-lg tracking-wide">
                Gold River Homes
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-secondary hover:text-gold uppercase text-sm font-medium tracking-widest transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/calculator"
              className="bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-6 py-2.5 transition-colors duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-secondary hover:text-gold p-2"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-text-secondary hover:text-gold uppercase text-sm font-medium tracking-widest transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/calculator"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 bg-gold hover:bg-gold-bright text-white uppercase text-sm font-medium tracking-widest px-6 py-2.5 text-center transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
