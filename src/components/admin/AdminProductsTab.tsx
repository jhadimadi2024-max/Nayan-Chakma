import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Plus, Search, Edit3, Trash2, X, UploadCloud, 
  Image as ImageIcon, Check, Loader2, Scale, Tag, ChevronRight, ChevronLeft, Database
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StoreProduct } from '../../data/productsData';
import { SupabaseMediaPickerModal } from './SupabaseMediaPickerModal';
import { supabaseMediaService } from '../../services/supabaseMediaService';
import { supabase } from '../../supabase';
import { resilientSupabaseDelete } from '../../services/supabaseDbHelper';
import { prepareProductPayload, smartSupabaseInsert } from '../../utils/supabaseDataService';

interface AdminProductsTabProps {
  onShowToast: (msg: string) => void;
  onPreviewProduct?: (prod: StoreProduct) => void;
  initialImageUrl?: string;
  onClearInitialImage?: () => void;
}

// আপনার Supabase categories টেবিলের নামের সাথে হুবহু মিল রাখা ক্যাটাগরি তালিকা
export const PRODUCT_CATEGORIES = [
  { value: 'Food', labelBn: 'ফুড ও খাবার' },
  { value: 'Agri', labelBn: 'পাহাড়ি পণ্য সম্ভার' },
  { value: 'Clothing', labelBn: 'পোশাক-আশাক / ড্রেস' },
  { value: 'RealEstate', labelBn: 'রিয়েল এস্টেট' },
  { value: 'Vehicles', labelBn: 'গাড়ি ও যানবাহন' },
  { value: 'ShutkiSidol', labelBn: 'শুঁটকি' },
  { value: 'SpicesGrains', labelBn: 'মসলা' },
  { value: 'HealthBeauty', labelBn: 'স্বাস্থ্য ও রূপচর্চা' },
  { value: 'Crafts', labelBn: 'হস্তশিল্প' },
  { value: 'Electronics', labelBn: 'ইলেকট্রনিক্স ও বৈদ্যুতিক' },
  { value: 'Jewelry', labelBn: 'গহনা ও অলংকার' },
  { value: 'HouseRent', labelBn: 'বাসা ভাড়া' },
];

export const getCategoryLabel = (catValue: string): string => {
  if (!catValue) return 'ফুড ও খাবার';
  const found = PRODUCT_CATEGORIES.find(c => c.value === catValue || c.labelBn === catValue);
  if (found) return found.labelBn;
  return catValue;
};

export const generateNextProductCode = (allProducts: StoreProduct[]): string => {
  let highestNum = 0;
  for (const p of allProducts) {
    if (p.code) {
      const match = p.code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    }
  }
  const nextNum = highestNum > 0 ? highestNum + 1 : (allProducts.length + 1);
  return String(nextNum).padStart(3, '0');
};

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ 
  onShowToast,
  onPreviewProduct,
  initialImageUrl,
  onClearInitialImage
}) => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductPublishStatus,
    setActiveDraftPreview,
    refreshProducts
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  useEffect(() => {
    if (initialImageUrl && initialImageUrl.trim()) {
      startNewProduct();
      setProductForm(prev => ({
        ...prev,
        image: initialImageUrl.trim(),
        images: [initialImageUrl.trim()]
      }));
      setActiveFormTab('basic');
      if (onClearInitialImage) {
        onClearInitialImage();
      }
    }
  }, [initialImageUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const isUploadingRef = useRef<boolean>(false);
  const [isSupabasePickerOpen, setIsSupabasePickerOpen] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'media' | 'overview'>('basic');

  // ফর্মে আলাদা স্টেট: পরিমাণ (উদাঃ 250, 1) এবং ইউনিট (উদাঃ গ্রাম, কেজি, টি)
  const [quantityNum, setQuantityNum] = useState<string>('250');
  const [quantityUnit, setQuantityUnit] = useState<string>('গ্রাম');

  const [productForm, setProductForm] = useState<{
    code: string;
    sku: string;
    title_bn: string;
    category: string;
    categoryLabelBn: string;
    price: number;
    discount_price: number;
    originalPrice: number;
    unit_pack: string;
    stock_quantity: number;
    image: string;
    images: string[];
    descriptionBn: string;
  }>({
    code: '001',
    sku: 'JDM-001',
    title_bn: '',
    category: 'Food',
    categoryLabelBn: 'ফুড ও খাবার',
    price: 0,
    discount_price: 0,
    originalPrice: 0,
    unit_pack: '250 গ্রাম',
    stock_quantity: 50,
    image: '',
    images: [],
    descriptionBn: ''
  });

  const startNewProduct = (categoryKey?: string) => {
    setEditingProduct(null);
    const nextCode = generateNextProductCode(products);
    const cat = categoryKey || 'Food';
    const catLabel = getCategoryLabel(cat);

    setQuantityNum('');
    setQuantityUnit('গ্রাম');

    setProductForm({
      code: nextCode,
      sku: `JDM-${nextCode}`,
      title_bn: '',
      category: cat,
      categoryLabelBn: catLabel,
      price: 0,
      discount_price: 0,
      originalPrice: 0,
      unit_pack: '',
      stock_quantity: 50,
      image: '',
      images: [],
      descriptionBn: ''
    });
    setActiveFormTab('basic');
    setUploadError(null);
    setIsCreating(true);
  };

  const startEditProduct = (prod: StoreProduct) => {
    setEditingProduct(prod);
    const prodIndex = products.findIndex(p => p.id === prod.id);
    const currentCode = prod.code || (prodIndex >= 0 ? String(prodIndex + 1).padStart(3, '0') : '001');

    const existingImages = Array.isArray(prod.images) && prod.images.length > 0 
      ? prod.images 
      : (prod.image ? [prod.image] : []);

    const fullUnit = prod.unit_pack || prod.unit || '250 গ্রাম';
    const parts = fullUnit.split(' ');
    setQuantityNum(parts[0] || '');
    setQuantityUnit(parts[1] || 'গ্রাম');

    setProductForm({
      code: currentCode,
      sku: prod.sku || prod.code || `JDM-${currentCode}`,
      title_bn: prod.nameBn || prod.title_bn || '',
      category: prod.category || 'Food',
      categoryLabelBn: prod.categoryLabelBn || getCategoryLabel(prod.category || 'Food'),
      price: prod.price ?? 0,
      discount_price: prod.discount_price ?? prod.discountPrice ?? 0,
      originalPrice: prod.originalPrice ?? 0,
      unit_pack: fullUnit,
      stock_quantity: prod.stock_quantity ?? prod.stock ?? 50,
      image: prod.image || (existingImages[0] || ''),
      images: existingImages,
      descriptionBn: prod.descriptionBn || prod.description || ''
    });
    setActiveFormTab('basic');
    setUploadError(null);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingProduct(null);
    setUploadError(null);
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    if (isUploadingRef.current || isUploadingImages) return;
    isUploadingRef.current = true;
    setIsUploadingImages(true);
    setUploadError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) {
      isUploadingRef.current = false;
      setIsUploadingImages(false);
      return;
    }

    try {
      const processedUrls: string[] = [];
      for (const file of fileArray) {
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('products')
          .upload(fileName, file, { cacheControl: '31536000', upsert: true });

        if (!uploadErr && uploadData?.path) {
          const { data: pubData } = supabase.storage.from('products').getPublicUrl(uploadData.path);
          if (pubData?.publicUrl) processedUrls.push(pubData.publicUrl);
        } else {
          const uploadRes = await supabaseMediaService.uploadToSupabase(file, editingProduct?.id);
          if (uploadRes.success && uploadRes.url) processedUrls.push(uploadRes.url);
        }
      }

      if (processedUrls.length > 0) {
        setProductForm(prev => {
          const updatedList = Array.from(new Set([...prev.images, ...processedUrls]));
          return {
            ...prev,
            images: updatedList,
            image: prev.image && updatedList.includes(prev.image) ? prev.image : updatedList[0]
          };
        });
        onShowToast(`⚡ ছবি সফলভাবে আপলোড হয়েছে!`);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      isUploadingRef.current = false;
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSaving) return;
    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      const finalTitleBn = productForm.title_bn.trim();
      if (!finalTitleBn) {
        onShowToast('❌ পণ্যের বাংলা নাম আবশ্যক!');
        setActiveFormTab('basic');
        return;
      }

      const primaryImg = productForm.image || productForm.images[0] || '';
      if (!primaryImg) {
        onShowToast('❌ অন্তত একটি ছবি আবশ্যক!');
        setActiveFormTab('media');
        return;
      }

      // পরিমাণ এবং ইউনিট একত্র করা (উদাঃ "১ কেজি" বা "২৫০ গ্রাম")
      const finalUnitPack = `${quantityNum.trim()} ${quantityUnit}`.trim();
      const finalSku = productForm.sku || `JDM-${productForm.code}`;
      const finalPrice = Number(productForm.price) || 0;
      const categoryVal = productForm.categoryLabelBn || getCategoryLabel(productForm.category);

      let targetDbId = editingProduct?.id;
      if (!targetDbId) {
        targetDbId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}`;
      }

      const safeProductPayload = prepareProductPayload({
        name: finalTitleBn,
        title: finalTitleBn,
        name_bn: finalTitleBn,
        product_name: finalTitleBn,
        price: finalPrice,
        unit: finalUnitPack,
        unit_pack: finalUnitPack,
        category: categoryVal,
        image_url: primaryImg,
        image: primaryImg,
        description: productForm.descriptionBn,
        stock: Number(productForm.stock_quantity) || 10,
        sku: finalSku,
        code: productForm.code,
        is_active: true,
        is_published: true
      });

      if (!editingProduct) {
        const insertRes = await smartSupabaseInsert('products', safeProductPayload);
        if (insertRes.success && insertRes.data?.id) {
          targetDbId = String(insertRes.data.id);
        } else {
          await supabase.from('products').insert([safeProductPayload]);
        }
      } else {
        await supabase.from('products').update(safeProductPayload).eq('id', targetDbId);
      }

      const payload: Partial<StoreProduct> = {
        id: targetDbId,
        code: productForm.code,
        sku: finalSku,
        nameBn: finalTitleBn,
        title_bn: finalTitleBn,
        category: productForm.category,
        categoryLabelBn: categoryVal,
        price: finalPrice,
        unit: finalUnitPack,
        unit_pack: finalUnitPack,
        stock: Number(productForm.stock_quantity) || 0,
        stock_quantity: Number(productForm.stock_quantity) || 0,
        image: primaryImg,
        images: productForm.images.length > 0 ? productForm.images : [primaryImg],
        description: productForm.descriptionBn,
        descriptionBn: productForm.descriptionBn,
        isPublished: true,
      };

      if (editingProduct) {
        updateProduct(targetDbId, payload);
        onShowToast('✅ পণ্য আপডেট করা হয়েছে!');
      } else {
        addProduct(payload as StoreProduct);
        onShowToast('🎉 নতুন পণ্য প্রকাশ করা হয়েছে!');
      }

      await refreshProducts();
      cancelForm();
    } catch (err: any) {
      onShowToast(`❌ সংরক্ষণ করতে ব্যর্থ: ${err?.message || ''}`);
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm('নিশ্চित এই পণ্যটি মুছে ফেলতে চান?')) return;
    try {
      await resilientSupabaseDelete('products', prodId);
      deleteProduct(prodId);
      onShowToast('🗑️ পণ্য মুছে ফেলা হয়েছে!');
      await refreshProducts();
    } catch (err: any) {
      onShowToast(`❌ মুছতে সমস্যা হয়েছে`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.nameBn || p.title_bn || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* হেডার */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            পণ্য ও স্টক ম্যানেজমেন্ট ({products.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">সহজে পণ্য যোগ ও স্টক নিয়ন্ত্রণ করুন।</p>
        </div>

        {!isCreating && (
          <button
            onClick={() => startNewProduct('Food')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> নতুন পণ্য যোগ করুন
          </button>
        )}
      </div>

      {/* প্রোডাক্ট রেজিস্ট্রেশন ফর্ম */}
      {isCreating ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xl overflow-hidden">
          <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {editingProduct ? 'পণ্য সংশোধন করুন' : 'নতুন পণ্য রেজিস্ট্রেশন ফর্ম'}
            </h3>
            <button onClick={cancelForm} className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পণ্যের বাংলা নাম *</label>
                <input
                  type="text"
                  required
                  value={productForm.title_bn}
                  onChange={e => setProductForm({...productForm, title_bn: e.target.value})}
                  placeholder="যেমন: খাগড়াছড়ির পাহাড়ি মধু"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি *</label>
                <select
                  value={productForm.category}
                  onChange={e => {
                    const val = e.target.value;
                    setProductForm({...productForm, category: val, categoryLabelBn: getCategoryLabel(val)});
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.labelBn}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">প্রোডাক্ট কোড / SKU</label>
                <input
                  type="text"
                  value={productForm.code}
                  onChange={e => setProductForm({...productForm, code: e.target.value, sku: `JDM-${e.target.value}`})}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">স্টক পরিমাণ *</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock_quantity}
                  onChange={e => setProductForm({...productForm, stock_quantity: parseInt(e.target.value) || 0})}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* 🌟 পরিমাণ ও একক (Unit) ইনপুট সেকশন 🌟 */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                পণ্যের পরিমাণ ও একক লিখুন (উদাঃ ২৫০ গ্রাম, ১ কেজি, ১ লিটার, ১ জোড়া):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">পরিমাণ (সংখ্যা লিখুন, ফাঁকা রাখা যাবে)</label>
                  <input
                    type="text"
                    placeholder="যেমন: 250 বা 1"
                    value={quantityNum}
                    onChange={e => setQuantityNum(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">একক সিলেক্ট করুন</label>
                  <select
                    value={quantityUnit}
                    onChange={e => setQuantityUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="গ্রাম">গ্রাম (g)</option>
                    <option value="কেজি">কেজি (kg)</option>
                    <option value="লিটার">লিটার (L)</option>
                    <option value="মিলি">মিলি (ml)</option>
                    <option value="টি">টি / পিস (Pcs)</option>
                    <option value="জোড়া">জোড়া (Pair)</option>
                    <option value="প্যাকেট">প্যাকেট (Packet)</option>
                    <option value="বস্তা">বস্তা (Sack)</option>
                    <option value="ডজন">ডজন (Dozen)</option>
                    <option value="শতক">শতক / ডেসিমাল</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800 font-semibold">
                চূড়ান্ত একক: <strong className="bg-white px-2 py-0.5 rounded border border-emerald-300">{quantityNum} {quantityUnit}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিক্রয় মূল্য (PRICE) ৳ *</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পণ্যের ছবি আপলোড করুন *</label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files && handleFilesSelected(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    {isUploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    ছবি সিলেক্ট করুন
                  </button>
                  {productForm.image && (
                    <img src={productForm.image} alt="Preview" className="w-10 h-10 rounded-lg object-cover border" />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ</label>
              <textarea
                rows={3}
                value={productForm.descriptionBn}
                onChange={e => setProductForm({...productForm, descriptionBn: e.target.value})}
                placeholder="পণ্যের গুণাগুণ সম্পর্কে লিখুন..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingProduct ? 'পরিবর্তন সংরক্ষণ করুন' : 'পণ্য প্রকাশ করুন'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* প্রোডাক্ট টেবিল */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="পণ্যের নাম লিখে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                <th className="p-3">পণ্য</th>
                <th className="p-3">ক্যাটাগরি</th>
                <th className="p-3">পরিমাণ / ইউনিট</th>
                <th className="p-3">মূল্য</th>
                <th className="p-3">স্টক</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      <img src={prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt="" className="w-10 h-10 rounded-xl object-cover border" />
                      <span className="font-bold text-slate-900">{prod.nameBn || prod.title_bn}</span>
                    </td>
                    <td className="p-3 text-slate-600">{prod.categoryLabelBn || prod.category}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                        {prod.unit_pack || prod.unit || '২৫০ গ্রাম'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700">৳ {prod.price}</td>
                    <td className="p-3 font-bold">{prod.stock_quantity ?? prod.stock ?? 0} টি</td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => startEditProduct(prod)} className="p-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(prod.id)} className="p-1.5 bg-slate-100 hover:bg-red-600 hover:text-white rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">কোনো পণ্য পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};