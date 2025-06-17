
import { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { GallerySection } from '@/components/GallerySection';
import { AvailabilitySection } from '@/components/AvailabilitySection';
import { BookingSection } from '@/components/BookingSection';
import { ContactSection } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';
import { BookingProvider } from '@/contexts/BookingContext';

const Index = () => {
  return (
    <BookingProvider>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <Navigation />
        <HeroSection />
        <AboutSection />
        <GallerySection />
        <AvailabilitySection />
        <BookingSection />
        <ContactSection />
      </div>
    </BookingProvider>
  );
};

export default Index;
