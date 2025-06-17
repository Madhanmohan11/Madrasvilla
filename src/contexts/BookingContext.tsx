
import React, { createContext, useContext, useState } from 'react';

interface BookingDetails {
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
}

interface BookingContextType {
  bookingDetails: BookingDetails;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    checkIn: '',
    checkOut: '',
    checkInTime: '14:00', // 2:00 PM
    checkOutTime: '12:00', // 12:00 Noon
    guests: 2,
    name: '',
    email: '',
    phone: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);

  const updateBookingDetails = (details: Partial<BookingDetails>) => {
    setBookingDetails(prev => ({ ...prev, ...details }));
  };

  return (
    <BookingContext.Provider value={{
      bookingDetails,
      updateBookingDetails,
      currentStep,
      setCurrentStep
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
