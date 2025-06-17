import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  MessageCircle,
  Calendar,
  Users
} from 'lucide-react';

export const ContactSection = () => {
  const currentYear = new Date().getFullYear();
  const resortName = 'Madras Villa'; // Replace or pass as prop if dynamic

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4">

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold mb-8 text-center">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => scrollToSection('availability')}
              className="group bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <Calendar className="w-6 h-6 mx-auto mb-2 text-amber-300 group-hover:text-amber-200" />
              <span className="text-sm font-medium block">Check Availability</span>
            </button>

            <button
              onClick={() => scrollToSection('gallery')}
              className="group bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <MapPin className="w-6 h-6 mx-auto mb-2 text-amber-300 group-hover:text-amber-200" />
              <span className="text-sm font-medium block">View Gallery</span>
            </button>

            <button
              onClick={() => scrollToSection('about')}
              className="group bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-amber-300 group-hover:text-amber-200" />
              <span className="text-sm font-medium block">Learn More</span>
            </button>

            <button
              onClick={() => scrollToSection('booking')}
              className="group bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <Phone className="w-6 h-6 mx-auto mb-2 text-amber-300 group-hover:text-amber-200" />
              <span className="text-sm font-medium block">Book Now</span>
            </button>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-semibold mb-6">Follow Us</h3>
          <div className="flex justify-center space-x-6">
            <a href="#" className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors">
              <Instagram className="w-6 h-6 text-white" />
            </a>
            <a href="#" className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors">
              <MessageCircle className="w-6 h-6 text-white" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © {currentYear} {resortName}. All rights reserved. | Designed with ❤️ by{' '}
            <a
              href="https://digivybe.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 font-semibold hover:underline"
            >
              Digivybe
            </a>
          </p>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </section>
  );
};
