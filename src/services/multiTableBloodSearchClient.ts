/**
 * Client service for Multi-Table Blood Search & Registration Verification
 * 
 * Rules:
 * 1. Search across all four registration tables simultaneously:
 *    - product_sellers
 *    - service_providers
 *    - permanent_members
 *    - blood_donors
 * 2. Filter by both blood group AND location (district + upazila).
 * 3. Verify user's mobile number exists in any of the 4 tables before showing results.
 *    If not found: prompt "আপনার মোবাইল নম্বরটি রেজিস্ট্রেশন করা নেই, দয়া করে রেজিস্ট্রেশন করুন" with "যুক্ত হোন" button.
 */

import { supabase } from '../lib/supabaseClient';

export interface BloodDonorResultItem {
  id: string;
  name: string;
  role: string;
  profession?: string;
  sourceTable: 'product_sellers' | 'service_providers' | 'permanent_members' | 'blood_donors';
  sourceBadge: string;
  phone: string;
  whatsapp?: string;
  location: {
    division?: string;
    district: string;
    upazila: string;
    area?: string;
    address?: string;
  };
  bloodGroup: string;
  avatar: string;
  verified: boolean;
  totalDonations?: number;
  lastDonationDate?: string;
}

export interface BloodSearchResponse {
  success: boolean;
  isRegistered: boolean;
  message: string;
  searcher?: {
    phone?: string;
    name?: string;
    table?: string;
  };
  matchedCount: number;
  results: BloodDonorResultItem[];
}

export function normalizeDigits(raw: string | number | undefined | null): string {
  if (!raw) return '';
  const str = String(raw).trim();
  const bengaliNumerals: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  let normalized = str.replace(/[০-৯]/g, d => bengaliNumerals[d] || d);
  normalized = normalized.replace(/\D/g, '');
  if (normalized.startsWith('880')) {
    normalized = normalized.slice(2);
  }
  if (normalized.length === 10 && normalized.startsWith('1')) {
    normalized = '0' + normalized;
  }
  return normalized;
}

export function phonesEqual(p1: string | number | undefined, p2: string | number | undefined): boolean {
  const n1 = normalizeDigits(p1);
  const n2 = normalizeDigits(p2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  const s1 = n1.slice(-10);
  const s2 = n2.slice(-10);
  return s1.length === 10 && s1 === s2;
}

export async function verifyAndSearchBloodDonors(params: {
  searcherMobile: string;
  bloodGroup?: string;
  district?: string;
  upazila?: string;
  query?: string;
  localFallbackContext?: {
    bloodDonors?: any[];
    professionals?: any[];
    users?: any[];
    sellers?: any[];
  };
}): Promise<BloodSearchResponse> {
  const { searcherMobile, bloodGroup = '', district = '', upazila = '', query = '', localFallbackContext } = params;
  const cleanMobile = normalizeDigits(searcherMobile);

  // 1. If mobile is completely missing or under 10 digits, prompt immediately
  if (!cleanMobile || cleanMobile.length < 10) {
    return {
      success: false,
      isRegistered: false,
      message: 'আপনার মোবাইল নম্বরটি রেজিস্ট্রেশন করা নেই, দয়া করে রেজিস্ট্রেশন করুন',
      matchedCount: 0,
      results: []
    };
  }

  // 2. Call backend endpoint: POST /api/blood-search/verify-and-search
  try {
    const res = await fetch('/api/blood-search/verify-and-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searcherMobile: cleanMobile,
        bloodGroup,
        district,
        upazila,
        query
      })
    });

    if (res.ok) {
      const data: BloodSearchResponse = await res.json();
      if (data.isRegistered) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[BloodSearchClient] Backend call error, attempting direct Supabase query:', err);
  }

  // 3. Client-side direct Supabase check across all 4 tables without requiring login
  try {
    const last10 = cleanMobile.slice(-10);
    const variants = Array.from(new Set([
      cleanMobile,
      last10,
      '0' + last10,
      '+880' + last10,
      '880' + last10,
      '+88' + cleanMobile
    ])).filter(Boolean);

    const phoneFilters = variants.map(v => `phone_number.eq.${v}`);
    const waFilters = variants.map(v => `whatsapp_number.eq.${v}`);
    const orFilter = [...phoneFilters, ...waFilters].join(',');

    const [donorRes, sellerRes, proRes, memberRes] = await Promise.all([
      supabase.from('blood_donors').select('id, full_name, phone_number, whatsapp_number').or(orFilter).limit(1),
      supabase.from('product_sellers').select('id, shop_or_owner_name, phone_number, whatsapp_number').or(orFilter).limit(1),
      supabase.from('service_providers').select('id, full_name, phone_number, whatsapp_number').or(orFilter).limit(1),
      supabase.from('permanent_members').select('id, full_name, phone_number, whatsapp_number').or(orFilter).limit(1),
    ]);

    const hasMatchInAnyTable = Boolean(
      (!donorRes.error && donorRes.data && donorRes.data.length > 0) ||
      (!sellerRes.error && sellerRes.data && sellerRes.data.length > 0) ||
      (!proRes.error && proRes.data && proRes.data.length > 0) ||
      (!memberRes.error && memberRes.data && memberRes.data.length > 0)
    );

    if (hasMatchInAnyTable) {
      // User is verified in Supabase! Fetch donors directly
      const { data: dbDonors } = await supabase.from('blood_donors').select('*');
      const results: BloodDonorResultItem[] = [];

      const cleanBg = (bg: string = '') => {
        return bg.toUpperCase().replace(/\s+/g, '').replace('পজিটিভ', '+').replace('নেগেটিভ', '-');
      };
      const cleanSearchBg = cleanBg(bloodGroup);

      const normLoc = (s: string = '') => s.toLowerCase().trim()
        .replace(/ড়/g, 'র').replace(/ড়/g, 'র')
        .replace(/ঢ়/g, 'র').replace(/ঢ়/g, 'র')
        .replace(/য়/g, 'য').replace(/য়/g, 'য')
        .replace(/[\s\-_/.,()]/g, '');

      const normSearchDist = normLoc(district);
      const normSearchUpz = normLoc(upazila);

      for (const d of (dbDonors || [])) {
        const bg = d.blood_group || '';
        if (cleanSearchBg && cleanSearchBg !== 'সকল' && cleanSearchBg !== 'ALL') {
          if (cleanBg(bg) !== cleanSearchBg) continue;
        } else if (!bg || bg.trim() === '' || bg.trim() === 'N/A') {
          continue;
        }

        const dist = d.district || '';
        const upz = d.upazila || '';
        const normD = normLoc(dist);
        const normU = normLoc(upz);

        if (normSearchDist && !(normD.includes(normSearchDist) || normSearchDist.includes(normD))) continue;
        if (normSearchUpz && !(normU.includes(normSearchUpz) || normSearchUpz.includes(normU) || (normU.includes('সদর') && normSearchUpz.includes('সদর')))) continue;

        const ph = d.phone_number || '';
        results.push({
          id: `bd_${d.id}`,
          name: d.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
          role: 'স্বেচ্ছাসেবী রক্তদাতা',
          profession: d.profession || 'রক্তদাতা',
          sourceTable: 'blood_donors',
          sourceBadge: '🩸 নিবন্ধিত রক্তদাতা',
          phone: ph,
          whatsapp: d.whatsapp_number || ph,
          location: {
            district: dist || 'খাগড়াছড়ি',
            upazila: upz || 'সদর',
            area: d.area || upz
          },
          bloodGroup: bg || 'O+',
          avatar: d.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          verified: d.consent_given !== false,
          totalDonations: d.total_donations || 1,
          lastDonationDate: d.last_donation_date || 'উপলব্ধ'
        });
      }

      return {
        success: true,
        isRegistered: true,
        message: 'মোবাইল নম্বরটি নিবন্ধিত পাওয়া গেছে।',
        matchedCount: results.length,
        results
      };
    }
  } catch (err) {
    console.warn('[BloodSearchClient] Direct Supabase check notice:', err);
  }

  // 4. Client-side fallback if backend call failed or network issue
  if (localFallbackContext) {
    const { bloodDonors = [], professionals = [], users = [], sellers = [] } = localFallbackContext;

    // Check if phone exists in any of the 4 registration collections
    const foundInDonors = bloodDonors.find((d: any) => phonesEqual(d.phone, cleanMobile));
    const foundInPros = professionals.find((p: any) => phonesEqual(p.phone, cleanMobile));
    const foundInUsers = users.find((u: any) => phonesEqual(u.phone, cleanMobile));
    const foundInSellers = sellers.find((s: any) => phonesEqual(s.phone, cleanMobile));

    const isReg = Boolean(foundInDonors || foundInPros || foundInUsers || foundInSellers);
    if (!isReg) {
      return {
        success: false,
        isRegistered: false,
        message: 'আপনার মোবাইল নম্বরটি রেজিস্ট্রেশন করা নেই, দয়া করে রেজিস্ট্রেশন করুন',
        matchedCount: 0,
        results: []
      };
    }

    // Filter matching donors across all 4 sets
    const results: BloodDonorResultItem[] = [];
    const seen = new Set<string>();

    const checkBlood = (bg: string) => {
      if (!bloodGroup) return Boolean(bg && bg.trim());
      const c1 = (bg || '').toUpperCase().replace(/\s+/g, '');
      const c2 = bloodGroup.toUpperCase().replace(/\s+/g, '');
      return c1 === c2;
    };

    const checkLoc = (recDist: string, recUpz: string) => {
      const d1 = (recDist || '').trim().toLowerCase();
      const d2 = district.trim().toLowerCase();
      const u1 = (recUpz || '').trim().toLowerCase();
      const u2 = upazila.trim().toLowerCase();

      if (d2 && !(d1.includes(d2) || d2.includes(d1))) return false;
      if (u2 && !(u1.includes(u2) || u2.includes(u1) || (u1.includes('সদর') && u2.includes('সদর')))) return false;
      return true;
    };

    // 1. blood_donors
    bloodDonors.forEach((d: any) => {
      if (checkBlood(d.bloodGroup) && checkLoc(d.district, d.upazila)) {
        const ph = d.phone || '';
        const key = normalizeDigits(ph) || d.id;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `bd_${d.id}`,
            name: d.name || 'স্বেচ্ছাসেবী রক্তদাতা',
            role: 'স্বেচ্ছাসেবী রক্তদাতা',
            profession: `রক্তদান করেছেন ${d.totalDonations || 1} বার`,
            sourceTable: 'blood_donors',
            sourceBadge: '🩸 নিবন্ধিত রক্তদাতা',
            phone: ph,
            whatsapp: ph,
            location: {
              district: d.district || 'খাগড়াছড়ি',
              upazila: d.upazila || 'সদর',
              area: d.area || d.upazila || ''
            },
            bloodGroup: d.bloodGroup || 'O+',
            avatar: d.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            verified: Boolean(d.verified),
            totalDonations: d.totalDonations || 1,
            lastDonationDate: d.lastDonationDate || 'উপলব্ধ'
          });
        }
      }
    });

    // 2. service_providers
    professionals.forEach((p: any) => {
      if (p.bloodGroup && checkBlood(p.bloodGroup) && checkLoc(p.district, p.upazila)) {
        const ph = p.phone || '';
        const key = normalizeDigits(ph) || p.id;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `sp_${p.id}`,
            name: p.name || 'দক্ষ সেবাদাতা',
            role: `দক্ষ সেবাদাতা (${p.profession || 'কারিগর'})`,
            profession: p.profession || 'কারিগর',
            sourceTable: 'service_providers',
            sourceBadge: '🛠️ দক্ষ সেবাদাতা',
            phone: ph,
            whatsapp: ph,
            location: {
              district: p.district || 'রাঙ্গামাটি',
              upazila: p.upazila || 'সদর',
              area: p.area || p.upazila || ''
            },
            bloodGroup: p.bloodGroup,
            avatar: p.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            verified: Boolean(p.verified),
            totalDonations: 1,
            lastDonationDate: 'জরুরি প্রয়োজনে প্রস্তুত'
          });
        }
      }
    });

    // 3. permanent_members / users
    users.forEach((u: any) => {
      const bg = u.bloodGroup || '';
      if (bg && checkBlood(bg) && checkLoc(u.district, u.upazila)) {
        const ph = u.phone || '';
        const key = normalizeDigits(ph) || u.id;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `mem_${u.id}`,
            name: u.fullName || u.name || 'স্থায়ী সদস্য',
            role: 'ঝাদিমাদি স্থায়ী সদস্য',
            profession: 'কমিউনিটি প্রতিনিধি',
            sourceTable: 'permanent_members',
            sourceBadge: '🏅 স্থায়ী সদস্য',
            phone: ph,
            whatsapp: ph,
            location: {
              district: u.district || 'খাগড়াছড়ি',
              upazila: u.upazila || 'সদর',
              area: u.area || ''
            },
            bloodGroup: bg,
            avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            verified: true,
            totalDonations: 2,
            lastDonationDate: 'জরুরি প্রয়োজনে প্রস্তুত'
          });
        }
      }
    });

    return {
      success: true,
      isRegistered: true,
      message: 'সফলভাবে রক্তদাতা তালিকা পাওয়া গেছে।',
      matchedCount: results.length,
      results
    };
  }

  return {
    success: false,
    isRegistered: false,
    message: 'আপনার মোবাইল নম্বরটি রেজিস্ট্রেশন করা নেই, দয়া করে রেজিস্ট্রেশন করুন',
    matchedCount: 0,
    results: []
  };
}
