import React, { useState, useEffect } from 'react';
import { 
  Loader2, Sparkles, ArrowRight, Upload, Video, 
  Tag, DollarSign, FileText, Barcode, Layers, Box, Percent, Search, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Supabase client path

interface Product {
  id?: string;
  title_bn?: string;
  title_en?: string;
  product_code?: string;
  category?: string;
  price?: number;
  original_price?: number;
  stock_quantity?: number;
  discount_offer?: string;
  image_url?: string;
  youtube_url?: string;
  description?: string;
}

interface ModernAddProductFormProps {
  initialProduct?: Product | null;
  onSubmit?: (data: any) => void;
}

const CATEGORIES = [
  'ফুড ও খাবার',
  'পাহাড়ী পণ্য সম্ভার',
  'পোশাক-আশাক / ড্রেস',
  'রিয়েল এস্টেট',
  'গাড়ি ও যানবাহন',
  'শুঁটকি',
  'খাবার / ফুডস',
  'মসলা',
  'ঔষধ',
  'ইলেকট্রনিক & ইলেকট্রিক্যাল',
  'গহনা ও অলংকার',
  'অটোমোবাইল',
  'হস্তশিল্প',
  'মোবাইল',
  'গাড়ি ও বাইক',
  'ফলমূল',
  'শাকসবজি',
  'মাছ / মাংস',
  'পোশাক আশাক',
  'কিডস আইটেম',
  'ব্যাগ ও জুতা',
  'কৃষিপণ্য',
  'আসবাবপত্র',
  'বই / পত্র',
  'পাহাড়ি পোশাক',
  'চাইনিজ জিনিস',
  'ভেষজ পণ্য'
];

export const ModernAddProductForm: React.FC<ModernAddProductFormProps> = ({
  initialProduct,
  onSubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [discountOffer, setDiscountOffer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [description, setDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setTitleBn(initialProduct.title_bn || '');
      setTitleEn(initialProduct.title_en || '');
      setProductCode(initialProduct.product_code || '');
      setCategory(initialProduct.category || CATEGORIES[0]);
      setPrice(initialProduct.price ? String(initialProduct.price) : '');
      setOriginalPrice(initialProduct.original_price ? String(initialProduct.original_price) : '');
      setStockQuantity(initialProduct.stock_quantity ? String(initialProduct.stock_quantity) : '');
      setDiscountOffer(initialProduct.discount_offer || '');
      setImageUrl(initialProduct.image_url || '');
      setYoutubeUrl(initialProduct.youtube_url || '');
      setDescription(initialProduct.description || '');
    }
  }, [initialProduct]);

  // ইমেজ রিডার
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('ছবি প্রসেস করতে ব্যর্থ হয়েছে।');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // পাবলিশ / সাবমিট হ্যান্ডলার (সরাসরি Supabase-এ ডাটা ইনসার্ট করা)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const productPayload = {
      title_bn: titleBn,
      title_en: titleEn,
      product_code: productCode,
      category,
      price: parseFloat(price) || 0,
      original_price: parseFloat(originalPrice) || 0,
      stock_quantity: parseInt(stockQuantity) || 0,
      discount_offer: discountOffer,
      image_url: imageUrl,
      youtube_url: youtubeUrl,
      description,
    };

    try {
      if (initialProduct?.id && initialProduct.id !== 'new') {
        // আপডেট প্রোডাক্ট
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', initialProduct.id);

        if (error) throw error;
        alert('পণ্য সফলভাবে আপডেট করা হয়েছে!');
      } else {
        // নতুন প্রোডাক্ট ইনসার্ট
        const { error } = await supabase
          .from('products')
          .insert([productPayload]);

        if (error) throw error;
        alert('পণ্য সফলভাবে ডাটাবেজে সেভ হয়েছে!');
        
        // ফর্ম রিসেট
        setTitleBn('');
        setTitleEn('');
        setProductCode('');
        setPrice('');
        setOriginalPrice('');
        setStockQuantity('');
        setDiscountOffer('');
        setImageUrl('');
        setYoutubeUrl('');
        setDescription('');
      }

      if (onSubmit) {
        onSubmit(productPayload);
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert('পণ্য সেভ করতে ব্যর্থ হয়েছে: ' + (err.message || 'অজানা এরর'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-neutral-200 my-4 text-black">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {initialProduct?.id && initialProduct.id !== 'new' ? 'পণ্য আপডেট করুন' : 'পণ্য এনট্রি / রেজিস্ট্রেশন ফর্ম'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">সব তথ্য পূরণ করে পণ্য প্রকাশ করুন।</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="পণ্য বা কোড খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* ১. নাম */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
              ১. পণ্যের বাংলা নাম <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: প্রিমিয়াম পাহাড়ী মধু"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
              ২. পণ্যের ইংরেজি নাম (English Name)
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Ex: Premium Organic Honey"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {/* ২. কোড, ক্যাটাগরি ও স্টক */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-neutral-500" />
              ৩. প্রোডাক্ট কোড / SKU
            </label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="যেমন: HON-101"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              ৪. ক্যাটাগরি <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black focus:outline-none focus:border-black transition cursor-pointer"
            >
              {CATEGORIES.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-neutral-500" />
              ৫. স্টক পরিমাণ (Stock) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="যেমন: 50"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {/* ৩. দাম ও বিশেষ ছাড় */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
              ৬. বিক্রয় মূল্য (Price) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="৳ 0.00"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
              ৭. রেগুলার মূল্য (Original)
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="৳ 0.00"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              ৮. বিশেষ ছাড় / অফার
            </label>
            <input
              type="text"
              value={discountOffer}
              onChange={(e) => setDiscountOffer(e.target.value)}
              placeholder="যেমন: ১০% ছাড় / Buy 1 Get 1"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {/* ৪. ছবি আপলোড ও ইউটিউব লিংক */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-neutral-500" />
              ৯. ছবি সরাসরি সিলেক্ট করুন
            </label>
            
            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-3 text-center bg-neutral-50 hover:bg-neutral-100 transition relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-600 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>ছবি লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-600 py-2">
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                </div>
              )}
            </div>

            {imageUrl && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <img src={imageUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border" />
                <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ছবি যুক্ত হয়েছে!
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-red-500" />
              ১০. ইউটিউব ভিডিও লিংক (YouTube URL)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {/* ৫. বিবরণ */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-500" />
            ১১. পণ্যের বিস্তারিত বিবরণ (Description)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="পণ্যের উপাদান, ব্যবহারের নিয়ম বা বিশেষ বৈশিষ্ট্য লিখুন..."
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition resize-none"
          />
        </div>

        {/* সাবমিট বাটন */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full py-3 px-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>সেভ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {initialProduct?.id && initialProduct.id !== 'new'
                    ? 'পণ্য আপডেট করুন (Update Product)'
                    : 'পণ্য প্রকাশ করুন (Publish Product)'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ModernAddProductForm;