import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/30 backdrop-blur-lg border-b border-white/20 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Brand Name */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={logo} 
              alt="Madras Villa Logo"
              className="h-6 w-8 object-contain"
            />
            <span className="md:block text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Madras Villa
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link 
              to="/"
              className="text-white-700 hover:text-amber-600 transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/contact"
              className="text-white-700 hover:text-amber-600 transition-colors"
            >
              Contact
            </Link>
            <button
              onClick={() => scrollToSection('booking')}
              className="text-white-700 hover:text-amber-600 transition-colors"
            >
              Book Now
            </button>
          </div>

          {/* Admin Button (opens in new tab) */}
          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white px-5 py-1 rounded-full hover:from-orange-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Admin
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
              <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 rounded-xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg p-4">
            <div className="space-y-3 text-base font-medium">
              <Link 
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-amber-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link 
                to="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-amber-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                ✉️ Contact
              </Link>
              <button
                onClick={() => {
                  scrollToSection('booking');
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-amber-600 transition-all"
              >
                📅 Book Now
              </button>
              <a
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-gray-700 hover:text-amber-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                🛠 Admin
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
