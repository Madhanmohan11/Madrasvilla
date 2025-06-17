import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; // Added FormLabel back
import { Download, Filter, Edit, Calendar, Users, TrendingUp, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, parse, compareAsc } from 'date-fns'; // Added compareAsc
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Firebase Firestore Imports ---
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
// --- END Firebase Firestore Imports ---

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkIn: string; // Stored as YYYY-MM-DD string
  checkOut: string; // Stored as YYYY-MM-DD string
  checkInTime: string; // e.g., "14:00"
  checkOutTime: string; // e.g., "12:00"
  guests: number;
  createdAt: string; // Will be ISO string from Firestore Timestamp
  status: 'pending' | 'confirmed' | 'cancelled';
}

const editBookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number cannot exceed 15 digits'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be YYYY-MM-DD'),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, 'Check-in time must be HH:MM').optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, 'Check-out time must be HH:MM').optional(),
  guests: z.number().min(1, 'At least 1 guest is required').max(10, 'Maximum 10 guests allowed'),
  status: z.enum(['pending', 'confirmed', 'cancelled'])
}).refine(data => {
  const checkInDate = parse(data.checkIn, 'yyyy-MM-dd', new Date());
  const checkOutDate = parse(data.checkOut, 'yyyy-MM-dd', new Date());
  return isValid(checkInDate) && isValid(checkOutDate) && checkOutDate > checkInDate;
}, {
  message: "Check-out date must be after check-in date.",
  path: ["checkOut"],
});

type EditBookingForm = z.infer<typeof editBookingSchema>;

export const BookingManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(''); // User input in DD-MM-YYYY
  const [filterGuests, setFilterGuests] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditBookingForm>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      checkIn: '',
      checkOut: '',
      checkInTime: '14:00',
      checkOutTime: '12:00',
      guests: 1,
      status: 'pending'
    }
  });

  const formatDateForDisplay = (dateInput: string | Date | Timestamp | undefined): string => {
    let date: Date;

    if (!dateInput) return "N/A";

    if (dateInput instanceof Timestamp) {
      date = dateInput.toDate();
    } else if (typeof dateInput === 'string') {
      let parsedDate = parse(dateInput, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) {
        parsedDate = parseISO(dateInput);
      }
      date = parsedDate;
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return "Invalid Date";
    }

    return isValid(date) ? format(date, 'dd-MM-yyyy') : "Invalid Date";
  };

  const formatTimeForDisplay = (time24hr: string | undefined): string => {
    if (!time24hr) return "N/A";
    try {
      const [hours, minutes] = time24hr.split(':');
      const hour = parseInt(hours);
      if (isNaN(hour) || isNaN(parseInt(minutes))) return "Invalid Time";
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return "Invalid Time";
    }
  };

  const convertDdMmYyyyToYyyyMmDd = (dateString: string): string | null => {
    const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
    return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : null;
  };

  useEffect(() => {
    const bookingsColRef = collection(db, 'bookings');
    // Order by checkIn date in ascending order
    const q = query(bookingsColRef, orderBy('checkIn', 'asc')); // Changed orderBy to 'checkIn'

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings: Booking[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          checkIn: data.checkIn || '',
          checkOut: data.checkOut || '',
          checkInTime: data.checkInTime || '14:00',
          checkOutTime: data.checkOutTime || '12:00',
          guests: data.guests || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          status: data.status || 'pending',
        };
      });
      setBookings(fetchedBookings);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please check your network and Firebase setup.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredBookings = useMemo(() => {
    let currentFiltered = [...bookings];

    if (filterDate) {
      const formattedFilterDate = convertDdMmYyyyToYyyyMmDd(filterDate);
      if (formattedFilterDate) {
        currentFiltered = currentFiltered.filter(booking =>
          booking.checkIn === formattedFilterDate || booking.checkOut === formattedFilterDate
        );
      } else {
        return [];
      }
    }

    if (filterGuests) {
      const minGuests = parseInt(filterGuests);
      if (!isNaN(minGuests)) {
        currentFiltered = currentFiltered.filter(booking =>
          booking.guests >= minGuests
        );
      }
    }

    if (filterStatus !== 'all') {
      currentFiltered = currentFiltered.filter(booking => booking.status === filterStatus);
    }

    // Sort by checkIn date in ascending order
    currentFiltered.sort((a, b) => {
      const dateA = parse(a.checkIn, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.checkIn, 'yyyy-MM-dd', new Date());
      return compareAsc(dateA, dateB);
    });

    return currentFiltered;
  }, [bookings, filterDate, filterGuests, filterStatus]);

  const calculateBookingStats = () => {
    const totalBookings = bookings.length;
    const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookingsCount = bookings.filter(b => b.status === 'cancelled').length;

    const averageGuestsPerBooking = totalBookings > 0 ? (bookings.reduce((sum, b) => sum + b.guests, 0) / totalBookings).toFixed(1) : '0';

    return { totalBookings, confirmedBookingsCount, pendingBookingsCount, cancelledBookingsCount, averageGuestsPerBooking };
  };

  const { totalBookings, confirmedBookingsCount, pendingBookingsCount, cancelledBookingsCount, averageGuestsPerBooking } = calculateBookingStats();

  const handleApplyFilters = () => {
    if (filterDate && !convertDdMmYyyyToYyyyMmDd(filterDate)) {
      toast({
        title: "Invalid Date Format",
        description: "Please enter date in DD-MM-YYYY format.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Filters Applied",
        description: "Bookings table updated based on your selections.",
      });
    }
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterGuests('');
    setFilterStatus('all');
    toast({
      title: "Filters Cleared",
      description: "Showing all bookings.",
    });
  };

  const exportToExcel = () => {
    if (filteredBookings.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no bookings matching your current filters to export.",
        variant: "info",
      });
      return;
    }

    const csvContent = [
      ['ID', 'Name', 'Email', 'Phone', 'Check-in Date', 'Check-in Time', 'Check-out Date', 'Check-out Time', 'Guests', 'Status', 'Created At'],
      ...filteredBookings.map(booking => [
        booking.id,
        booking.name,
        booking.email,
        booking.phone,
        formatDateForDisplay(booking.checkIn),
        formatTimeForDisplay(booking.checkInTime),
        formatDateForDisplay(booking.checkOut),
        formatTimeForDisplay(booking.checkOutTime),
        booking.guests.toString(),
        booking.status,
        formatDateForDisplay(booking.createdAt)
      ])
    ].map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Booking data exported to CSV.",
    });
  };

  const deleteBooking = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the booking for ${name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'bookings', id));
      toast({
        title: "Booking Deleted",
        description: `Booking for ${name} has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({
        title: "Error",
        description: `Failed to delete booking for ${name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const bookingRef = doc(db, 'bookings', id);
      await updateDoc(bookingRef, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: `Failed to update status. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    // Ensure checkIn and checkOut are in YYYY-MM-DD format for the date input type
    form.reset({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      checkInTime: booking.checkInTime,
      checkOutTime: booking.checkOutTime,
      guests: booking.guests,
      status: booking.status
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitEdit = async (data: EditBookingForm) => {
    if (!editingBooking) return;

    try {
      const bookingRef = doc(db, 'bookings', editingBooking.id);
      await updateDoc(bookingRef, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        guests: data.guests,
        status: data.status,
      });

      toast({
        title: "Booking Updated",
        description: `Booking for ${data.name} has been successfully updated.`,
      });
      setIsEditDialogOpen(false);
      setEditingBooking(null);
      form.reset();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: `Failed to update booking. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Booking Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-3xl font-bold text-green-600">{confirmedBookingsCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingBookingsCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-3xl font-bold text-red-600">{cancelledBookingsCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex flex-col gap-2">
              <label htmlFor="filter-date" className="text-sm">Filter by Date (DD-MM-YYYY)</label>
              <Input
                id="filter-date"
                placeholder="e.g., 15-06-2025"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="filter-guests" className="text-sm">Minimum Guests</label>
              <Input
                id="filter-guests"
                placeholder="e.g., 2"
                type="number"
                min="1"
                value={filterGuests}
                onChange={(e) => setFilterGuests(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="filter-status" className="text-sm">Status</label>
              <Select value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'confirmed' | 'cancelled') => setFilterStatus(value)}>
                <SelectTrigger id="filter-status" className="w-36">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleApplyFilters} variant="outline" className="h-10 px-4 py-2 mt-auto">
              <Filter className="w-4 h-4 mr-2" /> Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline" className="h-10 px-4 py-2 mt-auto">
              Clear Filters
            </Button>
            <Button onClick={exportToExcel} className="flex items-center gap-2 h-10 px-4 py-2 mt-auto">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="ml-2 text-gray-600">Loading bookings...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest & Created</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          <div>{booking.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatDateForDisplay(booking.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{booking.email}</div>
                            <div>{booking.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDateForDisplay(booking.checkIn)}</div>
                          <div className="text-xs text-gray-500">{formatTimeForDisplay(booking.checkInTime)}</div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDateForDisplay(booking.checkOut)}</div>
                          <div className="text-xs text-gray-500">{formatTimeForDisplay(booking.checkOutTime)}</div>
                        </TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            {/* The Dialog and its content for editing */}
                            <Dialog open={isEditDialogOpen && editingBooking?.id === booking.id} onOpenChange={(open) => {
                              setIsEditDialogOpen(open);
                              if (!open) form.reset(); // Reset form when dialog closes
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBooking(booking)}
                                  className="text-xs px-2 py-1 flex items-center gap-1"
                                >
                                  <Edit className="w-3 h-3" /> Edit
                                </Button>
                              </DialogTrigger>
                              {editingBooking && isEditDialogOpen && editingBooking.id === booking.id && (
                                <DialogContent className="sm:max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>Edit Booking for {editingBooking.name}</DialogTitle>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                                      <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" {...field} /></FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
                                          name="checkIn"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Check-in Date (YYYY-MM-DD)</FormLabel>
                                              <FormControl><Input type="date" {...field} /></FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name="checkInTime"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Check-in Time (HH:MM)</FormLabel>
                                              <FormControl><Input type="time" {...field} /></FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
                                          name="checkOut"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Check-out Date (YYYY-MM-DD)</FormLabel>
                                              <FormControl><Input type="date" {...field} /></FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name="checkOutTime"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Check-out Time (HH:MM)</FormLabel>
                                              <FormControl><Input type="time" {...field} /></FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
                                          name="guests"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Guests</FormLabel>
                                              <FormControl>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  max="10"
                                                  {...field}
                                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name="status"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Status</FormLabel>
                                              <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select Status" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button type="submit">
                                          Save Changes
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </Form>
                                </DialogContent>
                              )}
                            </Dialog>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="text-xs px-2 py-1"
                              disabled={booking.status === 'confirmed'}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="text-xs px-2 py-1"
                              disabled={booking.status === 'cancelled'}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBooking(booking.id, booking.name)}
                              className="text-xs px-2 py-1 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No bookings found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};