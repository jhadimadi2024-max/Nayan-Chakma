import React, { useState, useEffect, useRef } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { 
  smartSupabaseUpload, 
  smartSupabaseInsert, 
  prepareProductPayload, 
  FALLBACK_PRODUCT_IMAGE 
} from '../../utils/supabaseDataService';
import { databaseService } from '../../services/databaseService';
import { isLocalTransientUrl } from '../../utils/directSupabaseStorage';

export interface ProductData {
  id?: string;
  title: string;
  category: string;
  sku: string;
  stock: number | string;
  unitAmount?: string;
  unitType?: string;
  price: number | string;
  description?: string;
  image: string;
  images?: string[];
  youtubeUrl?: string;
  sellerPhone?: string;
  origin?: string;
  qualityStandard?: string;
  stockStatusText?: string;
  sellerName?: string;
  [key: string]: any;
}

interface AdminUploadFormProps {
  initialProduct?: ProductData | null;
  productToEdit?: ProductData | null;
  onSave?: (product: ProductData) => void;
  onSubmit?: (product: ProductData) => void;
  onCancel?: () => void;
}

const UNIT_OPTIONS = ['গ্রাম (g)', 'কেজি (kg)', 'মিলি (ml)', 'লিটার (L)', 'পিস (Pcs)', 'জোড়া', 'প্যাকেট'];

export const AdminUploadForm: React.FC<AdminUploadFormProps> = ({
  initialProduct,
  productToEdit,
  onSave,
  onSubmit,
  onCancel,
}) => {
  const activeProduct = initialProduct || productToEdit;

  // ডিফল্ট মানসহ ফর্ম স্টেট
  const [formData, setFormData] = useState<ProductData>({
    title: '',
    category: 'ফুড / ভোগ্য পণ্য',
    sku: 'JHD-015',
    stock: '50',
    unitAmount: '১',
    unitType: 'পিস (Pcs)',
    price: '',
    description: '',
    image: '',
    images: [],
    youtubeUrl: '',
    sellerPhone: '01870592699',
    // স্পেসিফিকেশন ও তথ্যসূচির ডিফল্ট টেক্সটসমূহ
    origin: 'পার্বত্য চট্টগ্রাম',
    qualityStandard: '১০০% বিশুদ্ধ ও পরীক্ষিত',
    stockStatusText: 'স্টকে পর্যাপ্ত রয়েছে',
    sellerName: 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeProduct) {
      setFormData({
        ...activeProduct,
        title: activeProduct.title || activeProduct.name || '',
        category: activeProduct.category || 'ফুড / ভোগ্য পণ্য',
        sku: activeProduct.sku || 'JHD-015',
        origin: activeProduct.origin || 'পার্বত্য চট্টগ্রাম',
        qualityStandard: activeProduct.qualityStandard || '১০০% বিশুদ্ধ ও পরীক্ষিত',
        stockStatusText: activeProduct.stockStatusText || 'স্টকে পর্যাপ্ত রয়েছে',
        sellerName: activeProduct.sellerName || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
        images: activeProduct.images || (activeProduct.image ? [activeProduct.image] : []),
      });
    }
  }, [activeProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImagePreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      const updatedImages = [...(formData.images || []), imageUrlInput.trim()];
      setFormData((prev) => ({
        ...prev,
        image: prev.image || imageUrlInput.trim(),
        images: updatedImages,
      }));
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedImages = (formData.images || []).filter((_, i) => i !== indexToRemove);
    setFormData((prev) => ({
      ...prev,
      image: updatedImages.length > 0 ? updatedImages[0] : '',
      images: updatedImages,
    }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.price) {
      setError('দয়া করে পণ্যের নাম এবং মূল্য পূরণ করুন।');
      return;
    }

    try {
      setLoading(true);

      const prodTitle = formData.title.trim();
      const prodCategory = formData.category;
      const prodPrice = Number(formData.price) || 0;
      const prodDesc = formData.description?.trim() || `${formData.title.trim()} - অত্যন্ত গুণসম্পন্ন পাহাড়ি পণ্য।`;

      let finalImageUrl = formData.image?.trim() || '';

      if (selectedFile) {
        const uploadRes = await smartSupabaseUpload('products', selectedFile, 'product');
        finalImageUrl = uploadRes.url;
      } else if (imagePreview && isLocalTransientUrl(imagePreview)) {
        const uploadRes = await smartSupabaseUpload('products', imagePreview, 'product');
        finalImageUrl = uploadRes.url;
      }

      if (!finalImageUrl && formData.images && formData.images.length > 0) {
        finalImageUrl = formData.images[0];
      }

      if (!finalImageUrl) {
        finalImageUrl = FALLBACK_PRODUCT_IMAGE;
      }

      const allImages = formData.images && formData.images.length > 0 
        ? formData.images 
        : [finalImageUrl];

      const formattedUnit = `${formData.unitAmount || ''} ${formData.unitType}`.trim();

      const productRecord = prepareProductPayload({
        name: prodTitle,
        price: prodPrice,
        category: prodCategory,
        description: prodDesc,
        image_url: finalImageUrl,
        images: allImages,
        youtube_url: formData.youtubeUrl,
        unit: formattedUnit,
        sku: formData.sku,
        stock_quantity: Number(formData.stock) || 50,
        seller_name: formData.sellerName || 'ঝাদিমাদি ভেরিফাইড মার্চেন্ট নেটওয়ার্ক',
        origin: formData.origin,
        quality_standard: formData.qualityStandard,
        district: 'খাগড়াছড়ি',
        upazila: 'সদর'
      });

      const insertRes = await smartSupabaseInsert('products', productRecord);

      if (!insertRes.success) {
        setError(`পণ্য ডেটাবেজে সংরক্ষণে সমস্যা: ${insertRes.error?.message || 'Database error'}`);
        setLoading(false);
        return;
      }

      alert("পণ্যটি সফলভাবে প্রকাশের জন্য সংরক্ষিত হয়েছে!");

      const finalProductData: ProductData = {
        ...formData,
        image: finalImageUrl,
        images: allImages,
        finalUnit: formattedUnit
      };

      if (onSave) onSave(finalProductData);
      if (onSubmit) onSubmit(finalProductData);

      try {
        databaseService.notifyEntityChange('products');
        databaseService.fetchProductsFromSupabase().catch(() => {});
      } catch (_) {}

    } catch (err: any) {
      setError(`পণ্য সেভ করতে সমস্যা হয়েছে: ${err?.message || 'আবার চেষ্টা করুন'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-4xl mx-auto border border-gray-100 text-left">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {activeProduct ? 'পণ্য এডিট করুন' : 'নতুন পণ্য রেজিস্ট্রেশন ফর্ম'}
        </h2>
        {onCancel && (
          <button onClick={onCancel} type="button" className="text-gray-400 hover:text-gray-600 font-bold text-xl">
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitForm} className="space-y-6">
        {/* ১. মৌলিক তথ্য */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">পণ্যের বাংলা নাম *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="যেমন: খাগড়াছড়ির পাহাড়ি মধু"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">বিক্রয় মূল্য (PRICE) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        {/* ২. পণ্য স্পেসিফিকেশন ও তথ্যসূচি (Product Specifications & Attributes) - অটোমেটিক টেক্সটসহ ইনপুট বক্স */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2">
            ২. পণ্য স্পেসিফিকেশন ও তথ্যসূচি (Product Specifications & Attributes)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">প্রোডাক্ট কোড (SKU)</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ক্যাটাগরি (Category)</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">একক / পরিমাপ (Unit / Pack)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="unitAmount"
                  value={formData.unitAmount}
                  onChange={handleChange}
                  className="w-20 border border-gray-300 p-2 rounded-lg text-sm bg-white"
                  placeholder="১"
                />
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 p-2 rounded-lg text-sm bg-white"
                >
                  {UNIT_OPTIONS.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">উৎপাদন স্থান (Origin)</label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">গুণগত মান (Quality Standard)</label>
              <input
                type="text"
                name="qualityStandard"
                value={formData.qualityStandard}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">স্টক অবস্থা (Stock Status)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="stockStatusText"
                  value={formData.stockStatusText}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 p-2 rounded-lg text-sm bg-white"
                />
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  title="স্টক সংখ্যা"
                  className="w-20 border border-gray-300 p-2 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">সরবরাহকারী / বিক্রেতা</label>
              <input
                type="text"
                name="sellerName"
                value={formData.sellerName}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* ৩. মিডিয়া ও মিডিয়া মিডিয়া যোগ */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <label className="block text-sm font-bold text-gray-800">পণ্যের ছবি ও ইউটিউব লিঙ্ক</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-lg border border-emerald-200 shrink-0"
            >
              <Upload className="w-4 h-4" />
              {selectedFile ? 'অন্য ছবি সিলেক্ট করুন' : 'ফোন/পিসি থেকে ছবি আপলোড'}
            </button>

            <div className="flex flex-1 gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 border border-gray-300 p-2 rounded-lg text-sm bg-white"
                placeholder="ছবি URL যোগ করুন..."
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg shrink-0"
              >
                যোগ করুন
              </button>
            </div>
          </div>

          {(selectedFile || imagePreview || (formData.images && formData.images.length > 0)) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {imagePreview && (
                <div className="relative w-16 h-16 border-2 border-emerald-500 rounded overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {formData.images?.map((imgUrl, idx) => (
                <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                  <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ইউটিউব ভিডিও লিঙ্ক (YouTube URL)</label>
            <input
              type="text"
              name="youtubeUrl"
              value={formData.youtubeUrl || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* ৪. বিস্তারিত বিবরণ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">বিস্তারিত বিবরণ</label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm"
            placeholder="পণ্যের বৈশিষ্ট্য ও গুণাগুণ সম্পর্কে লিখুন..."
          />
        </div>

        {/* ৫. বাটনসমূহ */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              বাতিল
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              '✓ পণ্য প্রকাশ করুন'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUploadForm;