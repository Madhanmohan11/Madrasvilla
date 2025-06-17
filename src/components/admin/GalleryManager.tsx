import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Plus, Loader2 } from 'lucide-react'; // <-- ADDED Loader2 IMPORT HERE
import { useToast } from '@/hooks/use-toast';

// --- Firebase Firestore Imports ---
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
// --- END Firebase Firestore Imports ---

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  createdAt?: string;
}

export const GalleryManager = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('Rooms');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categories = ['Rooms', 'Pool', 'Food', 'Nature'];

  // --- Data Loading from Firebase Firestore ---
  useEffect(() => {
    const galleryColRef = collection(db, 'galleryImages');
    const q = query(galleryColRef, orderBy('createdAt', 'desc'));

    setLoading(true);
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && images.length === 0) {
        console.log("Gallery collection is empty. Seeding initial images...");
        const defaultImages: Omit<GalleryImage, 'id' | 'createdAt'>[] = [
          { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', category: 'Rooms', alt: 'Luxury Room' },
          { src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', category: 'Rooms', alt: 'Premium Suite' },
          { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', category: 'Pool', alt: 'Resort Pool' },
          { src: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', category: 'Food', alt: 'Gourmet Dining' },
          { src: 'https://images.unsplash.com/photo-1542312386-8a5ff681966a?w=800', category: 'Nature', alt: 'Sunrise View' },
        ];
        for (const img of defaultImages) {
          try {
            await addDoc(galleryColRef, {
              src: img.src,
              alt: img.alt,
              category: img.category,
              createdAt: serverTimestamp(),
            });
          } catch (error) {
            console.error("Error adding default image:", img.alt, error);
          }
        }
        return;
      }

      const fetchedImages: GalleryImage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          src: data.src,
          alt: data.alt,
          category: data.category,
          createdAt: data.createdAt?.toDate().toISOString(),
        };
      });
      setImages(fetchedImages);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gallery images:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery images. Please check your network and Firebase setup.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const addImage = async () => {
    if (!newImageUrl || !newImageAlt) {
      toast({
        title: "Missing Information",
        description: "Please provide both image URL and alt text.",
        variant: "destructive",
      });
      return;
    }

    try {
      const galleryColRef = collection(db, 'galleryImages');
      await addDoc(galleryColRef, {
        src: newImageUrl,
        alt: newImageAlt,
        category: newImageCategory,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Image Added",
        description: "Image successfully added to the gallery.",
      });

      setNewImageUrl('');
      setNewImageAlt('');
      setNewImageCategory('Rooms');

    } catch (error) {
      console.error("Error adding image:", error);
      toast({
        title: "Error",
        description: `Failed to add image: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const imageDocRef = doc(db, 'galleryImages', id);
      await deleteDoc(imageDocRef);
      toast({
        title: "Image Deleted",
        description: "Image successfully removed from the gallery.",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: `Failed to delete image: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gallery Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Image
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">Image URL</label>
                <Input
                  id="imageUrl"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label htmlFor="imageAlt" className="block text-sm font-medium mb-1">Alt Text</label>
                <Input
                  id="imageAlt"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  placeholder="Image description"
                />
              </div>
              <div>
                <label htmlFor="imageCategory" className="block text-sm font-medium mb-1">Category</label>
                <select
                  id="imageCategory"
                  value={newImageCategory}
                  onChange={(e) => setNewImageCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={addImage} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Current Gallery Images ({images.length})</h3>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="ml-2 text-gray-600">Loading images...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.length > 0 ? (
                  images.map((image) => (
                    <div key={image.id} className="border rounded-lg overflow-hidden shadow-sm">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/cccccc/333333?text=Image+Not+Found`;
                            (e.target as HTMLImageElement).alt = `Image not found for ${image.alt}`;
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">{image.category}</Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImage(image.id)}
                            className="text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{image.alt}</p>
                        {image.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added: {new Date(image.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500 py-8">
                    No images in the gallery. Add some using the form above!
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};