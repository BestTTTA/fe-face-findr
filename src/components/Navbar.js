'use client'; // This directive is important for using client-side features like useState

import React, { useState } from 'react'; // Import useState
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to manage mobile menu visibility

  return (
    <nav className="bg-primary-dark p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and Site Title */}
        <Link href="/" className="text-white flex items-center gap-2 text-2xl font-bold font-heading">
          <Image src="/logo/logo-white.png" height={60} alt='Facefidr Logo' width={60}/>
          Facefidr
        </Link>

        {/* Hamburger menu button for mobile */}
        <div className="md:hidden"> {/* Only visible on medium screens and below */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)} // Toggle menu state
            className="text-primary-light hover:text-white focus:outline-none focus:text-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              // Close icon (e.g., an X)
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex space-x-4"> {/* Hidden on mobile, visible on medium screens and up */}
          <Link href="/" className="text-primary-light hover:text-white transition-colors duration-200">
            ค้นหาใบหน้า
          </Link>
          <Link href="/upload" className="text-primary-light hover:text-white transition-colors duration-200">
            อัปโหลดรูปภาพ
          </Link>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-primary-dark pt-2 pb-4 space-y-2 text-center"> {/* Stacks links vertically */}
          <Link href="/" className="block text-primary-light hover:text-white transition-colors duration-200 py-2" onClick={() => setIsMenuOpen(false)}>
            ค้นหาใบหน้า
          </Link>
          <Link href="/upload" className="block text-primary-light hover:text-white transition-colors duration-200 py-2" onClick={() => setIsMenuOpen(false)}>
            อัปโหลดรูปภาพ
          </Link>
        </div>
      )}
    </nav>
  );
}