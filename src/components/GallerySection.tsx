import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react'; // <-- ADDED THIS IMPORT

// --- Firebase Firestore Imports ---
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
// --- END Firebase Firestore Imports ---

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  createdAt?: string;
}

export const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Rooms', 'Pool', 'Food', 'Nature'];

  // --- Data Loading from Firebase Firestore ---
  useEffect(() => {
    const galleryColRef = collection(db, 'galleryImages');
    const q = query(galleryColRef, orderBy('createdAt', 'desc'));

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedImages: GalleryImage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          src: data.src,
          alt: data.alt,
          category: data.category,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        };
      });
      setImages(fetchedImages);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gallery images for public section:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  const filteredImages =
    selectedCategory === 'All'
      ? images
      : images.filter((img) => img.category === selectedCategory);

  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Resort <span className="text-amber-600">Gallery</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Discover the beauty and luxury that awaits you
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-amber-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="ml-2 text-gray-600">Loading gallery...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.length > 0 ? (
              filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                  onClick={() => setSelectedImage(image.src)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/400x400/cccccc/333333?text=Image+Not+Found`;
                        (e.target as HTMLImageElement).alt = `Image not found for ${image.alt}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="text-white text-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View Image
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-8">
                No images available in this category.
              </p>
            )}
          </div>
        )}

        {/* Lightbox Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Gallery Image"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};