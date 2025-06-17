import React, { useState } from 'react'; // Ensure this is present
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';

export const BookingStep2 = () => {
  const { bookingDetails, updateBookingDetails, setCurrentStep } = useBooking();
  const [name, setName] = useState(bookingDetails.name);
  const [email, setEmail] = useState(bookingDetails.email);
  const [phone, setPhone] = useState(bookingDetails.phone);
  const [phoneError, setPhoneError] = useState('');

  const INDIA_PHONE_REGEX = /^((\+91|0)?)?\d{10}$/;

  const validatePhone = (number: string) => {
    if (!number) {
      setPhoneError('Phone number is required.');
      return false;
    }
    if (!INDIA_PHONE_REGEX.test(number)) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    validatePhone(value);
  };

  const handleNext = () => {
    const isPhoneValid = validatePhone(phone);
    
    if (name && email && isPhoneValid) {
      updateBookingDetails({ name, email, phone });
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const checkInDate = new Date(bookingDetails.checkIn);
  const checkOutDate = new Date(bookingDetails.checkOut);
  const nights = (checkInDate instanceof Date && !isNaN(checkInDate.getTime()) && 
                  checkOutDate instanceof Date && !isNaN(checkOutDate.getTime()))
                  ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24))
                  : 0;

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Error formatting time:", time, error);
      return time;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateStr, error);
      return "Invalid Date";
    }
  };

  const isFormValid = name && email && phone && !phoneError;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Guest Details
      </h3>
      
      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Booking Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Check-in: {formatDate(bookingDetails.checkIn)} at {formatTime(bookingDetails.checkInTime)}</p>
          <p>Check-out: {formatDate(bookingDetails.checkOut)} at {formatTime(bookingDetails.checkOutTime)}</p>
          <p>Duration: {nights} night{nights > 1 ? 's' : ''}</p>
          <p>Guests: {bookingDetails.guests}</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="e.g., 9876543210 or +919876543210"
            className={`mt-2 ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handleBack}
            variant="outline"
            className="flex-1 py-3 text-lg font-semibold"
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!isFormValid}
            className="flex-1 bg-amber-600 hover:bg-amber-700 py-3 text-lg font-semibold"
          >
            Proceed to Booking
          </Button>
        </div>
      </div>
    </div>
  );
};