import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns'; // Added isValid for date validation
import { Loader2 } from 'lucide-react'; // Ensure Loader2 is imported
import { useToast } from '@/hooks/use-toast';

// --- Firebase Firestore Imports ---
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'; // Changed getDocs to onSnapshot
// --- END Firebase Firestore Imports ---

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkIn: string; // Stored as YYYY-MM-DD
  checkOut: string; // Stored as YYYY-MM-DD
  guests: number;
  createdAt: string; // ISO string from Firestore Timestamp
  status: 'pending' | 'confirmed' | 'cancelled';
}

export const AvailabilitySection = () => {
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to check if a date is today or in the future
  const isFutureOrToday = useCallback((date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0); // Normalize checked date to start of day
    return checkDate >= today;
  }, []);

  useEffect(() => {
    setLoading(true);
    let bookingsLoaded = false;
    let manualDatesLoaded = false;

    // Helper to check if both data sources have loaded
    const checkAllLoaded = () => {
      if (bookingsLoaded && manualDatesLoaded) {
        setLoading(false);
      }
    };

    // --- Real-time Listener for Confirmed Bookings ('bookings' collection) ---
    const bookingsColRef = collection(db, 'bookings');
    const qBookings = query(bookingsColRef, where('status', '==', 'confirmed'));

    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const confirmedBookingsDates: Date[] = [];
      snapshot.forEach((doc) => {
        const bookingData = doc.data() as Booking; // Cast for direct property access
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);

        // Validate dates before processing them
        if (!isValid(checkIn) || !isValid(checkOut) || checkOut <= checkIn) {
          console.warn("Invalid or illogical check-in/out date found for confirmed booking ID:", doc.id, bookingData);
          return; // Skip this booking if dates are invalid
        }

        // Add all dates from check-in up to (but not including) check-out
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          confirmedBookingsDates.push(new Date(d));
        }
      });

      // Update the main bookedDates state by combining with manual dates
      setBookedDates(prevDates => {
        // Remove old confirmed booking dates, then add new ones
        const nonConfirmedDates = prevDates.filter(date =>
          !confirmedBookingsDates.some(newDate => newDate.toDateString() === date.toDateString())
        );
        const combinedDates = [...nonConfirmedDates, ...confirmedBookingsDates].filter(date => isFutureOrToday(date));
        // Use a Set to remove duplicates and convert back to array of Date objects
        return Array.from(new Set(combinedDates.map(date => date.toDateString())))
                    .map(dateString => new Date(dateString));
      });

      bookingsLoaded = true;
      checkAllLoaded();
    }, (error) => {
      console.error("Error fetching confirmed bookings for availability:", error);
      toast({
        title: "Error",
        description: "Failed to load confirmed bookings. Please try again later.",
        variant: "destructive",
      });
      bookingsLoaded = true; // Mark as loaded even on error to avoid infinite loading
      checkAllLoaded();
    });

    // --- Real-time Listener for Manually Blocked Dates ('manualAvailability' collection) ---
    const manualAvailabilityRef = collection(db, 'manualAvailability');

    const unsubscribeManual = onSnapshot(manualAvailabilityRef, (snapshot) => {
      const manuallyBlocked: Date[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.date instanceof Timestamp) {
          const date = data.date.toDate();
          if (isValid(date) && isFutureOrToday(date)) {
            manuallyBlocked.push(date);
          }
        } else {
          // Fallback for dates not stored as Timestamp (e.g., plain string)
          try {
            const manualDate = new Date(data.date);
            if (isValid(manualDate) && isFutureOrToday(manualDate)) {
              manuallyBlocked.push(manualDate);
            }
          } catch (e) {
            console.error("Invalid date format in manualAvailability doc:", doc.id, data.date, e);
          }
        }
      });

      // Update the main bookedDates state by combining with confirmed booking dates
      setBookedDates(prevDates => {
        // Remove old manual dates, then add new ones
        const nonManualDates = prevDates.filter(date =>
          !manuallyBlocked.some(newDate => newDate.toDateString() === date.toDateString())
        );
        const combinedDates = [...nonManualDates, ...manuallyBlocked].filter(date => isFutureOrToday(date));
        return Array.from(new Set(combinedDates.map(date => date.toDateString())))
                    .map(dateString => new Date(dateString));
      });

      manualDatesLoaded = true;
      checkAllLoaded();
    }, (error) => {
      console.error("Error fetching manual availability:", error);
      toast({
        title: "Error",
        description: "Failed to load manually blocked dates. Please try again.",
        variant: "destructive",
      });
      manualDatesLoaded = true; // Mark as loaded even on error
      checkAllLoaded();
    });

    // Clean up listeners on component unmount
    return () => {
      unsubscribeBookings();
      unsubscribeManual();
    };
  }, [toast, isFutureOrToday]); // Add toast and isFutureOrToday to dependency array

  // Helper function to format dates for display
  const formatDateForDisplay = (date: Date): string => {
    return format(date, 'dd-MM-yyyy');
  };

  return (
    <section id="availability" className="py-20 bg-gradient-to-b from-white to-amber-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Check <span className="text-amber-600">Availability</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            View our current availability and plan your perfect getaway.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-gray-800">
                Availability Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p className="ml-2 text-gray-600">Loading availability...</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      className="rounded-md border shadow-sm w-full max-w-sm mx-auto"
                      modifiers={{
                        booked: bookedDates,
                        available: (date) => isFutureOrToday(date) && !bookedDates.some(bookedDate =>
                          bookedDate.toDateString() === date.toDateString()
                        ),
                      }}
                      modifiersStyles={{
                        booked: { backgroundColor: '#ef4444', color: 'white' }, // Red for booked
                        available: { backgroundColor: '#22c55e', color: 'white' } // Green for available
                      }}
                      disabled={(date) => !isFutureOrToday(date) || bookedDates.some(bookedDate => bookedDate.toDateString() === date.toDateString())}
                    />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Legend</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-red-500 rounded-md"></div>
                          <span className="text-gray-700">Booked (Unavailable)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-500 rounded-md"></div>
                          <span className="text-gray-700">Available</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
                          <span className="text-gray-700">Past Dates</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-800 mb-2">Booking Information</h4>
                      <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                        <li>Check-in: 2:00 PM</li>
                        <li>Check-out: 12:00 Noon (next day)</li>
                        <li>Maximum 10 guests</li>
                        <li>Contact us for special requests or longer stays.</li>
                      </ul>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        onClick={() => {
                          const element = document.getElementById('booking');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-md"
                      >
                        Book Your Stay
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};