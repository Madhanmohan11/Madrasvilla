import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBooking } from '@/contexts/BookingContext';

export const BookingStep1 = () => {
  const { bookingDetails, updateBookingDetails, setCurrentStep } = useBooking();
  const [checkIn, setCheckIn] = useState(bookingDetails.checkIn);
  const [checkOut, setCheckOut] = useState(bookingDetails.checkOut);
  const [checkInTime, setCheckInTime] = useState('14:00'); // 2:00 PM
  const [checkOutTime, setCheckOutTime] = useState('12:00'); // 12:00 Noon
  const [guests, setGuests] = useState(bookingDetails.guests);

  const handleNext = () => {
    if (checkIn && checkOut && guests) {
      updateBookingDetails({ 
        checkIn, 
        checkOut, 
        guests,
        checkInTime,
        checkOutTime
      });
      setCurrentStep(2);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center"> {/* Reduced mb-6 to mb-2 for closer proximity */}
        Select Your Dates
      </h3>
      {/* Added the new text below the heading */}
      <p className="text-gray-600 text-center text-sm mb-6"> 
        Before selecting your date, check the availability in the <a href="#availability" className="text-amber-600 hover:underline font-semibold">availability calendar</a>.
      </p>
      
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="checkin" className="text-sm font-medium text-gray-700">
              Check-in Date
            </Label>
            <Input
              id="checkin"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={today}
              className="mt-2"
            />
            <Label htmlFor="checkin-time" className="text-sm font-medium text-gray-700 mt-3 block">
              Check-in Time
            </Label>
            <Input
              id="checkin-time"
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 2:00 PM</p>
          </div>
          <div>
            <Label htmlFor="checkout" className="text-sm font-medium text-gray-700">
              Check-out Date
            </Label>
            <Input
              id="checkout"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || today}
              className="mt-2"
            />
            <Label htmlFor="checkout-time" className="text-sm font-medium text-gray-700 mt-3 block">
              Check-out Time
            </Label>
            <Input
              id="checkout-time"
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 12:00 Noon</p>
          </div>
        </div>

        <div>
          <Label htmlFor="guests" className="text-sm font-medium text-gray-700">
            Number of Guests
          </Label>
          <Input
            id="guests"
            type="number"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            min="1"
            max="10"
            className="mt-2"
          />
        </div>

        <Button 
          onClick={handleNext}
          disabled={!checkIn || !checkOut || !guests}
          className="w-full bg-amber-600 hover:bg-amber-700 py-3 text-lg font-semibold"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};