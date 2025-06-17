import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// --- NEW IMPORTS FOR FIRESTORE ---
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
// ---------------------------------

export const BookingStep3 = () => {
  const { bookingDetails, setCurrentStep } = useBooking();
  const { toast } = useToast();

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // --- UPDATED FUNCTION TO SAVE TO FIRESTORE ---
  const saveBookingToFirestore = async (bookingData: any) => {
    try {
      // Get a reference to the 'bookings' collection
      const bookingsCollectionRef = collection(db, 'bookings');
      // Add the new booking document to the collection
      await addDoc(bookingsCollectionRef, bookingData);
      console.log('Booking successfully saved to Firestore:', bookingData);
      return true; // Indicate success
    } catch (error) {
      console.error('Error saving booking to Firestore:', error);
      toast({
        title: "Booking Failed!",
        description: "There was an error saving your booking. Please check console for details.",
        variant: "destructive"
      });
      return false; // Indicate failure
    }
  };
  // ---------------------------------------------

  const handleWhatsAppBooking = async () => { // Made this function async
    const booking = {
      // Firestore will automatically generate an 'id' for the document
      name: bookingDetails.name,
      email: bookingDetails.email,
      phone: bookingDetails.phone,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      checkInTime: bookingDetails.checkInTime,
      checkOutTime: bookingDetails.checkOutTime, // Corrected typo here
      guests: bookingDetails.guests,
      createdAt: new Date().toISOString(),
      status: 'pending' as const // Ensure this type is compatible with your data model
    };

    // Attempt to save booking to Firestore first
    const success = await saveBookingToFirestore(booking);

    if (success) {
      const message = `Hello! I would like to make a reservation at Madras Villa.

*Booking Details:*
📅 Check-in: ${formatDate(bookingDetails.checkIn)} at ${formatTime(bookingDetails.checkInTime)}
📅 Check-out: ${formatDate(bookingDetails.checkOut)} at ${formatTime(bookingDetails.checkOutTime)}
👥 Guests: ${bookingDetails.guests}

*Guest Information:*
👤 Name: ${bookingDetails.name}
📧 Email: ${bookingDetails.email}
📞 Phone: ${bookingDetails.phone}

Please confirm availability and provide booking details. Thank you!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/918680996316?text=${encodedMessage}`; // Changed to https for reliability

      window.open(whatsappUrl, '_blank');

      // toast({
      //   title: "Booking Sent!",
      //   description: "Your booking details have been sent via WhatsApp and saved to our system.",
      // });
    }
  };

  const handleBackToStep2 = () => {
    setCurrentStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Booking Summary
          </CardTitle>
          <p className="text-gray-600">
            Review your details and complete your booking via WhatsApp
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-amber-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Reservation</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="font-semibold text-gray-800">{formatDate(bookingDetails.checkIn)}</p>
                <p className="text-sm text-gray-500">at {formatTime(bookingDetails.checkInTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-out</p>
                <p className="font-semibold text-gray-800">{formatDate(bookingDetails.checkOut)}</p>
                <p className="text-sm text-gray-500">at {formatTime(bookingDetails.checkOutTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="font-semibold text-gray-800">{bookingDetails.guests} {bookingDetails.guests === 1 ? 'Guest' : 'Guests'}</p>
              </div>
            </div>

            <div className="border-t border-amber-200 pt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Guest Information</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Name:</span> {bookingDetails.name}</p>
                <p><span className="font-medium">Email:</span> {bookingDetails.email}</p>
                <p><span className="font-medium">Phone:</span> {bookingDetails.phone}</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Booking */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Complete Your Booking</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Click the button below to send your booking details via WhatsApp. Our team will confirm your reservation and provide payment details.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleWhatsAppBooking}
                // Increased padding for better height. Added w-full for full width on mobile.
                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 flex-1 py-4 text-base sm:py-3 sm:text-lg w-full"
                size="lg" // Keep size="lg" if your button component uses it for base styling
              >
                <MessageCircle className="w-5 h-5" />
                Book via WhatsApp
              </Button>

              <Button
                onClick={handleBackToStep2}
                variant="outline"
                // Ensure consistency with the WhatsApp button's height
                className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 py-4 text-base sm:py-3 sm:text-lg w-full"
                size="lg" // Keep size="lg" if your button component uses it for base styling
              >
                Back to Edit Details
              </Button>
            </div>
          </div>

          {/* Note */}
          <div className="text-center text-sm text-gray-500">
            <p>
              By proceeding, you agree to our terms and conditions.
              Our team will contact you within 24 hours to confirm your booking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};