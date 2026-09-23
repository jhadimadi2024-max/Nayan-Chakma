# Jhadimadi.com Admin Dashboard Refactor

এই সংস্করণে মূল Admin Dashboard-কে Business Operations Dashboard হিসেবে গুছানো হয়েছে।

## যা রাখা হয়েছে
- বাস্তব database-backed customer orders
- Product management ও product posting
- Banner/advertisement management
- Payment & transaction management
- Seller / Service Provider / Permanent Member approval workflow
- Jhadimadi AI business assistant
- Reports
- System settings / admin security

## Dashboard থেকে সরানো হয়েছে
- Blood donor / blood group KPI ও navigation
- Job registration / job seeker dashboard items
- Live visitor KPI থেকে মূল dashboard-এর জায়গা
- Supabase raw database menu থেকে
- Demo/fake vendor approval records
- Demo/fake finance transaction records
- Demo/fake AI live activity/search events
- Demo/fake vector knowledge cards

## নতুন Overview
- মোট অর্ডার
- চলমান অর্ডার
- মোট বিক্রয়
- মোট পণ্য
- পণ্য বিক্রেতা
- সেবা বিক্রেতা
- বাস্তব pending action center
- পণ্যভিত্তিক order demand summary
- Seller / Service Provider / Permanent Member approval summary
- বাস্তব ডাটা না থাকলে স্পষ্ট empty state; কোনো কৃত্রিম সংখ্যা নয়

## গুরুত্বপূর্ণ
এই refactor UI/dashboard layer-এ করা হয়েছে। বিদ্যমান Product, Banner, Payment এবং Approval feature-এর মূল implementation মুছে ফেলা হয়নি। Blood/Job feature customer app বা backend থেকে মুছে দেওয়া হয়নি; শুধু Admin Dashboard-এর operational navigation/overview থেকে বাদ দেওয়া হয়েছে।

## Validation
পূর্ণ `npm ci` পরিবেশে dependencies install করা সম্ভব হয়নি, তাই সম্পূর্ণ production build এখানে চালানো যায়নি। TypeScript parser-level checking-এ পরিবর্তিত ফাইলগুলোতে নতুন application-specific error পাওয়া যায়নি; environment-এর missing npm dependencies-এর error ছিল।
