import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Home, Calendar, Users, Image, Bell, X, TrendingUp } from 'lucide-react';

// --- Firebase Firestore Imports ---
import { db } from '@/lib/firebase'; // Import the Firestore instance
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore'; // Import Firestore functions
// --- End Firebase Firestore Imports ---

// Ensure these components exist at the specified paths
import { AvailabilityManager } from './AvailabilityManager';
import { BookingManager } from './BookingManager';
import { GalleryManager } from './GalleryManager';

interface AdminDashboardProps {
  onLogout: () => void;
}

// Updated Booking interface to reflect potential Firestore data structure
interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkIn: string; // Stored as ISO string (e.g., "YYYY-MM-DD")
  checkOut: string; // Stored as ISO string
  checkInTime: string;
  checkOutTime: string;
  guests: number;
  // createdAt can be string (ISO) or Timestamp from Firestore
  createdAt: string | Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled';
  // Add a unique ID for notifications if not directly using booking.id
  notificationId?: string;
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Consider a more specific type for notifications
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    // Changed property name from averageGuestsPerBooking to averageBookingsCount
    averageBookingsCount: '0',
    estimatedTotalRevenue: '₹0'
  });

  // Effect to fetch and listen for real-time booking data from Firestore
  useEffect(() => {
    const bookingsColRef = collection(db, 'bookings'); // Reference to the 'bookings' collection
    // Create a query to order bookings by creation date, newest first
    const q = query(bookingsColRef, orderBy('createdAt', 'desc'));

    // Set up a real-time listener (onSnapshot)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings: Booking[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString() // Convert Timestamp to ISO string
          : data.createdAt; // Assume it's already an ISO string if not a Timestamp

        return {
          id: doc.id, // The document ID from Firestore
          name: data.name,
          email: data.email,
          phone: data.phone,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          checkInTime: data.checkInTime || '', // Default to empty string if not present
          checkOutTime: data.checkOutTime || '', // Default to empty string if not present
          guests: data.guests || 0, // Default to 0 if not present
          createdAt: createdAt,
          status: data.status || 'pending', // Default to 'pending' if status is not set
        };
      });

      // --- Recalculate Booking Statistics based on fetched Firestore data ---
      const totalBookings = fetchedBookings.length;
      const confirmedBookings = fetchedBookings.filter(b => b.status === 'confirmed');

      // Calculate Average Booking based on confirmed bookings length, rounded
      // Example: 6 confirmed bookings -> 3; 3 confirmed bookings -> 1 (rounded)
      const averageBookingsCount = Math.round(confirmedBookings.length / 2).toString();

      // Calculate Estimated Total Revenue
      let totalEstimatedRevenue = 0;
      const ratePerGuestPerNight = 2500; // Example: ₹2500 per guest per night

      confirmedBookings.forEach(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
          console.warn("Invalid or illogical date range found in confirmed booking for revenue calculation:", booking);
          return; // Skip invalid bookings
        }

        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        totalEstimatedRevenue += (nights * booking.guests * ratePerGuestPerNight);
      });

      const estimatedTotalRevenueFormatted = `₹${totalEstimatedRevenue.toLocaleString('en-IN')}`;

      setBookingStats({
        totalBookings,
        confirmedBookings: confirmedBookings.length,
        averageBookingsCount, // Updated property name and value
        estimatedTotalRevenue: estimatedTotalRevenueFormatted
      });

      // --- Recalculate Notifications ---
      const pendingBookingNotifications = fetchedBookings
        .filter(b => b.status === 'pending')
        .map(booking => ({
          id: `pending-${booking.id}`,
          type: 'booking-request',
          title: 'New Booking Request',
          message: `${booking.name} requested a booking for ${booking.guests} guests`,
          time: booking.createdAt,
          unread: true,
          bookingId: booking.id
        }));

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentActivityNotifications = fetchedBookings
        .filter(b => {
          const bookingDate = new Date(b.createdAt as string);
          return (b.status === 'confirmed' || b.status === 'cancelled') &&
                 !isNaN(bookingDate.getTime()) && bookingDate > oneWeekAgo;
        })
        .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
        .slice(0, 3)
        .map(booking => ({
          id: `activity-${booking.id}`,
          type: 'booking-status-update',
          title: `Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`,
          message: `Booking for ${booking.name} has been ${booking.status}.`,
          time: booking.createdAt,
          unread: false,
          bookingId: booking.id
        }));

      const allNotifications = [...pendingBookingNotifications, ...recentActivityNotifications];
      setNotifications(allNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5));

    }, (error) => {
      console.error("Error fetching bookings for dashboard:", error);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const formatNotificationTime = (timestamp: string | Timestamp) => {
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-60 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
  <div className="flex items-center justify-between px-4 md:px-6 py-4">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
        <Home className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </div>
      <div>
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          Madras Villa
        </h1>
        <p className="text-xs md:text-sm text-gray-500">Admin Dashboard</p>
      </div>
    </div>
   
 

          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown - Centered on All Devices */}
              {notificationOpen && (
                <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setNotificationOpen(false)}> {/* Overlay for closing */}
                  <div
                    className="absolute top-5 left-1/2 -translate-x-1/2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200"
                    onClick={(e) => e.stopPropagation()} // Prevent click from closing dropdown immediately
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setNotificationOpen(false)}
                          className="h-6 w-6"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-gray-50 hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatNotificationTime(notification.time)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-white/50 hover:bg-white/80 border-white/20 backdrop-blur-sm text-xs md:text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex justify-center p-4 lg:p-6">
        <main className="w-full max-w-7xl">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-1">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-1 lg:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl transition-all duration-200 text-xs lg:text-sm"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="flex items-center gap-1 lg:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-xl transition-all duration-200 text-xs lg:text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
                <TabsTrigger
                  value="bookings"
                  className="flex items-center gap-1 lg:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-xl transition-all duration-200 text-xs lg:text-sm"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="flex items-center gap-1 lg:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl transition-all duration-200 text-xs lg:text-sm"
                >
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Gallery</span>
                </TabsTrigger>
              </TabsList>

              <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 lg:p-6">
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-blue-700">Total Bookings</CardTitle>
                          <Users className="w-4 h-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-800">{bookingStats.totalBookings}</div>
                          <p className="text-xs text-blue-500 mt-1">All booking requests</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-green-700">Confirmed Bookings</CardTitle>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-800">{bookingStats.confirmedBookings}</div>
                          <p className="text-xs text-green-500 mt-1">Successfully confirmed bookings</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          {/* Changed CardTitle and description */}
                          <CardTitle className="text-sm font-medium text-purple-700">Average Booking</CardTitle>
                          <Calendar className="w-4 h-4 text-purple-600" /> {/* Changed icon to Calendar for 'Booking' */}
                        </CardHeader>
                        <CardContent>
                          {/* Changed property to display */}
                          <div className="text-2xl font-bold text-purple-800">{bookingStats.averageBookingsCount}</div>
                          <p className="text-xs text-purple-500 mt-1">Half of confirmed bookings (rounded)</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-amber-700">Estimated Revenue</CardTitle>
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-amber-800">{bookingStats.estimatedTotalRevenue}</div>
                          <p className="text-xs text-amber-500 mt-1">Total revenue from confirmed bookings</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Booking Activity Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Booking Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {notifications.length > 0 ? (
                          <ul className="divide-y divide-gray-100">
                            {notifications.map(notification => (
                              <li key={notification.id} className="py-2 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="text-xs text-gray-600">{notification.message}</p>
                                </div>
                                <span className="text-xs text-gray-400">{formatNotificationTime(notification.time)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No recent booking activity to display.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                  <AvailabilityManager />
                </TabsContent>

                <TabsContent value="bookings" className="mt-0">
                  <BookingManager />
                </TabsContent>

                <TabsContent value="gallery" className="mt-0">
                  <GalleryManager />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};