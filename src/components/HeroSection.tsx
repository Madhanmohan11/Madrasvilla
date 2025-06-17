import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  const [videoUrl, setVideoUrl] = useState('/assets/resort.mp4'); // default fallback video

  useEffect(() => {
    const saved = localStorage.getItem('homepageContent');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.heroVideo) {
        setVideoUrl(data.heroVideo);
      }
    }
  }, []);

  const scrollToBooking = () => {
    const element = document.getElementById('booking');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-5 flex items-center justify-center">
        <div className="relative w-full h-full max-w-screen-lg flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-amber-400/20 rounded-full blur-xl animate-pulse top-1/2 left-1/2 transform -translate-x-2/3 -translate-y-2/3"></div>
          <div className="absolute w-32 h-32 bg-orange-400/20 rounded-full blur-xl animate-pulse delay-1000 top-1/2 left-1/2 transform -translate-x-1/3 -translate-y-1/2"></div>
          <div className="absolute w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse delay-2000 top-1/2 left-1/2 transform -translate-x-1/4 -translate-y-1/4"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="inline-block px-4 py-2 bg-amber-600/20 backdrop-blur-md rounded-full border border-amber-400/30 mb-6">
            <span className="text-amber-300 font-medium">✨ Luxury Villa Experience</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in">
          Welcome to
          <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            Madras Villa
          </span>
        </h1>

        <p className="text-xl md:text-2xl lg:text-3xl mb-8 animate-fade-in opacity-90 font-light leading-relaxed">
          Experience luxury and tranquility in our premium vacation resort
          <span className="block text-lg md:text-xl mt-2 text-amber-200">
            Where every moment becomes a cherished memory
          </span>
        </p>

        {/* Main CTA */}
        <div className="mb-12 animate-fade-in">
          <Button 
            onClick={scrollToBooking}
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-12 py-6 text-xl rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-amber-400/30"
          >
            Book Your Dream Stay
          </Button>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <div className="absolute inset-x-0 bottom-8 flex justify-center z-10 text-white animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs opacity-75">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center relative">
            <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
