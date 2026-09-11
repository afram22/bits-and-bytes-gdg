/**
 * KaamSetu - Frontend Core Application Logic & Mock Store
 * Designed for hackathon demonstration with real-time UI interactivity.
 */

// Initial Seed Data for Demo
const SEED_JOBS = [
  {
    id: "job-101",
    title: "Expert Mason / Rajmistri Needed for Boundary Wall",
    category: "Masonry",
    workersNeeded: 3,
    dailyWage: 850,
    duration: "4 Days",
    startDate: "Tomorrow, 8:00 AM",
    location: "Sector 62, Noida, UP",
    contractorName: "Apex Infrastructure Ltd.",
    contractorContact: "+91 98765 43210",
    description: "Urgent requirement for 3 skilled masons to construct a 6-foot brick boundary wall with plastering. Tools and materials supplied on site.",
    requirements: ["Minimum 3 years experience in brickwork", "Must bring own trowel/measuring tape", "Punctual and reliable"],
    urgent: true,
    postedAt: "2 hours ago"
  },
  {
    id: "job-102",
    title: "Interior Wall Painting & Priming",
    category: "Painting",
    workersNeeded: 2,
    dailyWage: 750,
    duration: "3 Days",
    startDate: "Monday, 9:00 AM",
    location: "Indiranagar, Bengaluru, KA",
    contractorName: "Creative Living Interiors",
    contractorContact: "+91 98111 22334",
    description: "Looking for 2 painters for 3BHK flat interior emulsion coating, putty finishing, and ceiling priming.",
    requirements: ["Knowledge of roller & brush application", "Surface sanding experience", "Clean workmanship"],
    urgent: false,
    postedAt: "5 hours ago"
  },
  {
    id: "job-103",
    title: "Plumbing Pipe Laying & Fitting",
    category: "Plumbing",
    workersNeeded: 1,
    dailyWage: 900,
    duration: "2 Days",
    startDate: "Immediate",
    location: "Andheri East, Mumbai, MH",
    contractorName: "Metro BuildTech",
    contractorContact: "+91 99222 33445",
    description: "Commercial building restroom pipeline repair and CPVC pipe joint fitting. Experienced plumber required.",
    requirements: ["CPVC / PVC pipe welding & jointing", "Pressure testing understanding", "Own pipe wrench"],
    urgent: true,
    postedAt: "1 day ago"
  },
  {
    id: "job-104",
    title: "Furniture Assembly & Wood Framing",
    category: "Carpentry",
    workersNeeded: 2,
    dailyWage: 800,
    duration: "5 Days",
    startDate: "Wednesday, 8:30 AM",
    location: "Gachibowli, Hyderabad, TS",
    contractorName: "Vikram Sharma Constructions",
    contractorContact: "+91 97333 44556",
    description: "Office cabin partition framing and wooden desk modular assembly. Need 2 skilled carpenters.",
    requirements: ["Measurement accuracy", "Familiarity with power saw and drills", "Blueprint reading is a plus"],
    urgent: false,
    postedAt: "1 day ago"
  },
  {
    id: "job-105",
    title: "Building Electrical Conduit & Wiring Helper",
    category: "Electrical",
    workersNeeded: 4,
    dailyWage: 700,
    duration: "6 Days",
    startDate: "Next Friday",
    location: "Kothrud, Pune, MH",
    contractorName: "Spark Line Electricals",
    contractorContact: "+91 96444 55667",
    description: "Laying electrical conduits into newly cast slabs and pulling cables. Experienced electrician or skilled helper required.",
    requirements: ["Safety gear compliance", "Cable routing basics", "Physical stamina"],
    urgent: false,
    postedAt: "2 days ago"
  }
];

const SEED_APPLICATIONS = [
  {
    id: "app-1",
    jobId: "job-101",
    jobTitle: "Expert Mason / Rajmistri Needed for Boundary Wall",
    contractorName: "Apex Infrastructure Ltd.",
    wage: 850,
    location: "Sector 62, Noida, UP",
    status: "Accepted",
    appliedDate: "Today, 10:15 AM",
    workerName: "Ramesh Kumar",
    workerTrade: "Masonry (Rajmistri)",
    workerPhone: "+91 98760 12345",
    rating: "4.8"
  },
  {
    id: "app-2",
    jobId: "job-104",
    jobTitle: "Furniture Assembly & Wood Framing",
    contractorName: "Vikram Sharma Constructions",
    wage: 800,
    location: "Gachibowli, Hyderabad, TS",
    status: "Pending Review",
    appliedDate: "Yesterday, 3:30 PM",
    workerName: "Ramesh Kumar",
    workerTrade: "Masonry (Rajmistri)",
    workerPhone: "+91 98760 12345",
    rating: "4.8"
  }
];

// Initialize Storage
function initStorage() {
  if (!localStorage.getItem("kaamsetu_jobs")) {
    localStorage.setItem("kaamsetu_jobs", JSON.stringify(SEED_JOBS));
  }
  if (!localStorage.getItem("kaamsetu_applications")) {
    localStorage.setItem("kaamsetu_applications", JSON.stringify(SEED_APPLICATIONS));
  }
}

// Data Access
function getJobs() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem("kaamsetu_jobs")) || SEED_JOBS;
  } catch (e) {
    return SEED_JOBS;
  }
}

function getJobById(id) {
  const jobs = getJobs();
  return jobs.find(j => j.id === id) || jobs[0];
}

function saveJob(newJob) {
  const jobs = getJobs();
  jobs.unshift(newJob);
  localStorage.setItem("kaamsetu_jobs", JSON.stringify(jobs));
}

function getApplications() {
  initStorage();
  try {
    return JSON.parse(localStorage.getItem("kaamsetu_applications")) || SEED_APPLICATIONS;
  } catch (e) {
    return SEED_APPLICATIONS;
  }
}

function applyForJob(jobId, workerInfo = {}) {
  const job = getJobById(jobId);
  const apps = getApplications();
  
  // Check if already applied
  const existing = apps.find(a => a.jobId === jobId);
  if (existing) {
    return { success: false, message: "You have already applied for this job." };
  }

  const newApp = {
    id: "app-" + Date.now(),
    jobId: job.id,
    jobTitle: job.title,
    contractorName: job.contractorName,
    wage: job.dailyWage,
    location: job.location,
    status: "Pending Review",
    appliedDate: "Just now",
    workerName: workerInfo.name || "Ramesh Kumar",
    workerTrade: workerInfo.trade || "Skilled Craftsman",
    workerPhone: workerInfo.phone || "+91 98760 12345",
    rating: "4.8"
  };

  apps.unshift(newApp);
  localStorage.setItem("kaamsetu_applications", JSON.stringify(apps));
  return { success: true, message: "Application submitted successfully! Contractor has been notified." };
}

// User Session Management
function getCurrentUser() {
  const user = localStorage.getItem("kaamsetu_user");
  if (user) {
    try { return JSON.parse(user); } catch (e) {}
  }
  return { role: "worker", name: "Ramesh Kumar", trade: "Masonry", phone: "+91 98760 12345" };
}

function setCurrentUser(role, name, details = {}) {
  const user = { role, name, ...details };
  localStorage.setItem("kaamsetu_user", JSON.stringify(user));
}

// Quick Demo Login (Judges Helper)
function demoLogin(role) {
  if (role === "worker") {
    setCurrentUser("worker", "Ramesh Kumar", { trade: "Masonry (Rajmistri)", rate: 850 });
    window.location.href = "worker-dashboard.html";
  } else {
    setCurrentUser("contractor", "Vikram Sharma", { company: "Apex Infrastructure Ltd." });
    window.location.href = "contractor-dashboard.html";
  }
}

// UI Helpers: Mobile Menu
function initMobileMenu() {
  const hamburger = document.getElementById("hamburgerBtn");
  const navMenu = document.getElementById("navMenu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }
}

// Notification Banner Helper
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `alert alert-${type}`;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.zIndex = "9999";
  toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
  toast.style.maxWidth = "350px";
  toast.innerHTML = `<strong>${type === "success" ? "✓" : "ℹ"}</strong> ${message}`;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Internationalization (i18n) Translations Engine
const TRANSLATIONS = {
  en: {
    nav_home: "Home",
    nav_find_jobs: "Find Jobs",
    nav_my_profile: "My Profile",
    nav_company_profile: "Company Profile",
    nav_my_jobs: "My Jobs",
    nav_post_job: "Post a Job",
    nav_logout: "Logout",
    nav_sign_out: "Sign Out",
    nav_switch_contractor: "Switch to Contractor View",
    nav_switch_worker: "Switch to Worker View",
    available_today: "🟢 Available for Work Today",
    status_ready: "Status: Ready for Work",
    status_busy: "Status: Busy / Off Duty",
    view_full_profile: "View Full Profile",
    active_applications: "Active Applications",
    hired_work: "Confirmed / Hired Work",
    earnings_month: "Earnings This Month",
    contractor_satisfaction: "Contractor Satisfaction",
    available_jobs_tab: "Available Daily Jobs",
    my_apps_tab: "My Applications",
    filter_trade_label: "Skill / Trade",
    filter_wage_label: "Minimum Daily Wage",
    filter_location_label: "Location Keyword",
    clear_filters: "Clear Filters",
    all_trades: "All Trades",
    instant_apply: "⚡ Instant Apply",
    view_site_details: "View Site Details",
    daily_expected_wage: "Daily Expected Wage",
    direct_call: "📞 Direct Call",
    save_contact: "💾 Save",
    ready_to_hire: "Ready to Hire",
    post_new_job: "➕ Post New Job",
    per_day: "per day",
    namaste: "Namaste",
    hero_badge: "✨ India's Daily Wage Marketplace",
    hero_heading: "Direct Connection between Workers & Contractors",
    hero_sub: "Empowering daily-wage skilled artisans with direct job matching, fair wages, and instant digital payments. Zero middleman fees.",
    btn_find_work: "👷 Find Daily Work",
    btn_post_req: "🏗️ Post Work Requirement",
    stat_workers: "Active Skilled Workers",
    stat_contractors: "Verified Contractors",
    stat_payouts: "Daily Same-Day Payouts",
    section_why: "Why Choose KaamSetu?",
    feature_1_title: "⚡ Direct Job Matching",
    feature_1_desc: "No middlemen or labor mandis. Connect directly with verified site contractors.",
    feature_2_title: "💰 Guaranteed Wage Rate",
    feature_2_desc: "Transparent daily rates fixed beforehand. No surprise wage deductions.",
    feature_3_title: "📲 Instant UPI Settlements",
    feature_3_desc: "Receive your hard-earned daily wages directly to your bank account via UPI upon job completion.",
    feature_4_title: "⭐ Verified Profiles & Ratings",
    feature_4_desc: "Build your reputation with contractor ratings, skill badges, and Aadhaar verification.",
    login_title: "Sign In to KaamSetu",
    login_sub: "Select your profile type to access your dashboard",
    role_worker: "👷 Worker / Karigar",
    role_contractor: "🏗️ Contractor / Builder",
    phone_label: "Mobile Number",
    phone_ph: "e.g. 9876543210",
    password_label: "Password / PIN",
    password_ph: "Enter your secret password or PIN",
    btn_login: "Sign In to Account",
    no_account: "Don't have an account?",
    register_here: "Register here"
  },
  hi: {
    nav_home: "होम",
    nav_find_jobs: "काम खोजें",
    nav_my_profile: "मेरी प्रोफाइल",
    nav_company_profile: "कंपनी प्रोफाइल",
    nav_my_jobs: "मेरे काम",
    nav_post_job: "काम पोस्ट करें",
    nav_logout: "लॉग आउट",
    nav_sign_out: "लॉग आउट",
    nav_switch_contractor: "ठेकेदार पोर्टल",
    nav_switch_worker: "कारीगर पोर्टल",
    available_today: "🟢 आज काम के लिए उपलब्ध",
    status_ready: "स्थिति: काम के लिए तैयार",
    status_busy: "स्थिति: व्यस्त / छुट्टी पर",
    view_full_profile: "पूरी प्रोफाइल देखें",
    active_applications: "सक्रिय आवेदन",
    hired_work: "स्वीकृत काम",
    earnings_month: "इस महीने की कमाई",
    contractor_satisfaction: "ठेकेदार रेटिंग",
    available_jobs_tab: "उपलब्ध दैनिक काम",
    my_apps_tab: "मेरे आवेदन",
    filter_trade_label: "कौशल / व्यापार",
    filter_wage_label: "न्यूनतम दैनिक मजदूरी",
    filter_location_label: "स्थान खोजें",
    clear_filters: "फ़िल्टर साफ़ करें",
    all_trades: "सभी कौशल",
    instant_apply: "⚡ तुरंत आवेदन करें",
    view_site_details: "साइट विवरण देखें",
    daily_expected_wage: "दैनिक अपेक्षित मजदूरी",
    direct_call: "📞 सीधा कॉल करें",
    save_contact: "💾 सहेजें",
    ready_to_hire: "काम पर रखने के लिए तैयार",
    post_new_job: "➕ नया काम पोस्ट करें",
    per_day: "प्रति दिन",
    namaste: "नमस्ते",
    hero_badge: "✨ भारत का अपना दैनिक रोज़गार मंच",
    hero_heading: "कारीगरों और ठेकेदारों का सीधा जोड़",
    hero_sub: "दैनिक वेतनभोगी मजदूरों को सीधे काम, उचित मजदूरी और तुरंत डिजिटल भुगतान। कोई बिचौलिया शुल्क नहीं।",
    btn_find_work: "👷 दैनिक काम खोजें",
    btn_post_req: "🏗️ काम की आवश्यकता पोस्ट करें",
    stat_workers: "सक्रिय कुशल कारीगर",
    stat_contractors: "सत्यापित ठेकेदार",
    stat_payouts: "दैनिक तुरंत भुगतान",
    section_why: "कामसेतु ही क्यों चुनें?",
    feature_1_title: "⚡ सीधा काम कनेक्शन",
    feature_1_desc: "बिचौलियों और लेबर मंडी का झंझट ख़त्म। सीधे सत्यापित ठेकेदारों से जुड़ें।",
    feature_2_title: "💰 गारंटीकृत मजदूरी दर",
    feature_2_desc: "पहले से तय पारदर्शी दैनिक मजदूरी। बिना किसी कटौती के पूरा भुगतान।",
    feature_3_title: "📲 तुरंत यूपीआई भुगतान",
    feature_3_desc: "काम पूरा होते ही अपनी मेहनत की कमाई सीधे बैंक खाते में यूपीआई से प्राप्त करें।",
    feature_4_title: "⭐ सत्यापित प्रोफाइल और रेटिंग",
    feature_4_desc: "ठेकेदार रेटिंग्स, कौशल बैज और आधार सत्यापन के साथ अपनी साख बनाएं।",
    login_title: "कामसेतु में लॉग इन करें",
    login_sub: "अपने डैशबोर्ड में प्रवेश के लिए अपनी भूमिका चुनें",
    role_worker: "👷 कारीगर / मजदूर",
    role_contractor: "🏗️ ठेकेदार / बिल्डर",
    phone_label: "मोबाइल नंबर",
    phone_ph: "उदा. 9876543210",
    password_label: "पासवर्ड / पिन",
    password_ph: "अपना गुप्त पासवर्ड या पिन दर्ज करें",
    btn_login: "खाते में प्रवेश करें",
    no_account: "खाता नहीं है?",
    register_here: "यहाँ पंजीकरण करें"
  }
};

function getLanguage() {
  return localStorage.getItem('kaamsetu_lang') || 'en';
}

function setLanguage(lang) {
  localStorage.setItem('kaamsetu_lang', lang);
  applyLanguage(lang);
  showToast(lang === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई है।' : 'Language changed to English.', 'info');
  window.dispatchEvent(new CustomEvent('kaamsetuLangChange', { detail: { lang } }));
}

function t(key, defaultText) {
  const lang = getLanguage();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || defaultText || key;
}

function applyLanguage(lang = getLanguage()) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Translate elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === 'INPUT' && el.type === 'placeholder') {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  // Sync any language selectors on the page
  document.querySelectorAll('.lang-selector').forEach(sel => {
    sel.value = lang;
  });
}

function autoInjectLangSelector() {
  // Language selectors are now embedded directly in the nav HTML on each page.
  // This function is kept for backward compatibility but no longer injects new selectors.
  // applyLanguage() will sync the value of all .lang-selector elements.
}

// Run on page load
function updateAuthNav() {
  const user = (typeof window !== 'undefined' && window.KaamSetuAPI && window.KaamSetuAPI.getUser()) ||
               (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
  if (!user || !user.name) return;

  const userNavBtns = document.querySelectorAll('#navUserProfile, a[href="worker-profile.html"].btn, a[href="contractor-profile.html"].btn');
  userNavBtns.forEach(btn => {
    if (btn.classList.contains('nav-link')) return;
    const icon = user.role === 'contractor' ? '🏗️' : '👤';
    const displayName = user.name || user.company_name || user.contact_person || 'My Profile';
    btn.textContent = `${icon} ${displayName}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  initMobileMenu();
  autoInjectLangSelector();
  updateAuthNav();
  applyLanguage();
});
