import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../supabase';
import { BloodDonorProfileView } from './BloodDonorProfileView';
import { ServiceProviderProfile } from './ServiceProviderProfile';
import { ProductSellerProfile } from './ProductSellerProfile';
import { PermanentMemberProfile } from './PermanentMemberProfile';
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  LogOut,
  Droplet,
  Briefcase,
  Store,
  Crown,
  FileText,
  Loader2,
  ChevronRight,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

export interface ProfileTabProps {
  currentUser: UserProfile | null;
  lang: Language;
  onLogout?: () => void;
  onNavigateTab?: (tab: string) => void;
  onEditProfile?: (data: any, type: string) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTerms?: () => void;
  onOpenAccountDeletion?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  lang,
  onLogout,
  onNavigateTab,
  onEditProfile,
  onOpenPrivacyPolicy,
  onOpenTerms,
  onOpenAccountDeletion
}) => {
  const { logout, login } = useAuth();
  const [donorRecord, setDonorRecord] = useState<any>(null);
  const [serviceProviderRecord, setServiceProviderRecord] = useState<any>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState<boolean>(false);

  const isBn = lang === 'bn';

  // 1. Initial Synchronous Role Checks
  const userMemberUID = String(currentUser?.memberUID || (currentUser as any)?.sellerCode || currentUser?.id || '');
  const userRole = String(currentUser?.role || '').toLowerCase();

  const isLocalBloodDonor =
    userRole === 'blood_donor' ||
    userRole === 'donor' ||
    Boolean(currentUser?.isBloodDonor) ||
    Boolean((currentUser as any)?.is_blood_donor) ||
    Boolean((currentUser as any)?.blood_donor) ||
    userMemberUID.startsWith('BD-') ||
    userMemberUID.startsWith('JM-DONOR-') ||
    userMemberUID.startsWith('JH-D-');

  const isLocalServiceProvider =
    userRole === 'service_provider' ||
    userRole === 'professional' ||
    userRole === 'service' ||
    userRole === 'provider' ||
    userRole === 'partner' ||
    userMemberUID.startsWith('JH-P-');

  const isLocalProductSeller =
    !isLocalServiceProvider && (
      userRole === 'product_seller' ||
      userRole === 'seller' ||
      userRole === 'vendor' ||
      userRole === 'merchant' ||
      userMemberUID.startsWith('JH-S-')
    );

  const isLocalPermanentMember =
    !isLocalServiceProvider &&
    !isLocalProductSeller && (
      userRole === 'permanent_member' ||
      userRole === 'permanent' ||
      userMemberUID.startsWith('JH-M-')
    );

  // 2. Asynchronous Live Database Check: If user is logged in, verify if they exist in Supabase 'blood_donors' or 'service_providers'
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured) return;

    let isMounted = true;
    const phone = currentUser.phone || '';
    const userId = currentUser.id || '';

    const checkRegistrations = async () => {
      setIsCheckingSupabase(true);
      try {
        // Check blood_donors table
        if (phone || userId) {
          let donorQuery = supabase.from('blood_donors').select('*');
          if (phone) {
            donorQuery = donorQuery.or(`phone_number.eq.${phone},phone.eq.${phone},whatsapp_number.eq.${phone}`);
          } else if (userId) {
            donorQuery = donorQuery.eq('id', userId);
          }

          const { data: donorData, error: donorErr } = await donorQuery.maybeSingle();
          if (!donorErr && donorData && isMounted) {
            setDonorRecord(donorData);
            // If user's role is not yet marked, persist it into session
            if (currentUser.role !== 'blood_donor') {
              login({
                ...currentUser,
                role: 'blood_donor' as any,
                bloodGroup: donorData.blood_group || currentUser.bloodGroup,
                isBloodDonor: true
              });
            }
          }
        }

        // Check service_providers table if not already identified
        if (phone || userId) {
          let spQuery = supabase.from('service_providers').select('*');
          if (phone) {
            spQuery = spQuery.or(`phone.eq.${phone},phone_number.eq.${phone}`);
          } else if (userId) {
            spQuery = spQuery.eq('id', userId);
          }

          const { data: spData, error: spErr } = await spQuery.maybeSingle();
          if (!spErr && spData && isMounted) {
            setServiceProviderRecord(spData);
          }
        }
      } catch (err) {
        console.warn('[ProfileTab] Supabase registration lookup notice:', err);
      } finally {
        if (isMounted) setIsCheckingSupabase(false);
      }
    };

    checkRegistrations();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.phone, currentUser?.id]);

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  if (!currentUser) {
    return (
      <div className="p-4 max-w-md mx-auto text-center space-y-4 pt-10" id="profile-guest-view">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900">
            {isBn ? 'আপনার প্রোফাইলে লগইন করুন' : 'Sign in to your profile'}
          </h3>
          <p className="text-xs text-gray-500">
            {isBn ? 'অর্ডার ট্র্যাকিং ও প্রোফাইল সেবার জন্য সাইন ইন করুন' : 'Sign in to access order tracking and profile services'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('home')}
          className="px-6 py-2.5 bg-[#1b4332] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
        >
          {isBn ? 'হোমে ফিরে যান' : 'Back to Home'}
        </button>
      </div>
    );
  }

  // ==========================================
  // ROUTE 1: BLOOD DONOR PROFILE (Highest Priority for Donors)
  // "If registered as a Blood Donor, display their Donor Badge, Blood Group, Availability status, and a 'যোগাযোগ করুন' (Contact Now) button. Do not render the generic customer profile layout for registered donors."
  // ==========================================
  if (isLocalBloodDonor || donorRecord) {
    const resolvedDonor = {
      ...(currentUser || {}),
      ...(donorRecord || {}),
      bloodGroup: donorRecord?.blood_group || currentUser?.bloodGroup || 'O+',
      district: donorRecord?.district || currentUser?.district || 'খাগড়াছড়ি',
      upazila: donorRecord?.upazila || currentUser?.upazila || 'সদর',
      isAvailable: donorRecord?.is_available ?? donorRecord?.available ?? true,
      phone: donorRecord?.phone_number || donorRecord?.phone || currentUser?.phone,
      name: donorRecord?.full_name || donorRecord?.name || currentUser?.fullName || currentUser?.name,
      uniqueId: donorRecord?.unique_id || donorRecord?.district_unique_id || currentUser?.memberUID || `BD-${currentUser.id}`
    };

    return (
      <div className="py-2 max-w-3xl mx-auto w-full" id="profile-blood-donor-container">
        <BloodDonorProfileView
          donor={resolvedDonor}
          currentUser={currentUser}
          isOwner={true}
          lang={lang}
          onSignOut={handleSignOut}
          onBack={() => onNavigateTab && onNavigateTab('home')}
          onDeleteAccount={onOpenAccountDeletion}
        />
      </div>
    );
  }

  // ==========================================
  // ROUTE 2: SERVICE PROVIDER PROFILE
  // ==========================================
  if (isLocalServiceProvider || serviceProviderRecord) {
    return (
      <div className="py-2 max-w-3xl mx-auto w-full" id="profile-service-provider-container">
        <ServiceProviderProfile
          profileData={{ ...currentUser, ...serviceProviderRecord }}
          currentUser={currentUser}
          lang={lang}
          isOwner={true}
          onBack={() => onNavigateTab && onNavigateTab('home')}
          onEditProfile={(data) => onEditProfile && onEditProfile(data || currentUser, 'service')}
          onSignOut={handleSignOut}
          onDeleteAccount={onOpenAccountDeletion}
        />
      </div>
    );
  }

  // ==========================================
  // ROUTE 3: PRODUCT SELLER PROFILE
  // ==========================================
  if (isLocalProductSeller) {
    return (
      <div className="py-2 max-w-3xl mx-auto w-full" id="profile-product-seller-container">
        <ProductSellerProfile
          profileData={currentUser}
          currentUser={currentUser}
          lang={lang}
          isOwner={true}
          onBack={() => onNavigateTab && onNavigateTab('home')}
          onEditProfile={(data) => onEditProfile && onEditProfile(data || currentUser, 'seller')}
          onSignOut={handleSignOut}
          onDeleteAccount={onOpenAccountDeletion}
          onAddNewProduct={() => {}}
        />
      </div>
    );
  }

  // ==========================================
  // ROUTE 4: PERMANENT MEMBER PROFILE
  // ==========================================
  if (isLocalPermanentMember) {
    return (
      <div className="py-2 max-w-3xl mx-auto w-full" id="profile-permanent-member-container">
        <PermanentMemberProfile
          profileData={currentUser}
          currentUser={currentUser}
          lang={lang}
          isOwner={true}
          onBack={() => onNavigateTab && onNavigateTab('home')}
          onEditProfile={(data) => onEditProfile && onEditProfile(data || currentUser, 'permanent')}
          onSignOut={handleSignOut}
          onDeleteAccount={onOpenAccountDeletion}
        />
      </div>
    );
  }

  // ==========================================
  // ROUTE 5: STANDARD CUSTOMER PROFILE (Only for general customers)
  // ==========================================
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 my-2 max-w-md mx-auto" id="profile-customer-container">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-lg shadow-xs">
          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate">
            {currentUser.name || currentUser.fullName || 'সম্মানিত কাস্টমার'}
          </h3>
          <p className="text-xs text-gray-500">{currentUser.phone || 'গেস্ট কাস্টমার অ্যাকাউন্ট'}</p>
          <span className="inline-block mt-0.5 text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
            আইডি: {currentUser.memberUID || currentUser.id}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-700">
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <span className="text-gray-500">গ্রাহকের নাম:</span>
          <span className="font-bold text-gray-900">{currentUser.name || currentUser.fullName || 'অজানা'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <span className="text-gray-500">মোবাইল নম্বর:</span>
          <span className="font-bold text-gray-900">{currentUser.phone || 'যুক্ত করা হয়নি'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <span className="text-gray-500">অ্যাকাউন্টের ধরন:</span>
          <span className="font-bold text-emerald-700">সাধারণ ক্রেতা (Customer)</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <span className="text-gray-500">অবস্থান:</span>
          <span className="font-bold text-gray-900">{currentUser.upazila || currentUser.district || 'বাংলাদেশ'}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 space-y-2">
        {onOpenPrivacyPolicy && (
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="w-full py-2.5 bg-slate-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>গোপনীয়তা নীতি (Privacy Policy)</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>লগআউট (Sign Out)</span>
        </button>

        {onOpenAccountDeletion && (
          <button
            type="button"
            onClick={onOpenAccountDeletion}
            className="w-full py-2 text-rose-600 hover:text-rose-700 text-xs font-semibold text-center transition cursor-pointer"
          >
            অ্যাকাউন্ট ডিলিট করতে চান? এখানে ক্লিক করুন
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
