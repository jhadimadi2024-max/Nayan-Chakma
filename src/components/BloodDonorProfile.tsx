import React, { useState, useEffect, useMemo } from 'react';
import {
  Droplet,
  MapPin,
  Calendar,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  PhoneCall,
  MessageSquare,
  Bell,
  MoreVertical,
  ArrowLeft,
  ShieldCheck,
  Check,
  Copy,
  AlertTriangle,
  History,
  ToggleLeft,
  ToggleRight,
  User,
  Heart,
  Award,
  FileText,
  Share2,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Building2,
  CheckSquare
} from 'lucide-react';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';

export interface DonationRecord {
  id: string;
  date: string;
  location: string;
  recipientNote?: string;
  verified: boolean;
}

export interface BloodDonorData {
  id?: string;
  uniqueId?: string;
  memberUID?: string;
  name?: string;
  fullName?: string;
  bloodGroup: string;
  district?: string;
  upazila?: string;
  location?: string;
  area?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  photoUrl?: string;
  lastDonationDate?: string;
  lastDonation?: string;
  isAvailable?: boolean;
  totalDonations?: number;
  gender?: string;
  age?: number | string;
  weightKg?: number | string;
  emergencyContactNote?: string;
  donationHistory?: DonationRecord[];
  status?: string;
  createdAt?: string;
}

export interface BloodDonorProfileProps {
  donor?: any;
  profileData?: any;
  currentUser?: any;
  isOwner?: boolean;
  lang?: Language;
  onSignOut?: () => void;
  onUpdateLastDonation?: (newDate: string) => void;
  onBack?: () => void;
  onEditProfile?: (data?: any) => void;
  onDeleteAccount?: () => void;
}

export const BloodDonorProfile: React.FC<BloodDonorProfileProps> = ({
  donor: passedDonor,
  profileData,
  currentUser,
  isOwner: passedIsOwner,
  lang = 'bn',
  onSignOut,
  onUpdateLastDonation,
  onBack,
  onEditProfile,
  onDeleteAccount
}) => {
  const { logout } = useAuth();
  const isBn = lang === 'bn';

  // Merge raw input objects
  const rawData = useMemo(() => {
    return {
      ...(currentUser || {}),
      ...(profileData || {}),
      ...(passedDonor || {})
    };
  }, [currentUser, profileData, passedDonor]);

  // Compute if current viewer is the actual profile owner
  const computedIsOwner = useMemo(() => {
    if (typeof passedIsOwner === 'boolean') return passedIsOwner;
    if (!currentUser || !rawData) return false;
    const profileId = rawData.id || rawData.uniqueId || rawData.memberUID;
    const currentUserId = currentUser.id || currentUser.uniqueId || currentUser.memberUID;
    if (profileId && currentUserId && profileId === currentUserId) return true;
    if (currentUser.phone && rawData.phone && currentUser.phone === rawData.phone) return true;
    return false;
  }, [passedIsOwner, currentUser, rawData]);

  // Dual-View toggle state (Owner View vs Customer/Requester View)
  const [activeViewMode, setActiveViewMode] = useState<'owner' | 'requester'>(
    computedIsOwner ? 'owner' : 'requester'
  );

  useEffect(() => {
    setActiveViewMode(computedIsOwner ? 'owner' : 'requester');
  }, [computedIsOwner]);

  const isOwnerView = activeViewMode === 'owner';

  // Resolved Donor Profile
  const donor: BloodDonorData = useMemo(() => {
    const rawBlood = rawData.bloodGroup || rawData.blood_group || 'O+';
    const cleanBlood = rawBlood.toUpperCase().replace(/\s+/g, '');

    return {
      id: rawData.id || 'BD-001',
      uniqueId: rawData.uniqueId || rawData.memberUID || `JM-DONOR-${rawData.id || '789'}`,
      memberUID: rawData.memberUID || rawData.uniqueId || 'JM-DONOR-001',
      name: rawData.fullName || rawData.name || (isBn ? 'নির্মল চাকমা (Nirmal Chakma)' : 'Nirmal Chakma'),
      fullName: rawData.fullName || rawData.name || (isBn ? 'নির্মল চাকমা' : 'Nirmal Chakma'),
      bloodGroup: cleanBlood || 'O+',
      district: rawData.district || rawData.location || (isBn ? 'রাঙামাটি (Rangamati)' : 'Rangamati'),
      upazila: rawData.upazila || (isBn ? 'সদর (Sadar)' : 'Sadar'),
      location: rawData.location || `${rawData.upazila ? rawData.upazila + ', ' : ''}${rawData.district || 'রাঙামাটি'}`,
      area: rawData.area || (isBn ? 'তবলছড়ি, রাঙামাটি পার্বত্য জেলা' : 'Tabalchhari, Rangamati'),
      phone: rawData.phone || rawData.contactNumber || '01870592699',
      email: rawData.email || 'donor.rangamati@jhadimadi.com',
      avatar:
        rawData.avatar ||
        rawData.photoUrl ||
        rawData.permanentMemberPhotoUrl ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      lastDonationDate: rawData.lastDonationDate || rawData.lastDonation || '2024-01-15',
      isAvailable: rawData.isAvailable !== false,
      totalDonations: Number(rawData.totalDonations) || 6,
      gender: rawData.gender || (isBn ? 'পুরুষ' : 'Male'),
      age: rawData.age || 29,
      weightKg: rawData.weightKg || 68,
      emergencyContactNote:
        rawData.emergencyContactNote ||
        'জরুরি রক্তের প্রয়োজনে সরাসরি কল করুন অথবা হোয়াটসঅ্যাপে হাসপাতালের রিকুইজিশন স্লিপসহ মেসেজ পাঠান।',
      donationHistory: rawData.donationHistory || [
        {
          id: 'rec-1',
          date: '2024-01-15',
          location: 'রাঙামাটি জেনারেল হাসপাতাল (Rangamati General Hospital)',
          recipientNote: 'থ্যালাসেমিয়া রোগীর জন্য জরুরি রক্তদান',
          verified: true
        },
        {
          id: 'rec-2',
          date: '2023-09-10',
          location: 'খাগড়াছড়ি সদর আধুনিক হাসপাতাল (Khagrachhari Sadar Hospital)',
          recipientNote: 'সার্জারি ইউনিটে জরুরি ও-পজিটিভ রক্তদান',
          verified: true
        },
        {
          id: 'rec-3',
          date: '2023-05-02',
          location: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল (CMCH)',
          recipientNote: 'দুর্ঘটনায় আহত রোগীর জন্য রক্তদান',
          verified: true
        }
      ]
    };
  }, [rawData, isBn]);

  // Local state for Availability Status (Toggleable by Owner)
  const [isAvailable, setIsAvailable] = useState<boolean>(donor.isAvailable !== false);
  const [availabilityReason, setAvailabilityReason] = useState<string>('');

  // Local state for Last Donation Date
  const [lastDonationDate, setLastDonationDate] = useState<string>(donor.lastDonationDate || '2024-01-15');
  const [historyList, setHistoryList] = useState<DonationRecord[]>(donor.donationHistory || []);

  // Modal State
  const [activeModal, setActiveModal] = useState<
    'none' | 'menu' | 'history' | 'update_availability' | 'edit_date' | 'notifications' | 'messages' | 'emergency_request' | 'contact_donor'
  >('none');

  // New Donation form state
  const [newDonationDate, setNewDonationDate] = useState<string>('');
  const [newDonationLocation, setNewDonationLocation] = useState<string>('');
  const [newDonationNote, setNewDonationNote] = useState<string>('');

  // Emergency Request state (VIEW B)
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [bagsNeeded, setBagsNeeded] = useState('1');
  const [urgencyNote, setUrgencyNote] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Eligibility Calculation (Standard medical threshold: 90 days / 3 months)
  const eligibility = useMemo(() => {
    if (!lastDonationDate) {
      return { eligible: true, daysElapsed: 999, daysRemaining: 0 };
    }
    const last = new Date(lastDonationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 90 - daysElapsed);
    return {
      eligible: daysElapsed >= 90,
      daysElapsed,
      daysRemaining
    };
  }, [lastDonationDate]);

  // Handle Availability Toggle
  const handleToggleAvailability = (newStatus: boolean) => {
    setIsAvailable(newStatus);
    showToast(
      newStatus
        ? isBn
          ? 'স্ট্যাটাস আপডেট: আপনি এখন রক্তদানে "উপলব্ধ (Available)"।'
          : 'Status updated: You are now marked as "Available".'
        : isBn
          ? 'স্ট্যাটাস আপডেট: আপনি এখন "অনুপলব্ধ (Not Available)"।'
          : 'Status updated: You are now marked as "Not Available".'
    );
  };

  // Handle Add / Update Donation Date
  const handleSaveDonationDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonationDate) return;

    setLastDonationDate(newDonationDate);
    if (onUpdateLastDonation) {
      onUpdateLastDonation(newDonationDate);
    }

    if (newDonationLocation) {
      const newRecord: DonationRecord = {
        id: `rec-${Date.now()}`,
        date: newDonationDate,
        location: newDonationLocation,
        recipientNote: newDonationNote || 'রক্তদান সম্পন্ন',
        verified: true
      };
      setHistoryList([newRecord, ...historyList]);
    }

    setActiveModal('none');
    setNewDonationDate('');
    setNewDonationLocation('');
    setNewDonationNote('');
    showToast(isBn ? 'সর্বশেষ রক্তদানের তারিখ সফলভাবে সংরক্ষিত হয়েছে।' : 'Last donation date updated.');
  };

  // Safe Dialer Trigger
  const handleDirectCall = () => {
    const rawNumber = String(donor.phone || '01870592699');
    const cleanNumber = rawNumber.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  // WhatsApp Emergency Contact Trigger
  const handleWhatsAppEmergency = () => {
    const rawNumber = String(donor.phone || '01870592699');
    let digits = rawNumber.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '88' + digits;
    } else if (!digits.startsWith('88') && digits.length === 10) {
      digits = '880' + digits;
    }

    const message = `জরুরি রক্তের আবেদন: আসসালামু আলাইকুম / নমস্কার। ঝাদিমাদি ডট কম প্ল্যাটফর্মে আপনার রক্তদাতা প্রোফাইল দেখে যোগাযোগ করছি।\n\n- রক্তের গ্রুপ: ${donor.bloodGroup}\n- এলাকা: ${donor.district}\n- জরুরি তথ্য: রক্তের প্রয়োজন সংক্রান্ত সহায়তা কামনা করছি।`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Submit Emergency Request in VIEW B
  const handleSubmitEmergencyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      isBn
        ? 'জরুরি রক্তের অনুরোধ রক্তদাতার কাছে সরাসরি পাঠানো হয়েছে!'
        : 'Emergency request sent directly to the donor!'
    );
    setActiveModal('none');
    setPatientName('');
    setHospitalName('');
    setUrgencyNote('');
  };

  return (
    <div
      className="min-h-screen bg-[#FBFBFA] text-black font-sans pb-16 selection:bg-black selection:text-white"
      id="blood-donor-profile-container"
    >
      {/* =========================================================================
          TOAST FEEDBACK
          ========================================================================= */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 rounded-md shadow-2xl border border-neutral-700 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW SWITCHER TOGGLE PILL (For interactive preview between Owner and Customer views)
          ========================================================================= */}
      <div className="bg-black text-white px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-mono text-[11px] text-neutral-300">
            মোড: <strong className="text-white">{isOwnerView ? 'মালিক ভিউ (VIEW A: Owner View)' : 'গ্রাহক / অনুরোধকারী ভিউ (VIEW B: Requester View)'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 border border-neutral-700 rounded-md p-0.5 bg-neutral-900">
          <button
            type="button"
            onClick={() => setActiveViewMode('owner')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
              isOwnerView ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
            id="toggle-donor-owner-view-btn"
          >
            মালিক ভিউ (Owner)
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode('requester')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
              !isOwnerView ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
            id="toggle-donor-requester-view-btn"
          >
            গ্রাহক ভিউ (Customer)
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. HEADER SECTION
          - Platform Title: "Jhadimadi.com"
          - Sub-Header: "Blood Donor Profile"
          - Status Badge: Clear availability indicator ("Available" / "Not Available")
          - VIEW A: Notification icon, Messaging icon, 3-Line (Hamburger) Menu
          - VIEW B: Top-right menu options completely hidden
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FBFBFA] border-b border-neutral-300 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Left: Back Button & Sub-Header */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-8 h-8 rounded border border-neutral-300 hover:bg-neutral-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="ফিরে যান"
                id="blood-donor-back-btn"
              >
                <ArrowLeft className="w-4 h-4 text-black" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider uppercase text-black font-mono leading-tight">
                  Jhadimadi.com
                </h1>
                <span className="hidden sm:inline text-neutral-400">•</span>
                
                {/* Clear Availability Status Badge in Header */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    isAvailable
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-200 text-neutral-800 border-neutral-400'
                  }`}
                  id="header-availability-badge"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAvailable ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                    }`}
                  />
                  <span>{isAvailable ? 'Available (উপলব্ধ)' : 'Not Available (অনুপলব্ধ)'}</span>
                </div>
              </div>

              <h2 className="text-xs font-semibold text-neutral-600 font-mono mt-0.5">
                Blood Donor Profile
              </h2>
            </div>
          </div>

          {/* Right Controls: CONDITIONAL RENDERING (VIEW A vs VIEW B) */}
          {isOwnerView ? (
            /* VIEW A (Owner View): Notification icon, Messaging icon, 3-Line Menu box */
            <div className="flex items-center gap-2" id="blood-donor-owner-controls">
              
              {/* Notification Icon */}
              <button
                type="button"
                onClick={() => setActiveModal('notifications')}
                className="relative w-8 h-8 rounded border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="বিজ্ঞপ্তি (Notifications)"
                id="btn-donor-notifications"
              >
                <Bell className="w-4 h-4 text-black" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  2
                </span>
              </button>

              {/* Messaging Icon */}
              <button
                type="button"
                onClick={() => setActiveModal('messages')}
                className="relative w-8 h-8 rounded border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="মেসেজ ও ইনকোয়ারি (Messages)"
                id="btn-donor-messages"
              >
                <MessageSquare className="w-4 h-4 text-black" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  1
                </span>
              </button>

              {/* 3-Line (Hamburger) Menu Box */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveModal(prev => (prev === 'menu' ? 'none' : 'menu'))}
                  className="w-8 h-8 rounded border-2 border-black bg-black text-white hover:bg-neutral-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="মেনু (Menu)"
                  id="btn-donor-hamburger-menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu Options */}
                {activeModal === 'menu' && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-black rounded-md shadow-2xl py-2 z-50 animate-fade-in font-mono text-xs">
                    
                    {/* Update Availability Status */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('update_availability');
                      }}
                      className="w-full px-4 py-2.5 text-left text-black hover:bg-neutral-100 flex items-center justify-between font-bold cursor-pointer border-b border-neutral-100"
                    >
                      <div className="flex items-center gap-2">
                        {isAvailable ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-neutral-400" />}
                        <span>উপলব্ধতা পরিবর্তন (Availability)</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isAvailable ? 'bg-black text-white border-black' : 'bg-neutral-200 text-neutral-700 border-neutral-300'}`}>
                        {isAvailable ? 'Active' : 'Off'}
                      </span>
                    </button>

                    {/* View Donation History */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('history');
                      }}
                      className="w-full px-4 py-2 text-left text-black hover:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <History className="w-4 h-4" />
                      <span>রক্তদানের ইতিহাস (History)</span>
                    </button>

                    {/* Edit Last Donation Date */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('edit_date');
                      }}
                      className="w-full px-4 py-2 text-left text-black hover:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>তারিখ আপডেট (Update Date)</span>
                    </button>

                    {/* Edit Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('none');
                        if (onEditProfile) onEditProfile(donor);
                      }}
                      className="w-full px-4 py-2 text-left text-black hover:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>প্রোফাইল সম্পাদন (Edit Profile)</span>
                    </button>

                    {/* Notifications */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('notifications');
                      }}
                      className="w-full px-4 py-2 text-left text-black hover:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Bell className="w-4 h-4" />
                      <span>জরুরি রক্তের রিকোয়েস্ট (Alerts)</span>
                    </button>

                    <div className="border-t border-neutral-200 my-1" />

                    {/* Sign Out */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('none');
                        if (onSignOut) {
                          onSignOut();
                        } else {
                          logout();
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-neutral-800 hover:bg-neutral-100 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগ আউট (Sign Out)</span>
                    </button>

                    {/* Delete Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('none');
                        if (onDeleteAccount) onDeleteAccount();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>প্রোফাইল প্রত্যাহার (Deactivate)</span>
                    </button>

                  </div>
                )}
              </div>

            </div>
          ) : (
            /* VIEW B (Requester / Customer View): Top-right menu options are COMPLETELY HIDDEN */
            <div className="flex items-center gap-2" id="blood-donor-customer-badge">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border border-black bg-black text-white font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Donor</span>
              </span>
            </div>
          )}

        </div>
      </header>

      {/* =========================================================================
          2. PROFILE LAYOUT & INFORMATION SECTION
          - Left Side: Donor Photo
          - Right/Below Photo: Full Name, Blood Group (e.g. A+, B+, O+), District/Location (e.g. Rangamati / Moulvibazar), and Last Donation Date
          - Theme: Clean, high-readability Black & White / Monochrome layout for quick access
          ========================================================================= */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Main Donor Identity Card */}
        <section
          className="bg-white border-2 border-black rounded-lg p-5 sm:p-6 shadow-md relative overflow-hidden space-y-5"
          id="blood-donor-card"
        >
          {/* Card Top Strip */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase font-black tracking-widest text-neutral-500 block">
                JHADIMADI EMERGENCY BLOOD NETWORK • VOLUNTARY DONOR
              </span>
              <h3 className="text-base sm:text-lg font-black font-mono tracking-tight text-black uppercase">
                স্বেচ্ছাসেবী রক্তদাতা পরিচয়পত্র (Donor ID Card)
              </h3>
            </div>

            {/* Status Indicator */}
            <div className="text-right font-mono text-[10px] shrink-0">
              <span
                className={`px-2 py-0.5 rounded border font-bold uppercase tracking-wider block ${
                  isAvailable
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-400 bg-neutral-200 text-neutral-700'
                }`}
              >
                {isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}
              </span>
              <span className="text-[9px] text-neutral-500 block mt-0.5">
                ID: {donor.uniqueId}
              </span>
            </div>
          </div>

          {/* Profile Core Body: Left Photo + Right/Below Information */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            
            {/* LEFT SIDE: Donor Photo */}
            <div className="shrink-0 flex flex-col items-center space-y-2">
              <div className="w-32 h-40 sm:w-36 sm:h-44 border-2 border-black rounded bg-neutral-100 p-1 relative shadow-sm">
                <img
                  src={donor.avatar}
                  alt={donor.name}
                  className="w-full h-full object-cover rounded-xs grayscale hover:grayscale-0 transition duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                
                {/* Blood Group Watermark Badge on Photo */}
                <div className="absolute bottom-2 right-2 bg-black text-white px-2 py-0.5 rounded text-xs font-mono font-black border border-white shadow">
                  {donor.bloodGroup}
                </div>
              </div>

              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                DONOR PHOTO
              </span>
            </div>

            {/* RIGHT / BELOW PHOTO: Full Name, Blood Group, District/Location, Last Donation Date */}
            <div className="flex-1 w-full space-y-3.5 text-center sm:text-left">
              
              {/* 1. Full Name */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block font-bold">
                  রক্তদাতার পূর্ণ নাম (Full Name)
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
                  {donor.name}
                </h4>
              </div>

              {/* 2. Blood Group (e.g. A+, B+, O+) & District/Location (e.g. Rangamati / Moulvibazar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                {/* Blood Group Card */}
                <div className="p-3 border-2 border-black rounded bg-[#FBFBFA] flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded border-2 border-black bg-black text-white flex flex-col items-center justify-center shrink-0">
                    <Droplet className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-neutral-500 block">
                      রক্তের গ্রুপ (Blood Group)
                    </span>
                    <span className="font-mono font-black text-xl text-black">
                      {donor.bloodGroup}
                    </span>
                  </div>
                </div>

                {/* District / Location Card */}
                <div className="p-3 border border-neutral-300 rounded bg-[#FBFBFA] flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded border border-neutral-300 bg-white text-black flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-neutral-500 block">
                      জেলা ও এলাকা (District / Location)
                    </span>
                    <span className="font-mono font-black text-sm text-black block truncate">
                      {donor.district}
                    </span>
                    <span className="text-[10px] text-neutral-600 block">
                      {donor.upazila ? `${donor.upazila}, ` : ''}{donor.area || 'পার্বত্য জেলা'}
                    </span>
                  </div>
                </div>

              </div>

              {/* 3. Last Donation Date */}
              <div className="p-3 border border-neutral-300 rounded bg-[#F4F4F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded border border-neutral-300 bg-white flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-neutral-500 block">
                      সর্বশেষ রক্তদানের তারিখ (Last Donation Date)
                    </span>
                    <span className="font-mono font-black text-sm text-black">
                      {lastDonationDate || 'উল্লেখ নেই'}
                    </span>
                  </div>
                </div>

                {/* Eligibility Tag based on 90-day cycle */}
                <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono">
                  {eligibility.eligible ? (
                    <span className="px-2.5 py-1 rounded bg-black text-white font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>রক্তদানে প্রস্তুত (Ready)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-neutral-200 text-neutral-800 border border-neutral-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>বিরতিতে ({eligibility.daysRemaining} দিন বাকি)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Additional Vital Metrics Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 font-mono text-xs text-neutral-700">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-black" />
                  <span>মোট রক্তদান: <strong className="text-black font-bold">{donor.totalDonations || historyList.length} বার</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-black" />
                  <span>জীবনদায়ী ব্যাজ: <strong className="text-black font-bold">গোল্ড ডোনার</strong></span>
                </div>
              </div>

              {/* Explicit Verified Donor Badge & Status Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-2 border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3" id="donor-profile-badge-box">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Droplet className="w-6 h-6 fill-white text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-gray-900 text-sm">স্বেচ্ছাসেবী রক্তদাতা ব্যাজ</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        যাচাইকৃত ডোনার
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      গ্রুপ: <span className="font-bold text-rose-700">{donor.bloodGroup}</span> • 
                      অবস্থা: <span className={`font-bold ${isAvailable ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {isAvailable ? 'রক্তদানে প্রস্তুত (Available)' : 'অনুপলব্ধ (Not Available)'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Primary Contact Now Button (Mandatory for Donor Profile) */}
                <button
                  type="button"
                  onClick={() => setActiveModal('contact_donor')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                  id="btn-donor-contact-now-main"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>যোগাযোগ করুন (Contact Now)</span>
                </button>
              </div>

            </div>

          </div>

          {/* Quick Notice Banner */}
          <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-[11px] font-mono text-neutral-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              <span>নিরাপদ ও বিনামূল্যে স্বেচ্ছাসেবী রক্তদান উদ্যোগ</span>
            </span>
            <span className="text-[10px] text-neutral-400">JHADIMADI COMMUNITY</span>
          </div>

        </section>

        {/* =========================================================================
            3. VIEW A (OWNER VIEW SPECIFIC CONTROLS & MANAGEMENT BAR)
            - Update availability status
            - View and update donation history
            ========================================================================= */}
        {isOwnerView && (
          <section className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <ToggleRight className="w-4 h-4 text-black" />
                <span>মালিক কন্ট্রোল প্যানেল (Owner Management)</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-300 bg-[#F4F4F0]">
                PRIVATE ACCESS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Availability Status Card with Direct Toggle */}
              <div className="p-3 border border-neutral-300 rounded bg-[#FBFBFA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">
                    উপলব্ধতা স্ট্যাটাস (Availability)
                  </span>
                  <span className="font-mono font-bold text-black text-sm">
                    {isAvailable ? 'উপলব্ধ (Available)' : 'অনুপলব্ধ (Not Available)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAvailability(!isAvailable)}
                  className={`px-3 py-1.5 rounded font-mono font-bold text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                    isAvailable
                      ? 'bg-black text-white border-black hover:bg-neutral-800'
                      : 'bg-neutral-200 text-neutral-800 border-neutral-400 hover:bg-neutral-300'
                  }`}
                  id="owner-toggle-availability-btn"
                >
                  {isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{isAvailable ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
                </button>
              </div>

              {/* Donation History Quick Trigger */}
              <div className="p-3 border border-neutral-300 rounded bg-[#FBFBFA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">
                    রক্তদানের ইতিহাস (History)
                  </span>
                  <span className="font-mono font-bold text-black text-sm">
                    {historyList.length} টি রেকর্ড সংরক্ষিত
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModal('history')}
                  className="px-3 py-1.5 rounded border border-black bg-white hover:bg-neutral-100 font-mono font-bold text-xs text-black transition cursor-pointer"
                >
                  ইতিহাস দেখুন
                </button>
              </div>

            </div>

            {/* Quick Action Button to Add / Edit Donation Date */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveModal('edit_date')}
                className="flex-1 py-2.5 px-3 border-2 border-black bg-black text-white rounded font-mono font-bold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer"
                id="btn-update-last-donation"
              >
                <Calendar className="w-4 h-4" />
                <span>নতুন রক্তদানের তারিখ যুক্ত করুন (Update Donation Date)</span>
              </button>
            </div>
          </section>
        )}

        {/* =========================================================================
            4. VIEW B (REQUESTER / CUSTOMER VIEW - SAFE EMERGENCY COMMUNICATION)
            - Top-right menu options are hidden
            - Safe communication triggers: WhatsApp emergency messaging, Direct dialer, and Emergency Blood Request form
            ========================================================================= */}
        {!isOwnerView && (
          <section className="bg-white border-2 border-black rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-black" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                  জরুরি যোগাযোগ ও নিরাপদ বার্তা (Emergency Contact)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white font-bold">
                24/7 SUPPORT
              </span>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed font-sans">
              রক্তদাতার ব্যক্তিগত মোবাইল নম্বর সরাসরি নিরাপদ ডায়াল সিস্টেমে সংযুক্ত। অযাচিত ফোন পরিহার করে কেবল প্রকৃত হাসপাতালের রক্ত রিকুইজিশন নিয়ে যোগাযোগ করুন।
            </p>

            {/* Safe Communication Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* WhatsApp Direct Emergency Chat */}
              <button
                type="button"
                onClick={handleWhatsAppEmergency}
                className="py-3 px-4 rounded border-2 border-black bg-white hover:bg-neutral-100 font-mono font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer text-black"
                id="btn-whatsapp-emergency"
              >
                <MessageSquare className="w-4 h-4 text-black" />
                <span>হোয়াটসঅ্যাপে মেসেজ পাঠান (WhatsApp)</span>
              </button>

              {/* Direct Emergency Call Button */}
              <button
                type="button"
                onClick={handleDirectCall}
                className="py-3 px-4 rounded border-2 border-black bg-black text-white hover:bg-neutral-800 font-mono font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                id="btn-emergency-call"
              >
                <PhoneCall className="w-4 h-4" />
                <span>জরুরি সরাসরি কল করুন (Call Donor)</span>
              </button>

            </div>

            {/* In-App Direct Emergency Request Trigger */}
            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-500">অনলাইনে রিকুইজিশন ফর্ম পাঠাতে চান?</span>
              <button
                type="button"
                onClick={() => setActiveModal('emergency_request')}
                className="underline font-bold text-black hover:text-neutral-700 cursor-pointer"
              >
                জরুরি রিকুইজিশন ফর্ম পূরণ করুন →
              </button>
            </div>

          </section>
        )}

        {/* =========================================================================
            5. DONATION HISTORY LOG (Accessible to all for transparency, expandable)
            ========================================================================= */}
        <section className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <History className="w-4 h-4 text-black" />
              <span>রক্তদানের ইতিহাস ও রেকর্ড (Donation Log)</span>
            </h4>
            <span className="text-[10px] font-mono text-neutral-500">
              সর্বমোট {historyList.length} বার
            </span>
          </div>

          <div className="space-y-2.5">
            {historyList.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 border border-neutral-200 rounded bg-[#FBFBFA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-black">{item.location}</span>
                    {item.verified && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 text-black border border-neutral-300">
                        যাচাইকৃত
                      </span>
                    )}
                  </div>
                  {item.recipientNote && (
                    <p className="text-[11px] text-neutral-600 font-sans">{item.recipientNote}</p>
                  )}
                </div>

                <div className="shrink-0 font-mono text-neutral-700 font-bold text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* =========================================================================
          MODALS & OVERLAYS (Owner View Actions & Requester Emergency Form)
          ========================================================================= */}

      {/* A. UPDATE AVAILABILITY STATUS MODAL (VIEW A: Owner View) */}
      {activeModal === 'update_availability' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <ToggleRight className="w-4 h-4 text-black" />
                <h4 className="font-bold text-sm text-black uppercase font-mono">
                  উপলব্ধতা স্ট্যাটাস হালনাগাদ (Update Availability)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              আপনি কি বর্তমানে রক্তদানে প্রস্তুত আছেন? আপনার বর্তমান স্বাস্থ্যগত অবস্থা বা ভ্রমণের কারণে স্ট্যাটাস আপডেট করুন।
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleAvailability(true);
                  setActiveModal('none');
                }}
                className={`p-3 rounded border-2 text-center transition cursor-pointer ${
                  isAvailable
                    ? 'border-black bg-black text-white font-bold'
                    : 'border-neutral-300 hover:border-black bg-white text-black'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-mono block">উপলব্ধ (Available)</span>
                <span className="text-[10px] opacity-75 font-sans">রক্তদানে প্রস্তুত</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleAvailability(false);
                  setActiveModal('none');
                }}
                className={`p-3 rounded border-2 text-center transition cursor-pointer ${
                  !isAvailable
                    ? 'border-black bg-black text-white font-bold'
                    : 'border-neutral-300 hover:border-black bg-white text-black'
                }`}
              >
                <XCircle className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-mono block">অনুপলব্ধ (Not Available)</span>
                <span className="text-[10px] opacity-75 font-sans">সাময়িক বিরতি</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="w-full py-2 bg-neutral-200 text-black text-xs font-mono font-bold rounded hover:bg-neutral-300 transition cursor-pointer mt-2"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* B. DONATION HISTORY MODAL (VIEW A: Owner View) */}
      {activeModal === 'history' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-lg w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-black" />
                <h4 className="font-bold text-sm text-black uppercase font-mono">
                  রক্তদানের সম্পূর্ণ ইতিহাস (Donation History)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* History List in Modal */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {historyList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 border border-neutral-200 rounded bg-[#FBFBFA] space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-black">{item.location}</span>
                    <span className="font-mono text-[10px] text-neutral-500">{item.date}</span>
                  </div>
                  {item.recipientNote && (
                    <p className="text-neutral-700 text-[11px]">{item.recipientNote}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal('edit_date');
                }}
                className="flex-1 py-2 bg-black text-white text-xs font-mono font-bold rounded hover:bg-neutral-800 transition cursor-pointer"
              >
                নতুন রেকর্ড যুক্ত করুন
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="py-2 px-4 bg-neutral-200 text-black text-xs font-mono font-bold rounded hover:bg-neutral-300 transition cursor-pointer"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. EDIT LAST DONATION DATE MODAL (VIEW A: Owner View) */}
      {activeModal === 'edit_date' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black" />
                <h4 className="font-bold text-sm text-black uppercase font-mono">
                  সর্বশেষ রক্তদানের তারিখ হালনাগাদ
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDonationDate} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  রক্তদানের তারিখ *
                </label>
                <input
                  type="date"
                  value={newDonationDate}
                  onChange={(e) => setNewDonationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded font-mono font-bold text-black focus:ring-1 focus:ring-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  হাসপাতাল / রক্তদান ক্যাম্পের নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রাঙামাটি জেনারেল হাসপাতাল"
                  value={newDonationLocation}
                  onChange={(e) => setNewDonationLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-black focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  সংক্ষিপ্ত বিবরণ / রোগীর তথ্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সার্জারি ইউনিটের জরুরি রক্তদান"
                  value={newDonationNote}
                  onChange={(e) => setNewDonationNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-black focus:border-black focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2 bg-neutral-200 text-black text-xs font-mono font-bold rounded hover:bg-neutral-300 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black text-white text-xs font-mono font-bold rounded hover:bg-neutral-800 transition cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. NOTIFICATIONS MODAL (VIEW A: Owner View) */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-black" />
                <h4 className="font-bold text-sm text-black uppercase font-mono">
                  জরুরি নোটিফিকেশন ও ব্লাড অ্যালার্ট
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 border-2 border-black rounded bg-[#FBFBFA] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold font-mono text-black">জরুরি {donor.bloodGroup} রক্ত প্রয়োজন!</span>
                  <span className="text-[10px] text-neutral-500 font-mono">১০ মিনিট আগে</span>
                </div>
                <p className="text-neutral-700 text-[11px]">
                  হাসপাতাল: রাঙামাটি সদর হাসপাতাল। প্রসূতি ইউনিটের রোগীর জন্য ১ ব্যাগ রক্ত অতি জরুরি।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    showToast('আপনি অনুরোধে সাড়া দিয়েছেন। রোগীর অভিভাবকের সাথে যোগাযোগ করিয়ে দেওয়া হচ্ছে।');
                    setActiveModal('none');
                  }}
                  className="mt-1 px-3 py-1 bg-black text-white rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-neutral-800"
                >
                  সাড়া দিন (Accept)
                </button>
              </div>

              <div className="p-3 border border-neutral-300 rounded bg-[#FBFBFA] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold font-mono text-neutral-800">রক্তদান যোগ্যতা অর্জন নোটিশ</span>
                  <span className="text-[10px] text-neutral-500 font-mono">গতকাল</span>
                </div>
                <p className="text-neutral-600 text-[11px]">
                  আপনার সর্বশেষ রক্তদানের পর ৯০ দিন অতিক্রান্ত হয়েছে। আপনি এখন সম্পূর্ণ সুস্থ থাকলে রক্তদান করতে পারেন।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="w-full py-2 bg-neutral-200 text-black text-xs font-mono font-bold rounded hover:bg-neutral-300 transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* E. MESSAGING MODAL (VIEW A: Owner View) */}
      {activeModal === 'messages' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-black" />
                <h4 className="font-bold text-sm text-black uppercase font-mono">
                  ইনবক্স ও জরুরি ইনকোয়ারি
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 border border-neutral-300 rounded bg-[#FBFBFA] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black font-mono">সুমন চাকমা (হাসপাতাল স্বজন)</span>
                  <span className="text-[10px] text-neutral-500 font-mono">আজ দুপুর ২:১০</span>
                </div>
                <p className="text-neutral-700 text-[11px]">
                  "ভাইয়া, আপনার রক্তদানের স্ট্যাটাসটি উপলব্ধ দেখতে পাচ্ছি। আগামীকাল সকালে রাঙামাটিতে রক্ত দিতে পারবেন কি?"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://wa.me/8801870592699?text=${encodeURIComponent('আসসালামু আলাইকুম। আপনার মেসেজ পেয়েছি।')}`;
                    window.open(url, '_blank');
                  }}
                  className="mt-1 px-3 py-1 bg-black text-white rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-neutral-800"
                >
                  উত্তর দিন (Reply)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="w-full py-2 bg-neutral-200 text-black text-xs font-mono font-bold rounded hover:bg-neutral-300 transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* F. EMERGENCY REQUISITION FORM (VIEW B: Requester View) */}
      {activeModal === 'emergency_request' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-black" />
                <h4 className="font-bold text-sm text-black uppercase font-mono">
                  জরুরি রক্তের রিকুইজিশন পাঠান
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-neutral-300 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEmergencyRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  রোগীর নাম *
                </label>
                <input
                  type="text"
                  placeholder="রোগীর পূর্ণ নাম"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-black focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  হাসপাতাল ও ওয়ার্ডের ঠিকানা *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রাঙামাটি সদর হাসপাতাল, ৩য় তলা"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-black focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                    প্রয়োজনীয় ব্যাগ
                  </label>
                  <select
                    value={bagsNeeded}
                    onChange={(e) => setBagsNeeded(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-black focus:border-black focus:outline-none font-mono"
                  >
                    <option value="1">১ ব্যাগ</option>
                    <option value="2">২ ব্যাগ</option>
                    <option value="3">৩+ ব্যাগ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                    রক্তের গ্রুপ
                  </label>
                  <input
                    type="text"
                    value={donor.bloodGroup}
                    disabled
                    className="w-full px-3 py-2 border border-neutral-300 bg-neutral-100 rounded text-black font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  জরুরি বার্তা বা যোগাযোগের নম্বর *
                </label>
                <textarea
                  rows={2}
                  placeholder="আপনার ফোন নম্বর এবং জরুরি প্রেক্ষাপট লিখুন..."
                  value={urgencyNote}
                  onChange={(e) => setUrgencyNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-black focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2 bg-neutral-200 text-black text-xs font-mono font-bold rounded hover:bg-neutral-300 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black text-white text-xs font-mono font-bold rounded hover:bg-neutral-800 transition cursor-pointer"
                >
                  রিকুইজিশন পাঠান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: Contact Donor Options Modal (Direct Call, WhatsApp, Requisition) */}
      {activeModal === 'contact_donor' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal('none')}
          id="modal-contact-donor-overlay"
        >
          <div
            className="bg-white border-2 border-black rounded-xl p-5 sm:p-6 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-150 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            id="modal-contact-donor-card"
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black">রক্তদাতার সাথে যোগাযোগ</h3>
                  <p className="text-[10px] text-gray-600">গ্রুপ: <span className="font-bold text-rose-700">{donor.bloodGroup}</span> • {donor.district}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center cursor-pointer text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Direct Phone Call */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('none');
                  handleDirectCall();
                }}
                className="w-full p-3 rounded-xl border-2 border-rose-600 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                id="contact-option-call"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-rose-600" />
                  <span className="font-bold">সরাসরি ফোন কল করুন</span>
                </div>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full border border-rose-300 text-rose-700 font-bold">
                  {donor.phone || '018...'}
                </span>
              </button>

              {/* Option 2: WhatsApp Emergency */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('none');
                  handleWhatsAppEmergency();
                }}
                className="w-full p-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                id="contact-option-whatsapp"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">হোয়াটসঅ্যাপে জরুরি বার্তা</span>
                </div>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-700 font-bold">
                  WhatsApp
                </span>
              </button>

              {/* Option 3: Fill Emergency Form */}
              <button
                type="button"
                onClick={() => {
                  setActiveModal('emergency_request');
                }}
                className="w-full p-3 rounded-xl border-2 border-gray-800 bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                id="contact-option-form"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-gray-800" />
                  <span className="font-bold">অনলাইন রিকুইজিশন ফর্ম পূরণ</span>
                </div>
                <span className="text-[10px] font-mono text-gray-600">
                  হাসপাতাল তথ্য
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-gray-200 text-center">
              <p className="text-[10px] text-gray-500 font-medium">
                রক্তদান সম্পূর্ণ মানবিক ও বিনামূল্যে। অযথা কল করা থেকে বিরত থাকুন।
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BloodDonorProfile;
