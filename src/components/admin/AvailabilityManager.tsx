import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';  
import { Info, User, Calendar as CalendarIcon, Users as UsersIcon, Loader2 } from 'lucide-react';  
import { useToast } from '@/components/ui/use-toast';  
import { db } from '@/lib/firebase';  
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  where,
  getDocs,
  Timestamp,  
} from 'firebase/firestore';
 

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkIn: string;  
  checkOut: string;  
  guests: number;
  createdAt: string;  
  status: 'pending' | 'confirmed' | 'cancelled';
 
  checkInTime?: string;
  checkOutTime?: string;
}

export const AvailabilityManager = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [manuallyBookedDates, setManuallyBookedDates] = useState<Date[]>([]);  
  const [confirmedBookingRanges, setConfirmedBookingRanges] = useState<Date[]>([]);  
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);  
  const [loading, setLoading] = useState(true);  
  const [actionLoading, setActionLoading] = useState(false); 

  const { toast } = useToast(); 

  
  const isDateInConfirmedBooking = useCallback((date: Date): boolean => {
    return confirmedBookingRanges.some(bookingDate =>
      bookingDate.toDateString() === date.toDateString()
    );
  }, [confirmedBookingRanges]);

 
  const isDateManuallyBooked = useCallback((date: Date): boolean => {
    return manuallyBookedDates.some(manuallyDate =>
      manuallyDate.toDateString() === date.toDateString()
    );
  }, [manuallyBookedDates]);

  useEffect(() => {
    setLoading(true);  

    
    const manualAvailabilityColRef = collection(db, 'manualAvailability');
    const unsubscribeManual = onSnapshot(manualAvailabilityColRef, (snapshot) => {
      const fetchedManualDates: Date[] = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.date instanceof Timestamp) {
          return data.date.toDate();
        }
        
        try {
         
          if (typeof data.date === 'string') {
            return new Date(data.date);
          }
        } catch (e) {
          console.error("Invalid date format in manualAvailability for doc:", doc.id, data.date);
        }
        return new Date(NaN); 
      }).filter(date => !isNaN(date.getTime())) 
      setManuallyBookedDates(fetchedManualDates);
      setLoading(false);  
    }, (error) => {
      console.error("Error fetching manual availability:", error);
      toast({
        title: "Error",
        description: "Failed to load manually blocked dates. Please try again.",
        variant: "destructive",
      });
      setLoading(false);  
    });

    
    const bookingsColRef = collection(db, 'bookings');
    const qBookings = query(bookingsColRef);

    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const fetchedBookings: Booking[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt;
        return {
          id: doc.id,
          name: data.name || 'N/A',
          email: data.email || 'N/A',
          phone: data.phone || 'N/A',
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          checkInTime: data.checkInTime || '',
          checkOutTime: data.checkOutTime || '',
          guests: data.guests || 0,
          createdAt: createdAt,
          status: data.status || 'pending',
        };
      });

      const confirmed = fetchedBookings.filter((booking: Booking) => booking.status === 'confirmed');
      setConfirmedBookings(confirmed);

      const datesFromBookings: Date[] = [];
      confirmed.forEach((booking: Booking) => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);

        // Validate dates before processing
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
          console.warn("Invalid or illogical check-in/out date found for confirmed booking ID:", booking.id, booking);
          
          return;  
        }

     
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          datesFromBookings.push(new Date(d));
        }
      });
      setConfirmedBookingRanges(datesFromBookings);
      setLoading(false);  
    }, (error) => {
      console.error("Error fetching bookings for availability:", error);
      toast({
        title: "Error",
        description: "Failed to load confirmed bookings. Please try again.",
        variant: "destructive",
      });
      setLoading(false);  
    });

   
    return () => {
      unsubscribeManual();
      unsubscribeBookings();
    };
  }, [toast]);  

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const markAsBooked = async () => {
    if (!selectedDate) {
      toast({
        title: "No date selected",
        description: "Please select a date on the calendar first.",
        variant: "warning",
      });
      return;
    }

    if (isDateInConfirmedBooking(selectedDate)) {
      toast({
        title: "Date is Reserved",
        description: "This date is part of a confirmed reservation and cannot be manually blocked.",
        variant: "warning",
      });
      return;
    }
    if (isDateManuallyBooked(selectedDate)) {
      toast({
        title: "Already Blocked",
        description: "This date is already manually marked as booked.",
        variant: "info",
      });
      return;
    }

    setActionLoading(true);
    try {
      await addDoc(collection(db, 'manualAvailability'), {
        date: Timestamp.fromDate(selectedDate),  
        markedAt: Timestamp.now(),
      });
      setSelectedDate(undefined);  
      toast({
        title: "Success!",
        description: `Date ${selectedDate.toLocaleDateString()} marked as booked.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error marking date as booked:", error);
      toast({
        title: "Error",
        description: "Failed to mark date as booked. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const markAsAvailable = async () => {
    if (!selectedDate) {
      toast({
        title: "No date selected",
        description: "Please select a date on the calendar first.",
        variant: "warning",
      });
      return;
    }

    if (isDateInConfirmedBooking(selectedDate)) {
      toast({
        title: "Date is Reserved",
        description: "This date is part of a confirmed reservation and cannot be manually made available.",
        variant: "warning",
      });
      return;
    }
    if (!isDateManuallyBooked(selectedDate)) {
      toast({
        title: "Not Manually Blocked",
        description: "This date is not manually marked as booked. No action needed.",
        variant: "info",
      });
      return;
    }

    setActionLoading(true);
    try {
      const q = query(
        collection(db, 'manualAvailability'),
        where('date', '==', Timestamp.fromDate(selectedDate))
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, 'manualAvailability', querySnapshot.docs[0].id));
        setSelectedDate(undefined);  
        toast({
          title: "Success!",
          description: `Date ${selectedDate.toLocaleDateString()} marked as available.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Not Found",
          description: "No manually booked record found for this date.",
          variant: "info",
        });
      }
    } catch (error) {
      console.error("Error marking date as available:", error);
      toast({
        title: "Error",
        description: "Failed to mark date as available. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
        return 0; 
      }
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Loading availability data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Availability Legend & Controls</AlertTitle>
        <AlertDescription>
          <p><span className="font-semibold text-red-700">Red dates</span> are manually marked as unavailable.</p>
          <p><span className="font-semibold text-orange-600">Orange dates</span> are booked through confirmed reservations.</p>
          <p><span className="font-semibold text-green-600">Green dates</span> are currently available for booking.</p>
          <p className="mt-2">Select a date on the calendar to manually block or unblock it. Dates blocked by confirmed reservations cannot be manually changed.</p>
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Availability Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                  modifiers={{
                 
                    fromBooking: confirmedBookingRanges,
                    
                    manuallyBooked: manuallyBookedDates,
                    
                    available: (date) => date >= new Date() && !isDateInConfirmedBooking(date) && !isDateManuallyBooked(date),
                  }}
                  modifiersStyles={{
                    fromBooking: { backgroundColor: '#f97316', color: 'white' },  
                    manuallyBooked: { backgroundColor: '#ef4444', color: 'white' },  
                    available: { backgroundColor: '#22c55e', color: 'white' },   
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">Manually Booked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">Booked from Reservations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Available</span>
              </div>
            </CardContent>
          </Card>

          {/* Date Actions */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Badge variant="outline" className="w-full justify-center py-2">
                  {formatDate(selectedDate.toISOString())}
                </Badge>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={markAsBooked}
                    className="bg-red-600 hover:bg-red-700 w-full"
                    size="sm"
                    disabled={actionLoading || isDateInConfirmedBooking(selectedDate) || isDateManuallyBooked(selectedDate)}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark as Booked
                  </Button>
                  <Button
                    onClick={markAsAvailable}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={actionLoading || isDateInConfirmedBooking(selectedDate) || !isDateManuallyBooked(selectedDate)}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark as Available
                  </Button>
                </div>

                {isDateInConfirmedBooking(selectedDate) && (
                  <p className="text-sm text-orange-600 text-center">
                    This date is booked through a confirmed reservation and cannot be manually changed.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manually Booked Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manually Booked Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {manuallyBookedDates.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {manuallyBookedDates
                      .sort((a, b) => a.getTime() - b.getTime()) 
                      .map((date, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {date.toLocaleDateString('en-GB')}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">No manually booked dates</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmed Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Confirmed Bookings Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedBookings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedBookings
                .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())  
                .map((booking) => (
                <div key={booking.id} className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-orange-900">{booking.name}</span>
                    </div>
                    <Badge className="bg-orange-500 text-white text-xs">
                      {booking.guests} guests
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Check-in:</span>
                      <span className="font-medium text-orange-900">{formatDate(booking.checkIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Check-out:</span>
                      <span className="font-medium text-orange-900">{formatDate(booking.checkOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Duration:</span>
                      <span className="font-medium text-orange-900">
                        {calculateNights(booking.checkIn, booking.checkOut)} nights
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-xs text-orange-600">
                      Booked on {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No confirmed bookings yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};