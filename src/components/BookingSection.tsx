
import { useBooking } from '@/contexts/BookingContext';
import { BookingStep1 } from '@/components/booking/BookingStep1';
import { BookingStep2 } from '@/components/booking/BookingStep2';
import { BookingStep3 } from '@/components/booking/BookingStep3';

export const BookingSection = () => {
  const { currentStep } = useBooking();

  return (
    <section id="booking" className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Book Your <span className="text-amber-600">Stay</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Reserve your perfect getaway in just 3 simple steps
          </p>

          {/* Features Bar */}
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-3 rounded-full border border-amber-200/50 shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-700">Available Now</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-3 rounded-full border border-amber-200/50 shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-700">Free Cancellation</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-3 rounded-full border border-amber-200/50 shadow-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-700">Best Price Guarantee</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center items-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    currentStep >= step 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-amber-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && <BookingStep1 />}
          {currentStep === 2 && <BookingStep2 />}
          {currentStep === 3 && <BookingStep3 />}
        </div>
      </div>
    </section>
  );
};
