import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, BriefcaseBusiness, UserRound, Plus, LogOut, Menu, X, Star, Bookmark, Trash2, ExternalLink, Flag,
  MessageCircle, LayoutDashboard, ShieldCheck, ArrowRight, CheckCircle2, Bell, Mic, MicOff, Bot, Volume2,
  Clock3, Wallet, Sparkles, Filter, PackageCheck, Send, ChevronRight, ChevronDown, Camera, Save, UserCircle, Settings, ShoppingBag, Eye
} from "lucide-react";
import { supabase, isConfigured } from "./supabase";
import "./style.css";

const categories = ["All", "Graphics & Design", "Writing & Translation", "Programming & Tech", "Video & Animation", "Digital Marketing", "Business", "Construction", "Masonry & Labour", "Plumbing", "Electrical Work", "Painting", "Carpentry", "AC & Appliance Repair", "Vehicle Repair", "Cleaning & Home Services", "Gardening", "Transport", "Education & Tutoring", "Events & Catering"];
const money = n => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
const getGigVisitorKey = () => {
  try {
    let key = localStorage.getItem("skillbridge-gig-visitor");
    if (!key) {
      key = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("skillbridge-gig-visitor", key);
    }
    return key;
  } catch { return null; }
};
const uiTranslations = {
  en:{explore:"Explore",orders:"Orders",messages:"Messages",myServices:"My services",dashboard:"Dashboard",login:"Log in",join:"Join Skill Bridge",heroEyebrow:"THE MARKETPLACE FOR EVERY KIND OF WORK",heroTitle:"Find work. Hire talent.",heroTitle2:"Get things done.",heroText:"From digital services to hands-on local jobs, connect with skilled people for every task — all in one simple place.",getStarted:"GET STARTED",whatDo:"What would you like to do?",findWork:"Find Work",hireSomeone:"Hire Someone",discover:"DISCOVER SERVICES",exploreAll:"Explore all services",search:"Search"},
  ur:{explore:"دریافت کریں",orders:"آرڈرز",messages:"پیغامات",myServices:"میری خدمات",dashboard:"ڈیش بورڈ",login:"لاگ اِن",join:"اسکل برج جوائن کریں",heroEyebrow:"ہر قسم کے کام کے لیے مارکیٹ پلیس",heroTitle:"کام تلاش کریں۔ ہنر خریدیں۔",heroTitle2:"کام مکمل کریں۔",heroText:"ڈیجیٹل خدمات سے لے کر مقامی کاموں تک، ہر کام کے لیے ماہر افراد سے رابطہ کریں۔",getStarted:"شروع کریں",whatDo:"آپ کیا کرنا چاہتے ہیں؟",findWork:"کام تلاش کریں",hireSomeone:"کسی کو کام دیں",discover:"خدمات دریافت کریں",exploreAll:"تمام خدمات دیکھیں",search:"تلاش"},
  pa:{explore:"کھوجو",orders:"آرڈر",messages:"پیغام",myServices:"میریاں خدمتاں",dashboard:"ڈیش بورڈ",login:"لاگ اِن",join:"سکل برج نال جڑو",heroEyebrow:"ہر قسم دے کم لئی مارکیٹ پلیس",heroTitle:"کم لبھو۔ ہنر مند لوک لبھو۔",heroTitle2:"کم پورا کرو۔",heroText:"ڈیجیٹل خدمتاں توں مقامی کم تک، ہر کم لئی ماہر بندیاں نال رابطہ کرو۔",getStarted:"شروع کرو",whatDo:"تسی کی کرنا چاہندے او؟",findWork:"کم لبھو",hireSomeone:"کسی نوں کم دیو",discover:"خدمتاں لبھو",exploreAll:"ساریاں خدمتاں ویکھو",search:"تلاش"},
  hi:{explore:"खोजें",orders:"ऑर्डर",messages:"संदेश",myServices:"मेरी सेवाएँ",dashboard:"डैशबोर्ड",login:"लॉग इन",join:"स्किल ब्रिज से जुड़ें",heroEyebrow:"हर तरह के काम का मार्केटप्लेस",heroTitle:"काम खोजें। हुनरमंद लोग पाएँ।",heroTitle2:"काम पूरा करें।",heroText:"डिजिटल सेवाओं से लेकर स्थानीय काम तक, हर काम के लिए कुशल लोगों से जुड़ें।",getStarted:"शुरू करें",whatDo:"आप क्या करना चाहते हैं?",findWork:"काम खोजें",hireSomeone:"किसी को काम दें",discover:"सेवाएँ खोजें",exploreAll:"सभी सेवाएँ देखें",search:"खोजें"},
  ar:{explore:"استكشف",orders:"الطلبات",messages:"الرسائل",myServices:"خدماتي",dashboard:"لوحة التحكم",login:"تسجيل الدخول",join:"انضم إلى Skill Bridge",heroEyebrow:"سوق لكل أنواع العمل",heroTitle:"ابحث عن عمل. وظّف المواهب.",heroTitle2:"أنجز مهامك.",heroText:"من الخدمات الرقمية إلى الأعمال المحلية، تواصل مع أصحاب المهارات لكل مهمة.",getStarted:"ابدأ الآن",whatDo:"ماذا تريد أن تفعل؟",findWork:"ابحث عن عمل",hireSomeone:"وظّف شخصاً",discover:"اكتشف الخدمات",exploreAll:"استكشف كل الخدمات",search:"بحث"},
  es:{explore:"Explorar",orders:"Pedidos",messages:"Mensajes",myServices:"Mis servicios",dashboard:"Panel",login:"Iniciar sesión",join:"Únete a Skill Bridge",heroEyebrow:"EL MERCADO PARA TODO TIPO DE TRABAJO",heroTitle:"Encuentra trabajo. Contrata talento.",heroTitle2:"Hazlo realidad.",heroText:"Desde servicios digitales hasta trabajos locales, conecta con personas cualificadas.",getStarted:"EMPEZAR",whatDo:"¿Qué te gustaría hacer?",findWork:"Buscar trabajo",hireSomeone:"Contratar a alguien",discover:"DESCUBRIR SERVICIOS",exploreAll:"Explorar todos los servicios",search:"Buscar"},
  fr:{explore:"Explorer",orders:"Commandes",messages:"Messages",myServices:"Mes services",dashboard:"Tableau de bord",login:"Connexion",join:"Rejoindre Skill Bridge",heroEyebrow:"LA PLACE DE MARCHÉ POUR TOUS LES TRAVAUX",heroTitle:"Trouvez du travail. Recrutez des talents.",heroTitle2:"Réalisez vos projets.",heroText:"Des services numériques aux travaux locaux, trouvez des personnes qualifiées.",getStarted:"COMMENCER",whatDo:"Que souhaitez-vous faire ?",findWork:"Trouver du travail",hireSomeone:"Engager quelqu’un",discover:"DÉCOUVRIR LES SERVICES",exploreAll:"Explorer tous les services",search:"Rechercher"},
  zh:{explore:"探索",orders:"订单",messages:"消息",myServices:"我的服务",dashboard:"控制面板",login:"登录",join:"加入 Skill Bridge",heroEyebrow:"适合各种工作的服务市场",heroTitle:"寻找工作。雇用人才。",heroTitle2:"完成任务。",heroText:"从数字服务到本地工作，轻松联系各类技能人才。",getStarted:"开始使用",whatDo:"您想做什么？",findWork:"寻找工作",hireSomeone:"雇用人才",discover:"发现服务",exploreAll:"探索所有服务",search:"搜索"},
  tr:{explore:"Keşfet",orders:"Siparişler",messages:"Mesajlar",myServices:"Hizmetlerim",dashboard:"Kontrol Paneli",login:"Giriş Yap",join:"Skill Bridge'e Katıl",heroEyebrow:"HER TÜRLÜ İŞ İÇİN PAZARYERİ",heroTitle:"İş bul. Yetenek kirala.",heroTitle2:"İşlerini hallet.",heroText:"Dijital hizmetlerden yerel işlere kadar her görev için uzmanlarla bağlantı kur.",getStarted:"BAŞLA",whatDo:"Ne yapmak istersiniz?",findWork:"İş Bul",hireSomeone:"Birini İşe Al",discover:"HİZMETLERİ KEŞFET",exploreAll:"Tüm hizmetleri keşfet",search:"Ara"},
  de:{explore:"Entdecken",orders:"Bestellungen",messages:"Nachrichten",myServices:"Meine Dienste",dashboard:"Dashboard",login:"Anmelden",join:"Skill Bridge beitreten",heroEyebrow:"DER MARKTPLATZ FÜR JEDE ART VON ARBEIT",heroTitle:"Finde Arbeit. Engagiere Talente.",heroTitle2:"Erledige Aufgaben.",heroText:"Von digitalen Dienstleistungen bis zu lokalen Arbeiten – finde passende Fachkräfte.",getStarted:"LOSLEGEN",whatDo:"Was möchtest du tun?",findWork:"Arbeit finden",hireSomeone:"Jemanden beauftragen",discover:"DIENSTE ENTDECKEN",exploreAll:"Alle Dienste entdecken",search:"Suchen"}
};
const uiExtraTranslations = {
  en:{profile:"My profile",saved:"Saved services",portfolio:"Portfolio",logout:"Log out",buyerMode:"Buyer mode",sellerMode:"Seller mode",switchWorkspace:"Switch workspace",manageOrders:"Manage orders",myPurchases:"My purchases",createService:"Create a service"},
  ur:{profile:"میرا پروفائل",saved:"محفوظ خدمات",portfolio:"پورٹ فولیو",logout:"لاگ آؤٹ",buyerMode:"خریدار موڈ",sellerMode:"سیلر موڈ",switchWorkspace:"ورک اسپیس تبدیل کریں",manageOrders:"آرڈرز سنبھالیں",myPurchases:"میری خریداری",createService:"سروس بنائیں"},
  pa:{profile:"میری پروفائل",saved:"محفوظ خدمتاں",portfolio:"پورٹ فولیو",logout:"لاگ آؤٹ",buyerMode:"خریدار موڈ",sellerMode:"سیلر موڈ",switchWorkspace:"ورک اسپیس بدلو",manageOrders:"آرڈر سنبھالو",myPurchases:"میری خریداری",createService:"سروس بناؤ"},
  hi:{profile:"मेरी प्रोफ़ाइल",saved:"सेव की गई सेवाएँ",portfolio:"पोर्टफोलियो",logout:"लॉग आउट",buyerMode:"खरीदार मोड",sellerMode:"विक्रेता मोड",switchWorkspace:"वर्कस्पेस बदलें",manageOrders:"ऑर्डर प्रबंधित करें",myPurchases:"मेरी खरीदारी",createService:"सेवा बनाएँ"},
  ar:{profile:"ملفي الشخصي",saved:"الخدمات المحفوظة",portfolio:"معرض الأعمال",logout:"تسجيل الخروج",buyerMode:"وضع المشتري",sellerMode:"وضع البائع",switchWorkspace:"تبديل مساحة العمل",manageOrders:"إدارة الطلبات",myPurchases:"مشترياتي",createService:"إنشاء خدمة"},
  es:{profile:"Mi perfil",saved:"Servicios guardados",portfolio:"Portafolio",logout:"Cerrar sesión",buyerMode:"Modo comprador",sellerMode:"Modo vendedor",switchWorkspace:"Cambiar espacio",manageOrders:"Gestionar pedidos",myPurchases:"Mis compras",createService:"Crear un servicio"},
  fr:{profile:"Mon profil",saved:"Services enregistrés",portfolio:"Portfolio",logout:"Déconnexion",buyerMode:"Mode acheteur",sellerMode:"Mode vendeur",switchWorkspace:"Changer d’espace",manageOrders:"Gérer les commandes",myPurchases:"Mes achats",createService:"Créer un service"},
  zh:{profile:"我的资料",saved:"已收藏服务",portfolio:"作品集",logout:"退出登录",buyerMode:"买家模式",sellerMode:"卖家模式",switchWorkspace:"切换工作区",manageOrders:"管理订单",myPurchases:"我的购买",createService:"创建服务"},
  tr:{profile:"Profilim",saved:"Kaydedilen hizmetler",portfolio:"Portföy",logout:"Çıkış Yap",buyerMode:"Alıcı modu",sellerMode:"Satıcı modu",switchWorkspace:"Çalışma alanını değiştir",manageOrders:"Siparişleri yönet",myPurchases:"Satın aldıklarım",createService:"Hizmet oluştur"},
  de:{profile:"Mein Profil",saved:"Gespeicherte Dienste",portfolio:"Portfolio",logout:"Abmelden",buyerMode:"Käufermodus",sellerMode:"Verkäufermodus",switchWorkspace:"Arbeitsbereich wechseln",manageOrders:"Bestellungen verwalten",myPurchases:"Meine Käufe",createService:"Dienst erstellen"}
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeMode, setActiveMode] = useState("buyer");
  const [page, setPage] = useState("home");
  const [language,setLanguage]=useState(()=>{try{return localStorage.getItem("skillbridge-language")||"en";}catch{return "en";}});
  const [gigs, setGigs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minBudget,setMinBudget]=useState("");
  const [maxBudget,setMaxBudget]=useState("");
  const [locationFilter,setLocationFilter]=useState("");
  const [deliveryFilter,setDeliveryFilter]=useState("any");
  const [sortBy,setSortBy]=useState("newest");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [recentViewedIds, setRecentViewedIds] = useState(() => { try { return JSON.parse(localStorage.getItem("skillbridge-recently-viewed") || "[]").slice(0,8); } catch { return []; } });
  const [inboxSearch, setInboxSearch] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [signupConfirmationPending, setSignupConfirmationPending] = useState(false);
  const [authForm, setAuthForm] = useState({ email:"", password:"", name:"", role:"buyer" });
  const [gigForm, setGigForm] = useState({ title:"", description:"", category:"Graphics & Design", price:"", delivery_days:"3", image_url:"" });
  const [gigImageBusy,setGigImageBusy]=useState(false);
  const [editGigImageBusy,setEditGigImageBusy]=useState(false);
  const [extraPackages, setExtraPackages] = useState([{name:"Standard",description:"",price:"",delivery_days:"5",revisions:"2"},{name:"Premium",description:"",price:"",delivery_days:"7",revisions:"3"}]);
  const [faqText, setFaqText] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("Basic");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadMessages,setUnreadMessages]=useState(0);
  const [notifications,setNotifications]=useState([]);
  const [unreadNotifications,setUnreadNotifications]=useState(0);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [unreadByThread,setUnreadByThread]=useState({});
  const [unreadByOrder,setUnreadByOrder]=useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationOffers, setConversationOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({title:"",description:"",amount:"",delivery_days:"3"});
  const [messageText, setMessageText] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating:"5", comment:"" });
  const [profileForm, setProfileForm] = useState({ full_name:"", bio:"", professional_title:"", country:"", city:"", languages:"", skills:"", experience_years:"", education:"", certifications:"", website_url:"", availability:true });
  const [sellerReviews, setSellerReviews] = useState([]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [favoriteGigs, setFavoriteGigs] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [sellerGigs, setSellerGigs] = useState([]);
  const [gigAnalytics, setGigAnalytics] = useState({});
  const [settingsPassword,setSettingsPassword]=useState("");
  const [settingsPasswordConfirm,setSettingsPasswordConfirm]=useState("");
  const [settingsEmail,setSettingsEmail]=useState("");
  const [assistantOpen,setAssistantOpen]=useState(false);
  const [assistantListening,setAssistantListening]=useState(false);
  const [assistantTranscript,setAssistantTranscript]=useState("");
  const [assistantText,setAssistantText]=useState("");
  const [assistantBusy,setAssistantBusy]=useState(false);
  const [assistantHistory,setAssistantHistory]=useState([]);
  const [assistantReply,setAssistantReply]=useState("Assalam-o-Alaikum! Main Skill Bridge assistant hoon. Aap bol kar website chala sakte hain.");
  const [assistantLanguage,setAssistantLanguage]=useState("ur-PK");
  const [voiceFlow,setVoiceFlow]=useState("");
  const recognitionRef=useRef(null);

  const [editingGigId, setEditingGigId] = useState(null);
  const [editGigForm, setEditGigForm] = useState({title:"",description:"",category:"Graphics & Design",price:"",delivery_days:"3",image_url:""});
  const [editExtraPackages,setEditExtraPackages]=useState([{name:"Standard",description:"",price:"",delivery_days:"5",revisions:"2"},{name:"Premium",description:"",price:"",delivery_days:"7",revisions:"3"}]);
  const [editFaqText,setEditFaqText]=useState("");
  const [editRequirementsText,setEditRequirementsText]=useState("");
  const [publicSeller, setPublicSeller] = useState(null);
  const [publicSellerGigs, setPublicSellerGigs] = useState([]);
  const [publicSellerPortfolio, setPublicSellerPortfolio] = useState([]);
  const [publicSellerReviews, setPublicSellerReviews] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({title:"",description:"",project_url:"",image_url:""});
  const [reports, setReports] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({reason:"fake_service",details:""});

  const demoMode = !isConfigured;
  const t={...uiTranslations.en,...(uiTranslations[language]||{}),...(uiExtraTranslations[language]||{})};
  useEffect(()=>{try{localStorage.setItem("skillbridge-language",language);}catch{}},[language]);

  useEffect(() => {
    if (!isConfigured) {
      setGigs([]);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user);
        setPage("dashboard");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        loadProfile(next.user);
        if (_event === "SIGNED_IN") setPage("dashboard");
      } else {
        setProfile(null);
        setOrders([]);
        if (_event === "SIGNED_OUT") setPage("home");
      }
    });
    loadGigs();
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadGigs();
      loadOrders();
      loadSellerReviews();
      loadInbox();
      loadFavorites();
      loadPortfolio();
      loadSellerGigs();
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }
    loadNotifications();
    const channel = supabase.channel("notifications-" + session.user.id)
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"notifications", filter:"recipient_id=eq." + session.user.id}, payload => {
        setNotifications(prev => [payload.new, ...prev].slice(0,20));
        setUnreadNotifications(count => count + 1);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  const loadProfile = async user => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data && data.account_status && data.account_status!=="active") { await supabase.auth.signOut(); setProfile(null); show(data.account_status==="banned"?"This account has been permanently banned after moderation review.":"This account is currently suspended."); return; }
    if (data) { const preferredMode = user.user_metadata?.active_mode || data.active_mode || (data.role==="seller"?"seller":"buyer"); setActiveMode(preferredMode); if (data.active_mode !== preferredMode) supabase.from("profiles").update({active_mode:preferredMode}).eq("id",user.id); setProfile(data); setProfileForm({ full_name:data.full_name || "", bio:data.bio || "", professional_title:data.professional_title || "", country:data.country || "", city:data.city || "", languages:(data.languages || []).join(", "), skills:(data.skills || []).join(", "), experience_years:data.experience_years ?? "", education:data.education || "", certifications:data.certifications || "", website_url:data.website_url || "", availability:data.availability ?? true }); }
    else {
      const fallback = { id:user.id, full_name:user.user_metadata?.full_name || user.email?.split("@")[0], role:user.user_metadata?.role || "buyer", account_modes:["buyer","seller"], active_mode:user.user_metadata?.active_mode || "buyer" };
      const { data: created } = await supabase.from("profiles").upsert(fallback).select().single();
      setProfile(created || fallback); setActiveMode(fallback.active_mode); setProfileForm({ full_name:fallback.full_name || "", bio:fallback.bio || "", professional_title:"", country:"", languages:"", skills:"", experience_years:"", education:"", certifications:"", website_url:"", availability:true });
    }
  };

  const loadGigs = async () => {
    const { data, error } = await supabase.from("gigs").select("*, profiles(full_name, avatar_url, country, city)").eq("is_active", true).order("created_at", { ascending:false });
    if (error) { show(error.message); return; }
    const list=data||[], sellerIds=[...new Set(list.map(g=>g.seller_id))];
    if (!sellerIds.length) { setGigs([]); return; }
    const {data:reviews}=await supabase.from("reviews").select("seller_id,rating").in("seller_id",sellerIds);
    const stats={}; (reviews||[]).forEach(r=>{stats[r.seller_id]??={sum:0,count:0};stats[r.seller_id].sum+=Number(r.rating||0);stats[r.seller_id].count++;});
    setGigs(list.map(g=>({...g,sellerRating:stats[g.seller_id]?.count?(stats[g.seller_id].sum/stats[g.seller_id].count).toFixed(1):null,sellerReviewCount:stats[g.seller_id]?.count||0})));
  };

  const loadSellerReviews = async () => {
    const { data, error } = await supabase.from("reviews").select("id,seller_id,rating,comment,created_at").order("created_at", { ascending:false });
    if (!error) setSellerReviews(data || []);
  };

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*, gigs(title, price), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)").order("created_at", { ascending:false });
    setOrders(data || []);
  };

  const filteredGigs = useMemo(() => {
    let result=gigs.filter(g=>{
      const matchesText=`${g.title} ${g.description} ${g.category} ${g.profiles?.full_name||""}`.toLowerCase().includes(search.toLowerCase());
      const place=`${g.profiles?.city||""} ${g.profiles?.country||""}`.toLowerCase();
      const price=Number(g.price||0), days=Number(g.delivery_days||0);
      return g.is_active!==false && matchesText && (category==="All"||g.category===category) && (!locationFilter||place.includes(locationFilter.toLowerCase())) && (!minBudget||price>=Number(minBudget)) && (!maxBudget||price<=Number(maxBudget)) && (deliveryFilter==="any"||(deliveryFilter==="1"&&days<=1)||(deliveryFilter==="3"&&days<=3)||(deliveryFilter==="7"&&days<=7));
    });
    if(sortBy==="price-low") result.sort((a,b)=>Number(a.price)-Number(b.price));
    else if(sortBy==="price-high") result.sort((a,b)=>Number(b.price)-Number(a.price));
    else result.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    return result;
  },[gigs,search,category,locationFilter,minBudget,maxBudget,deliveryFilter,sortBy]);

  const show = msg => { setNotice(msg); setTimeout(() => setNotice(""), 4200); };
  const speakAssistant = message => {
    setAssistantReply(message);
    if (typeof window !== "undefined" && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = assistantLanguage;
      utterance.rate = 0.94;
      window.speechSynthesis.speak(utterance);
    }
  };

  const beginVoiceCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakAssistant("Is browser mein voice recognition available nahi. Chrome browser mein microphone permission ke sath try karein.");
      return;
    }
    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const recognition = new SpeechRecognition();
      recognition.lang = assistantLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setAssistantListening(true); setAssistantTranscript(""); };
      recognition.onresult = event => {
        const spoken = event.results?.[0]?.[0]?.transcript || "";
        setAssistantTranscript(spoken);
        handleVoiceCommand(spoken);
      };
      recognition.onerror = event => {
        setAssistantListening(false);
        speakAssistant(event.error === "not-allowed" ? "Microphone permission allow karein, phir dobara try karein." : "Awaaz clear nahi aayi. Mic dabaa kar dobara boliye.");
      };
      recognition.onend = () => setAssistantListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setAssistantListening(false);
      speakAssistant("Microphone start nahi ho saka. Dobara mic dabaa kar try karein.");
    }
  };

  const handleVoiceCommand = async raw => {
    const command = (raw || "").trim();
    if (!command || assistantBusy) return;
    const history = [...assistantHistory, {role:"user",content:command}].slice(-10);
    setAssistantHistory(history);
    setAssistantBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:history,context:{loggedIn:Boolean(session),activeMode:session?activeMode:"guest"}})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.reply || result.error || "AI service unavailable");
      const reply = result.reply || "Main aapki madad kar sakta hoon. Batayein kya karna hai?";
      setAssistantHistory([...history,{role:"assistant",content:reply}].slice(-10));
      if (result.action?.type === "navigate") {
        navigate(result.action.page);
      } else if (result.action?.type === "search_gigs") {
        setSearch(result.action.query);
        setCategory("All");
        setPage("home");
        setTimeout(()=>document.getElementById("explore")?.scrollIntoView({behavior:"smooth"}),180);
      } else if (result.action?.type === "draft_gig") {
        if (!session) {
          setAuthMode("login");
          navigate("auth");
          speakAssistant("Gig ka draft banane se pehle Skill Bridge mein login karein.");
          setAssistantBusy(false);
          return;
        }
        if (activeMode !== "seller") {
          speakAssistant("Gig draft banane ke liye account menu se Seller Mode select karein, phir dobara keh dein.");
          setAssistantBusy(false);
          return;
        }
        const d=result.action.data;
        setGigForm({title:d.title,description:d.description,category:d.category,price:String(d.price),delivery_days:String(d.delivery_days),image_url:""});
        navigate("create-gig");
        speakAssistant("Aapki gig ka draft tayyar hai. Form mein details check karein. Publish karne se pehle aap khud review aur confirmation dein.");
        setAssistantBusy(false);
        return;
      }
      speakAssistant(reply);
    } catch (error) {
      speakAssistant(error.message || "AI se connection nahi ho saka. Dobara try karein.");
    } finally {
      setAssistantBusy(false);
    }
  };

  const navigate = p => {
    const privatePages = ["dashboard", "orders", "my-gigs", "create-gig", "messages", "admin", "saved", "portfolio"];
    if (privatePages.includes(p) && !session) {
      setAuthMode("login");
      setPage("auth");
      setMobileMenu(false);
      setSelectedGig(null);
      show("Please log in to access your dashboard and orders.");
      return;
    }
    setPage(p); setMobileMenu(false); setSelectedGig(null);
  };

  const signUpOrIn = async e => {
    e.preventDefault(); setBusy(true);
    if (demoMode) { show("Pehle Supabase free project connect karein. Setup README mein hai."); setBusy(false); return; }
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email:authForm.email, password:authForm.password,
          options:{ data:{ full_name:authForm.name, role:authForm.role, active_mode:authForm.role, account_modes:["buyer","seller"] } }
        });
        if (error) throw error;
        if (data.session) {
          setSignupConfirmationPending(false);
          show("Account ban gaya! Skill Bridge mein khush aamdeed.");
        } else {
          setSignupConfirmationPending(true);
          setAuthMode("login");
          show("Confirmation email sent. Verify your email, then log in here.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email:authForm.email, password:authForm.password });
        if (error) throw error;
        show("Login successful!");
      }
    } catch (err) { show(err.message); }
    setBusy(false);
  };

  const signOut = async () => { if (!demoMode) await supabase.auth.signOut(); setActiveMode("buyer"); navigate("home"); show("You have logged out."); };

  const switchMode = async mode => {
    if (!session?.user || !["buyer","seller"].includes(mode)) return;
    if (mode===activeMode) { setPage("dashboard"); setAccountMenu(false); return; }
    setBusy(true);
    const { data, error } = await supabase.from("profiles").update({active_mode:mode,account_modes:["buyer","seller"]}).eq("id",session.user.id).select().single();
    if (error) show(error.message);
    else {
      const { error:metadataError } = await supabase.auth.updateUser({data:{active_mode:mode}});
      setProfile(data); setActiveMode(mode); setPage("dashboard"); setAccountMenu(false);
      show(metadataError ? "Mode changed. Your account preference may refresh on next login." : (mode==="seller" ? "Seller mode is now active." : "Buyer mode is now active."));
    }
    setBusy(false);
  };

  const updateAccountPassword = async e => {
    e.preventDefault();
    if(settingsPassword.length<6) return show("Password must be at least 6 characters.");
    if(settingsPassword!==settingsPasswordConfirm) return show("The passwords do not match.");
    setBusy(true);
    const {error}=await supabase.auth.updateUser({password:settingsPassword});
    if(error) show(error.message);
    else {setSettingsPassword("");setSettingsPasswordConfirm("");show("Password updated successfully.");}
    setBusy(false);
  };

  const requestEmailChange = async e => {
    e.preventDefault();
    const nextEmail=settingsEmail.trim();
    if(!nextEmail || nextEmail.toLowerCase()===session?.user?.email?.toLowerCase()) return show("Enter a different email address.");
    setBusy(true);
    const {error}=await supabase.auth.updateUser({email:nextEmail});
    if(error) show(error.message);
    else {setSettingsEmail("");show("Email change requested. Check the new email inbox for its confirmation link.");}
    setBusy(false);
  };

  const saveProfile = async e => {
    e.preventDefault();
    if (!session?.user) return;
    setBusy(true);
    const { data, error } = await supabase.from("profiles").update({
      full_name:profileForm.full_name.trim(), bio:profileForm.bio.trim(),
      professional_title:profileForm.professional_title.trim(), country:profileForm.country.trim(), city:profileForm.city.trim(),
      languages:profileForm.languages.split(",").map(x=>x.trim()).filter(Boolean),
      skills:profileForm.skills.split(",").map(x=>x.trim()).filter(Boolean),
      experience_years:profileForm.experience_years===""?null:Number(profileForm.experience_years),
      education:profileForm.education.trim(), certifications:profileForm.certifications.trim(),
      website_url:profileForm.website_url.trim(), availability:profileForm.availability
    }).eq("id", session.user.id).select().single();
    if (error) show(error.message);
    else { setProfile(data); show("Profile updated successfully."); }
    setBusy(false);
  };

  const uploadAvatar = async e => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;
    if (!file.type.startsWith("image/")) return show("Please choose an image file.");
    if (file.size > 3 * 1024 * 1024) return show("Image must be smaller than 3 MB.");
    setAvatarBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = session.user.id + "/avatar-" + Date.now() + "." + ext;
    const { error:uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert:true, contentType:file.type });
    if (uploadError) { show(uploadError.message.includes("Bucket not found") ? "Avatar storage setup is required in Supabase before uploading." : uploadError.message); setAvatarBusy(false); return; }
    const { data:urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const { data, error } = await supabase.from("profiles").update({ avatar_url:urlData.publicUrl }).eq("id", session.user.id).select().single();
    if (error) show(error.message);
    else { setProfile(data); show("Profile picture updated."); }
    setAvatarBusy(false);
    e.target.value = "";
  };


  const uploadGigImage = async (e, editing=false) => {
    const input=e.target;
    const file=input.files?.[0];
    if(!file)return;
    if(!file.type.startsWith("image/")){show("Please choose an image file.");input.value="";return;}
    if(file.size>5*1024*1024){show("Gig image must be smaller than 5 MB.");input.value="";return;}
    if(!session?.user){show("Please log in before uploading a gig image.");input.value="";return;}
    editing?setEditGigImageBusy(true):setGigImageBusy(true);
    try{
      const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
      const path=session.user.id+"/gig-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
      const {error}=await supabase.storage.from("gig-images").upload(path,file,{upsert:false,contentType:file.type});
      if(error)throw error;
      const {data}=supabase.storage.from("gig-images").getPublicUrl(path);
      if(editing)setEditGigForm(prev=>({...prev,image_url:data.publicUrl}));
      else setGigForm(prev=>({...prev,image_url:data.publicUrl}));
      show("Gig image uploaded. Preview check kar lein.");
    }catch(error){
      show(error.message?.includes("Bucket not found")?"Gig image storage setup baqi hai. README mein diya SQL Supabase SQL Editor mein run karein.":error.message||"Image upload nahi ho saki.");
    }finally{
      editing?setEditGigImageBusy(false):setGigImageBusy(false);
      input.value="";
    }
  };

  const createGig = async e => {
    e.preventDefault();
    if (!profile || demoMode) return show("Gig publish karne ke liye account aur Supabase connection zaroori hai.");
    if (activeMode !== "seller") return show("Seller mode par switch karein to publish a service.");
    setBusy(true);
    const packages=[{name:"Basic",description:gigForm.description.trim(),price:Number(gigForm.price),delivery_days:Number(gigForm.delivery_days),revisions:0},...extraPackages.filter(p=>p.price!=="" && Number(p.price)>0).map(p=>({...p,price:Number(p.price),delivery_days:Number(p.delivery_days),revisions:Number(p.revisions)}))];
    const faqs=faqText.split("\n").map(line=>{const parts=line.split("|");return {question:(parts.shift()||"").trim(),answer:parts.join("|").trim()};}).filter(x=>x.question&&x.answer);
    const requirements=requirementsText.split("\n").map(x=>x.trim()).filter(Boolean);
    const { error } = await supabase.from("gigs").insert({
      seller_id:session.user.id, title:gigForm.title.trim(), description:gigForm.description.trim(),
      category:gigForm.category, price:Number(gigForm.price), delivery_days:Number(gigForm.delivery_days), image_url:gigForm.image_url.trim()||null, packages, faqs, requirements
    });
    if (error) show(error.message);
    else { show("Your service with packages is now published!"); setGigForm({title:"",description:"",category:"Graphics & Design",price:"",delivery_days:"3",image_url:""}); setExtraPackages([{name:"Standard",description:"",price:"",delivery_days:"5",revisions:"2"},{name:"Premium",description:"",price:"",delivery_days:"7",revisions:"3"}]);setFaqText("");setRequirementsText(""); await loadGigs(); await loadSellerGigs(); navigate("my-gigs"); }
    setBusy(false);
  };

  const updateExtraPackage=(index,field,value)=>setExtraPackages(prev=>prev.map((p,i)=>i===index?{...p,[field]:value}:p));
  const updateEditPackage=(index,field,value)=>setEditExtraPackages(prev=>prev.map((p,i)=>i===index?{...p,[field]:value}:p));

  const openSellerProfile = async sellerId => {
    const [p,g,portfolio,reviews]=await Promise.all([
      supabase.from("profiles").select("*").eq("id",sellerId).maybeSingle(),
      supabase.from("gigs").select("*, profiles(full_name,avatar_url)").eq("seller_id",sellerId).eq("is_active",true).order("created_at",{ascending:false}),
      supabase.from("portfolio_items").select("*").eq("user_id",sellerId).order("created_at",{ascending:false}),
      supabase.from("reviews").select("id,rating,comment,created_at,buyer:profiles!reviews_buyer_id_fkey(full_name)").eq("seller_id",sellerId).order("created_at",{ascending:false})
    ]);
    if (p.error || !p.data) { show(p.error?.message || "Seller profile not found."); return; }
    const sellerReviewRows=reviews.data||[], avg=sellerReviewRows.length?(sellerReviewRows.reduce((n,r)=>n+Number(r.rating||0),0)/sellerReviewRows.length).toFixed(1):null;
    setPublicSeller(p.data); setPublicSellerGigs((g.data||[]).map(item=>({...item,sellerRating:avg,sellerReviewCount:sellerReviewRows.length}))); setPublicSellerPortfolio(portfolio.data||[]); setPublicSellerReviews(sellerReviewRows); setSelectedGig(null); setPage("seller-profile");
  };

  const loadSellerGigs = async () => {
    if (!session?.user) return;
    const {data,error}=await supabase.from("gigs").select("*, profiles(full_name,avatar_url)").eq("seller_id",session.user.id).order("created_at",{ascending:false});
    if (error) { show(error.message); return; }
    const ownGigs=data||[]; setSellerGigs(ownGigs);
    if (!ownGigs.length) { setGigAnalytics({}); return; }
    const {data:events,error:eventError}=await supabase.from("gig_events").select("gig_id,event_type").in("gig_id",ownGigs.map(g=>g.id));
    if (!eventError) {
      const stats={};
      (events||[]).forEach(ev=>{stats[ev.gig_id]??={impressions:0,clicks:0};if(ev.event_type==="impression")stats[ev.gig_id].impressions++;if(ev.event_type==="click")stats[ev.gig_id].clicks++;});
      setGigAnalytics(stats);
    }
  };

  const trackGigImpression = useCallback(async gig => {
    const userId = session?.user?.id || null;
    if (userId && gig.seller_id === userId) return;
    const visitorKey = getGigVisitorKey();
    if (!visitorKey) return;
    const { error } = await supabase.from("gig_events").insert({
      gig_id: gig.id, actor_id: userId, visitor_key: visitorKey, event_type: "impression"
    });
    if (error && error.code !== "23505") console.warn("Could not record gig view:", error.message);
  }, [session?.user?.id]);

  const trackGigClick = async gig => {
    if (session?.user && gig.seller_id===session.user.id) return;
    const {error}=await supabase.from("gig_events").insert({gig_id:gig.id,actor_id:session?.user?.id||null,event_type:"click"});
    if (!error) setGigAnalytics(prev=>({...prev,[gig.id]:{impressions:prev[gig.id]?.impressions||0,clicks:(prev[gig.id]?.clicks||0)+1}}));
  };

  const deleteGig = async gig => {
    const {error}=await supabase.from("gigs").delete().eq("id",gig.id).eq("seller_id",session.user.id);
    if (error) show(error.message); else {setSellerGigs(prev=>prev.filter(x=>x.id!==gig.id));await loadGigs();show("Service deleted.");}
  };

  const saveGigEdit = async e => {
    e.preventDefault();
    if (!editingGigId) return;
    setBusy(true);
    const packages=[{name:"Basic",description:editGigForm.description.trim(),price:Number(editGigForm.price),delivery_days:Number(editGigForm.delivery_days),revisions:0},...editExtraPackages.filter(p=>p.price!==""&&Number(p.price)>0).map(p=>({...p,price:Number(p.price),delivery_days:Number(p.delivery_days),revisions:Number(p.revisions)}))];
    const faqs=editFaqText.split("\n").map(line=>{const parts=line.split("|");return {question:(parts.shift()||"").trim(),answer:parts.join("|").trim()};}).filter(x=>x.question&&x.answer);
    const requirements=editRequirementsText.split("\n").map(x=>x.trim()).filter(Boolean);
    const {error}=await supabase.from("gigs").update({title:editGigForm.title.trim(),description:editGigForm.description.trim(),category:editGigForm.category,price:Number(editGigForm.price),delivery_days:Number(editGigForm.delivery_days),image_url:editGigForm.image_url.trim()||null,packages,faqs,requirements}).eq("id",editingGigId).eq("seller_id",session.user.id);
    if (error) show(error.message); else { setEditingGigId(null); await loadSellerGigs(); await loadGigs(); show("Service and packages updated."); }
    setBusy(false);
  };

  const toggleGigStatus = async gig => {
    const {error}=await supabase.from("gigs").update({is_active:!gig.is_active}).eq("id",gig.id).eq("seller_id",session.user.id);
    if (error) show(error.message); else { await loadSellerGigs(); await loadGigs(); show(gig.is_active?"Service paused and hidden from marketplace.":"Service is active again."); }
  };

  const loadFavorites = async () => {
    if (!session?.user) return;
    const {data,error}=await supabase.from("favorites").select("*, gigs(*, profiles(full_name,avatar_url))").eq("user_id",session.user.id).order("created_at",{ascending:false});
    if (!error) setFavoriteGigs((data||[]).filter(x=>x.gigs?.id).map(x=>x.gigs));
  };

  const loadPortfolio = async () => {
    if (!session?.user) return;
    const {data,error}=await supabase.from("portfolio_items").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});
    if (!error) setPortfolioItems(data||[]);
  };

  const toggleFavorite = async gig => {
    if (!session?.user) { setAuthMode("login"); navigate("auth"); show("Log in to save services."); return; }
    const saved=favoriteGigs.some(g=>g.id===gig.id);
    if (saved) {
      const {error}=await supabase.from("favorites").delete().eq("user_id",session.user.id).eq("gig_id",gig.id);
      if (error) show(error.message); else { setFavoriteGigs(prev=>prev.filter(g=>g.id!==gig.id)); show("Removed from saved services."); }
    } else {
      const {error}=await supabase.from("favorites").insert({user_id:session.user.id,gig_id:gig.id});
      if (error) show(error.code==="23505"?"This service is already saved.":error.message); else { setFavoriteGigs(prev=>[gig,...prev]); show("Service saved."); }
    }
  };

  const addPortfolioItem = async e => {
    e.preventDefault();
    if (!session?.user || activeMode!=="seller") return show("Switch to Seller mode to add portfolio work.");
    setBusy(true);
    const {error}=await supabase.from("portfolio_items").insert({user_id:session.user.id,title:portfolioForm.title.trim(),description:portfolioForm.description.trim(),project_url:portfolioForm.project_url.trim(),image_url:portfolioForm.image_url.trim()});
    if (error) show(error.message); else { setPortfolioForm({title:"",description:"",project_url:"",image_url:""}); await loadPortfolio(); show("Portfolio project added."); }
    setBusy(false);
  };

  const removePortfolioItem = async id => {
    const {error}=await supabase.from("portfolio_items").delete().eq("id",id).eq("user_id",session.user.id);
    if (error) show(error.message); else { setPortfolioItems(prev=>prev.filter(x=>x.id!==id)); show("Portfolio project removed."); }
  };

  const loadReports = async () => {
    if (profile?.role !== "admin") return;
    const {data,error}=await supabase.from("reports").select("*, reporter:profiles!reports_reporter_profile_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name,account_status), gigs(title)").order("created_at",{ascending:false});
    if (error) show(error.message); else setReports(data||[]);
  };

  const submitReport = async e => {
    e.preventDefault();
    if (!session?.user) { setAuthMode("login"); setSelectedGig(null); navigate("auth"); show("Log in to submit a report."); return; }
    if (!selectedGig) return;
    const {error}=await supabase.from("reports").insert({reporter_id:session.user.id,reported_user_id:selectedGig.seller_id,gig_id:selectedGig.id,reason:reportForm.reason,details:reportForm.details.trim()});
    if (error) show(error.message);
    else {setReportOpen(false);setReportForm({reason:"fake_service",details:""});show("Report submitted. Three reports from different users will automatically start an investigation.");}
  };

  const updateReport = async (report,status) => {
    const {error}=await supabase.from("reports").update({status,reviewed_by:session.user.id,reviewed_at:new Date().toISOString()}).eq("id",report.id);
    if (error) show(error.message); else {show("Report status updated.");await loadReports();}
  };

  const permanentlyBanUser = async report => {
    if (!window.confirm("Have you reviewed the evidence and confirmed a serious policy violation? This permanently blocks this account from using Skill Bridge.")) return;
    const {error}=await supabase.rpc("admin_ban_reported_user",{p_user_id:report.reported_user_id,p_reason:"Confirmed policy violation after investigation"});
    if (error) {show(error.message);return;}
    show("Account permanently banned after evidence review.");
    await loadReports();
  };

  const updateOrder = async (id, status) => {
    const { error } = await supabase.rpc("transition_order_status", {
      p_order_id:id, p_next_status:status, p_revision_note:null
    });
    if (error) { show(error.message); return; }
    show(status==="completed"?"Order completed successfully.":status==="delivered"?"Delivery submitted to the buyer.":status==="cancelled"?"Order declined.":"Order accepted and moved to In Progress.");
    await loadOrders();
  };

  const requestRevision = async (order,note) => {
    const clean=String(note||"").trim();
    if (clean.length<3) return show("Please explain what needs to be revised.");
    const {error}=await supabase.rpc("transition_order_status",{
      p_order_id:order.id,p_next_status:"revision_requested",p_revision_note:clean
    });
    if (error) { show(error.message); return; }
    const {error:messageError}=await supabase.from("messages").insert({order_id:order.id,sender_id:session.user.id,body:"Revision requested: "+clean});
    await loadOrders();
    show(messageError?"Revision request saved. The order message could not be sent.":"Revision requested and seller notified.");
  };

  const loadMessages = async order => {
    setActiveOrder(order); setActiveConversation(null); setConversationOffers([]); navigate("messages");
    const { data, error } = await supabase.from("messages").select("*, profiles(full_name)").eq("order_id", order.id).order("created_at");
    if (!error) setMessages(data || []);
    await supabase.from("messages").update({read_at:new Date().toISOString()}).eq("order_id",order.id).neq("sender_id",session.user.id).is("read_at",null);
    await loadInbox();
  };


  const loadInbox = async () => {
    if (!session?.user) return;
    const [threads,unread]=await Promise.all([
      supabase.from("conversations").select("*, gigs(title), buyer:profiles!conversations_buyer_id_fkey(full_name,avatar_url), seller:profiles!conversations_seller_id_fkey(full_name,avatar_url)").or("buyer_id.eq."+session.user.id+",seller_id.eq."+session.user.id).order("updated_at",{ascending:false}),
      supabase.from("messages").select("id,conversation_id,order_id").neq("sender_id",session.user.id).is("read_at",null)
    ]);
    if (!threads.error) setConversations(threads.data || []);
    if (!unread.error) {
      const threadCounts={},orderCounts={};
      (unread.data||[]).forEach(message=>{
        if(message.conversation_id) threadCounts[message.conversation_id]=(threadCounts[message.conversation_id]||0)+1;
        if(message.order_id) orderCounts[message.order_id]=(orderCounts[message.order_id]||0)+1;
      });
      setUnreadByThread(threadCounts); setUnreadByOrder(orderCounts); setUnreadMessages((unread.data||[]).length);
    }
  };

  const loadNotifications = async () => {
    if (!session?.user?.id) return;
    const {data,error}=await supabase.from("notifications").select("*").eq("recipient_id",session.user.id).order("created_at",{ascending:false}).limit(20);
    if (error) { show(error.message); return; }
    setNotifications(data||[]);
    setUnreadNotifications((data||[]).filter(item=>!item.read_at).length);
  };

  const markNotificationRead = async notification => {
    if (notification.read_at) return;
    const readAt=new Date().toISOString();
    const {error}=await supabase.from("notifications").update({read_at:readAt}).eq("id",notification.id).eq("recipient_id",session.user.id);
    if (error) { show(error.message); return; }
    setNotifications(prev=>prev.map(item=>item.id===notification.id?{...item,read_at:readAt}:item));
    setUnreadNotifications(count=>Math.max(0,count-1));
  };

  const openNotification = async notification => {
    await markNotificationRead(notification);
    setNotificationsOpen(false);
    if (notification.entity_type==="conversation" && notification.entity_id) {
      const {data}=await supabase.from("conversations").select("*, gigs(title), buyer:profiles!conversations_buyer_id_fkey(full_name,avatar_url), seller:profiles!conversations_seller_id_fkey(full_name,avatar_url)").eq("id",notification.entity_id).maybeSingle();
      if (data) { setPage("messages"); await loadConversation(data); }
      else navigate("messages");
    } else if (notification.entity_type==="order") {
      await loadOrders();
      navigate("orders");
    } else navigate("dashboard");
  };

  const loadConversation = async conversation => {
    setActiveConversation(conversation); setActiveOrder(null);
    const [mr,offers] = await Promise.all([
      supabase.from("messages").select("*, profiles(full_name)").eq("conversation_id",conversation.id).order("created_at"),
      supabase.from("custom_offers").select("*").eq("conversation_id",conversation.id).order("created_at",{ascending:false})
    ]);
    if (!mr.error) setMessages(mr.data || []);
    if (!offers.error) setConversationOffers(offers.data || []);
    await supabase.from("messages").update({read_at:new Date().toISOString()}).eq("conversation_id",conversation.id).neq("sender_id",session.user.id).is("read_at",null);
    await loadInbox();
  };

  const startConversation = async gig => {
    if (!session?.user) { setAuthMode("login"); setPage("auth"); show("Log in to contact this seller."); return; }
    if (gig.seller_id===session.user.id) { show("You cannot message yourself."); return; }
    setBusy(true);
    let result=await supabase.from("conversations").select("*, gigs(title), buyer:profiles!conversations_buyer_id_fkey(full_name,avatar_url), seller:profiles!conversations_seller_id_fkey(full_name,avatar_url)").eq("buyer_id",session.user.id).eq("seller_id",gig.seller_id).eq("gig_id",gig.id).maybeSingle();
    if (!result.data && !result.error) result=await supabase.from("conversations").insert({buyer_id:session.user.id,seller_id:gig.seller_id,gig_id:gig.id,last_message:"Conversation started"}).select("*, gigs(title), buyer:profiles!conversations_buyer_id_fkey(full_name,avatar_url), seller:profiles!conversations_seller_id_fkey(full_name,avatar_url)").single();
    if (result.error) show(result.error.message);
    else { setSelectedGig(null); setPage("messages"); await loadConversation(result.data); await loadInbox(); }
    setBusy(false);
  };

  const sendConversationMessage = async e => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;
    const body=messageText.trim();
    const {error}=await supabase.from("messages").insert({conversation_id:activeConversation.id,sender_id:session.user.id,body});
    if (error) show(error.message);
    else { setMessageText(""); await supabase.from("conversations").update({last_message:body,updated_at:new Date().toISOString()}).eq("id",activeConversation.id); await loadConversation(activeConversation); await loadInbox(); }
  };

  const sendCustomOffer = async e => {
    e.preventDefault();
    if (!activeConversation || activeConversation.seller_id!==session.user.id) return;
    const title=offerForm.title.trim(), description=offerForm.description.trim();
    const amount=Number(offerForm.amount), deliveryDays=Number(offerForm.delivery_days);
    if(title.length<3 || description.length<10) return show("Add a clear title and at least 10 characters describing the work.");
    if(!Number.isFinite(amount)||amount<1||!Number.isInteger(deliveryDays)||deliveryDays<1||deliveryDays>365) return show("Enter a valid price and delivery time.");
    const {error}=await supabase.from("custom_offers").insert({conversation_id:activeConversation.id,seller_id:session.user.id,buyer_id:activeConversation.buyer_id,title,description,amount,delivery_days:deliveryDays});
    if (error) show(error.message);
    else { setOfferForm({title:"",description:"",amount:"",delivery_days:"3"}); show("Custom offer sent."); await supabase.from("conversations").update({last_message:"Custom offer sent",updated_at:new Date().toISOString()}).eq("id",activeConversation.id); await loadConversation(activeConversation); await loadInbox(); }
  };

  const respondToOffer = async (offer,status) => {
    if(!session?.user || offer.buyer_id!==session.user.id || offer.status!=="pending" || !["accepted","declined"].includes(status)) return;
    setBusy(true);
    let orderId=null;
    if(status==="accepted"){
      const {data,error}=await supabase.rpc("accept_custom_offer",{p_offer_id:offer.id});
      if(error){show(error.message);setBusy(false);return;}
      orderId=data;
    }else{
      const {data,error}=await supabase.from("custom_offers").update({status:"declined"}).eq("id",offer.id).eq("buyer_id",session.user.id).eq("status","pending").select("id").maybeSingle();
      if(error){show(error.message);setBusy(false);return;}
      if(!data){show("This offer has already been answered.");await loadConversation(activeConversation);setBusy(false);return;}
    }
    const note=status==="accepted"?"Custom offer accepted. Order created: "+orderId:"Custom offer declined: "+offer.title;
    const messageResult=await supabase.from("messages").insert({conversation_id:activeConversation.id,sender_id:session.user.id,body:note});
    await supabase.from("conversations").update({last_message:note,updated_at:new Date().toISOString()}).eq("id",activeConversation.id);
    if(status==="accepted"){
      await loadOrders();
      show("Offer accepted. Your order has been created.");
    }else show("Offer declined.");
    await loadConversation(activeConversation); await loadInbox();
    if(messageResult.error) show("Your response was saved, but the chat update could not be sent.");
    setBusy(false);
  };

  const sendMessage = async e => {
    e.preventDefault();
    if (!messageText.trim() || !activeOrder) return;
    const { error } = await supabase.from("messages").insert({ order_id:activeOrder.id, sender_id:session.user.id, body:messageText.trim() });
    if (error) show(error.message);
    else { setMessageText(""); loadMessages(activeOrder); }
  };

  const submitReview = async (e, order) => {
    e.preventDefault();
    const { error } = await supabase.from("reviews").insert({
      order_id:order.id, buyer_id:session.user.id,
      seller_id:order.seller_id, rating:Number(reviewForm.rating), comment:reviewForm.comment
    });
    if (error) show(error.message); else { show("Review submitted."); setReviewForm({rating:"5",comment:""}); }
  };

  useEffect(() => {
    if (!activeConversation?.id || !session?.user) return;
    const channel=supabase.channel('conversation-'+activeConversation.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:'conversation_id=eq.'+activeConversation.id},()=>{loadConversation(activeConversation);loadInbox();})
      .on('postgres_changes',{event:'*',schema:'public',table:'custom_offers',filter:'conversation_id=eq.'+activeConversation.id},()=>loadConversation(activeConversation))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },[activeConversation?.id,session?.user?.id]);

  useEffect(() => {
    if (!activeOrder?.id || !session?.user) return;
    const channel=supabase.channel("order-"+activeOrder.id).on("postgres_changes",{event:"*",schema:"public",table:"messages",filter:"order_id=eq."+activeOrder.id},async()=>{
      const {data,error}=await supabase.from("messages").select("*, profiles(full_name)").eq("order_id",activeOrder.id).order("created_at");
      if(!error)setMessages(data||[]); await loadInbox();
    }).subscribe();
    return ()=>{supabase.removeChannel(channel);};
  },[activeOrder?.id,session?.user?.id]);

  const myGigs = sellerGigs;
  const myOrders = orders.filter(o => o.buyer_id === session?.user?.id || o.seller_id === session?.user?.id);
  const sellerOrders = myOrders.filter(o => o.seller_id === session?.user?.id);
  const buyerOrders = myOrders.filter(o => o.buyer_id === session?.user?.id);
  const profileProgressItems = activeMode === "seller"
    ? [profile?.full_name, profile?.avatar_url, profile?.bio, profile?.professional_title, profile?.country || profile?.city, profile?.skills?.length, profile?.languages?.length]
    : [profile?.full_name, profile?.avatar_url, profile?.bio];
  const profileProgress = Math.round(profileProgressItems.filter(Boolean).length / profileProgressItems.length * 100);
  const recentDashboardActivity = [
    ...myOrders.map(o => ({id:"order-"+o.id,kind:"order",title:o.gigs?.title || "Marketplace service",detail:"Order "+String(o.status||"").replaceAll("_"," "),date:o.updated_at || o.created_at,order:o})),
    ...conversations.map(c => ({id:"conversation-"+c.id,kind:"message",title:c.gigs?.title || "Service discussion",detail:c.last_message || "Conversation started",date:c.updated_at,conversation:c}))
  ].filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const isAdmin = profile?.role === "admin";
  const recentViewedGigs = recentViewedIds.map(id => gigs.find(g => g.id === id)).filter(Boolean).filter(g => g.is_active !== false);
  const inboxNeedle = inboxSearch.trim().toLowerCase();
  const filteredInboxConversations = conversations.filter(c => { const other=c.buyer_id===session?.user?.id?c.seller:c.buyer; return `${other?.full_name||""} ${c.gigs?.title||""} ${c.last_message||""}`.toLowerCase().includes(inboxNeedle); });
  const filteredInboxOrders = myOrders.filter(o => { const other=o.buyer_id===session?.user?.id?o.seller:o.buyer; return `${other?.full_name||""} ${o.gigs?.title||""} ${o.status||""}`.toLowerCase().includes(inboxNeedle); });
  useEffect(() => { if (isAdmin) loadReports(); }, [isAdmin]);
  useEffect(() => { if (selectedGig?.id) { setSelectedPackage(selectedGig.packages?.[0]?.name || "Basic"); setRecentViewedIds(prev => { const next=[selectedGig.id,...prev.filter(id=>id!==selectedGig.id)].slice(0,8); try { localStorage.setItem("skillbridge-recently-viewed",JSON.stringify(next)); } catch {} return next; }); } }, [selectedGig?.id]);
  const packageOptions = selectedGig?.packages?.length ? selectedGig.packages : selectedGig ? [{name:"Basic",description:selectedGig.description,price:selectedGig.price,delivery_days:selectedGig.delivery_days,revisions:0}] : [];
  const activePackage = packageOptions.find(p=>p.name===selectedPackage) || packageOptions[0];

  return <div className="app-shell" lang={language} dir={["ur","pa","ar"].includes(language)?"rtl":"ltr"}>
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")}><span className="brand-mark"><Sparkles size={20}/></span><span className="brand-wordmark"><span>skill<span className="brand-accent">bridge</span></span><small>Made by Yousaf</small></span></button>
      <select className="language-switcher language-switcher-left" aria-label="Choose language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="ur">اردو</option><option value="pa">پنجابی</option><option value="hi">हिन्दी</option><option value="ar">العربية</option><option value="es">Español</option><option value="fr">Français</option><option value="zh">中文</option><option value="tr">Türkçe</option><option value="de">Deutsch</option></select>
      <nav className="desktop-nav">
        <button onClick={() => navigate("home")}>{t.explore}</button>
        {session && <button onClick={() => navigate("orders")}>{t.orders}</button>}
        {session && <button onClick={() => {setActiveOrder(null);setActiveConversation(null);setPage("messages");loadInbox();}}>{t.messages}{unreadMessages>0&&<span className="unread-count">{unreadMessages>9?"9+":unreadMessages}</span>}</button>}
        {session && activeMode==="seller" && <button onClick={() => navigate("my-gigs")}>{t.myServices}</button>}
        {isAdmin && <button onClick={() => navigate("admin")}>Admin</button>}
      </nav>
      <div className="top-actions">
        <button className="icon-btn mobile-only" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button>
        {session ? <>
          <div className="notification-wrap">
            <button className="icon-btn notification-trigger" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(value=>!value)}>
              <Bell size={20}/>{unreadNotifications>0&&<span className="notification-count">{unreadNotifications>9?"9+":unreadNotifications}</span>}
            </button>
            {notificationsOpen&&<div className="notification-dropdown">
              <div className="notification-heading"><strong>Notifications</strong><button onClick={loadNotifications}>Refresh</button></div>
              {notifications.map(item=><button key={item.id} className={"notification-item "+(!item.read_at?"unread":"")} onClick={()=>openNotification(item)}>
                <span className="notification-dot"/><span className="notification-copy"><strong>{item.title}</strong><small>{item.body}</small><time>{new Date(item.created_at).toLocaleString()}</time></span>
              </button>)}
              {!notifications.length&&<div className="notification-empty">You’re all caught up. New messages and order updates will appear here.</div>}
            </div>}
          </div>
          <button className="nav-plain desktop-account-link" onClick={() => navigate("dashboard")}>{t.dashboard}</button>
          <div className="account-menu-wrap">
            <button className="account-trigger" aria-expanded={accountMenu} onClick={() => setAccountMenu(v=>!v)}>
              {profile?.avatar_url ? <img className="avatar account-avatar" src={profile.avatar_url} alt=""/> : <span className="avatar account-avatar">{(profile?.full_name || "U").slice(0,1).toUpperCase()}</span>}
              <span className="account-trigger-name">{profile?.full_name || "My account"}</span><ChevronDown size={16}/>
            </button>
            {accountMenu && <div className="account-dropdown">
              <div className="account-dropdown-user"><strong>{profile?.full_name || "Skill Bridge member"}</strong><small>{session.user.email}</small></div>
              <div className="account-mode-actions"><button onClick={()=>switchMode("buyer")}>{t.buyerMode}</button><button onClick={()=>switchMode("seller")}>{t.sellerMode}</button></div>
              <button onClick={()=>{navigate("profile");setAccountMenu(false)}}><UserCircle size={17}/> {t.profile}</button>
              <button onClick={()=>{navigate("settings");setAccountMenu(false)}}><Settings size={17}/> Settings</button>
              <button onClick={()=>{navigate("dashboard");setAccountMenu(false)}}><LayoutDashboard size={17}/> Dashboard</button>
              {isAdmin && <button onClick={()=>{navigate("admin");setAccountMenu(false)}}><ShieldCheck size={17}/> Admin moderation</button>}
              <button onClick={()=>{navigate("saved");setAccountMenu(false)}}><Bookmark size={17}/> {t.saved}</button>
              {activeMode==="seller" && <button onClick={()=>{navigate("portfolio");setAccountMenu(false)}}><BriefcaseBusiness size={17}/> {t.portfolio}</button>}
              <button onClick={()=>{navigate("orders");setAccountMenu(false)}}><PackageCheck size={17}/> {t.orders}</button>
              {activeMode==="seller" && <button onClick={()=>{navigate("my-gigs");setAccountMenu(false)}}><BriefcaseBusiness size={17}/> {t.myServices}</button>}
              <button className="dropdown-logout" onClick={()=>{setAccountMenu(false);signOut()}}><LogOut size={17}/> {t.logout}</button>
            </div>}
          </div>
        </> : <div className="account-menu-wrap guest-account-wrap">
          <button className="icon-btn guest-account-trigger" aria-label="Login or sign up" title="Login or sign up" aria-expanded={accountMenu} onClick={() => setAccountMenu(v=>!v)}><UserRound size={22}/></button>
          {accountMenu && <div className="account-dropdown guest-account-dropdown">
            <button onClick={()=>{setAuthMode("login");setAccountMenu(false);navigate("auth");}}><UserRound size={17}/> {t.login}</button>
            <button onClick={()=>{setAuthMode("signup");setAccountMenu(false);navigate("auth");}}><Plus size={17}/> {t.join}</button>
          </div>}
        </div>}
        <button className={"assistant-launcher "+(assistantOpen?"assistant-launcher-active":"")} aria-label="Open Skill Bridge voice assistant" title="Skill Bridge AI Assistant" onClick={()=>{setAssistantOpen(v=>!v);if(!assistantOpen)speakAssistant("Assalam-o-Alaikum! Main Skill Bridge assistant hoon. Mic dabaa kar apna kaam batayein.");}}><Bot size={20}/><span>AI</span></button>
        <form className="header-search" onSubmit={e=>{e.preventDefault();navigate("home");document.getElementById("explore")?.scrollIntoView({behavior:"smooth"});}}>
          <Search size={17}/><input aria-label="Search services" value={search} onChange={e=>setSearch(e.target.value)} placeholder="What service do you need?"/><button type="submit">Search</button>
        </form>
      </div>
    </header>
    {assistantOpen && <section className="voice-assistant-panel" aria-label="Skill Bridge voice assistant">
      <div className="voice-assistant-head"><span className="voice-assistant-avatar"><Bot size={21}/></span><div><strong>Skill Bridge Assistant</strong><small>{assistantListening?"Listening…":assistantBusy?"AI soch raha hai…":"AI voice assistant · Hugging Face"}</small></div><button aria-label="Close assistant" onClick={()=>{setAssistantOpen(false);recognitionRef.current?.abort();window.speechSynthesis?.cancel();}}><X size={18}/></button></div>
      <div className="voice-assistant-message"><Volume2 size={16}/><p>{assistantReply}</p></div>
      {assistantTranscript&&<div className="voice-assistant-transcript"><small>You said</small><span>{assistantTranscript}</span></div>}
      <div className="voice-assistant-controls"><select aria-label="Assistant voice language" value={assistantLanguage} onChange={e=>setAssistantLanguage(e.target.value)}><option value="ur-PK">Urdu</option><option value="hi-IN">Hindi</option><option value="en-US">English</option></select><button className={assistantListening?"listening":""} onClick={beginVoiceCapture} disabled={assistantListening||assistantBusy}>{assistantBusy?<Sparkles size={18}/>:assistantListening?<MicOff size={18}/>:<Mic size={18}/>} {assistantBusy?"Thinking…":assistantListening?"Listening…":"Tap to speak"}</button></div>
      <form className="voice-assistant-text" onSubmit={e=>{e.preventDefault();const value=assistantText.trim();if(value&&!assistantBusy){setAssistantTranscript(value);setAssistantText("");handleVoiceCommand(value);}}}>
        <input aria-label="Type to assistant" value={assistantText} onChange={e=>setAssistantText(e.target.value)} placeholder="Mic na chale to yahan likhein…"/>
        <button type="submit" disabled={!assistantText.trim()||assistantBusy}><Send size={16}/></button>
      </form>
      <div className="voice-assistant-hints">AI model natural Urdu, Roman Urdu, Punjabi, Hindi aur English samajhne ki koshish karega. Password ya private information share na karein.</div>
    </section>}
    {page === "home" && <nav className="marketplace-subnav" aria-label="Popular categories">
      {categories.slice(1,11).map(c=><button key={c} className={category===c?"selected":""} onClick={()=>{setCategory(c);navigate("home");document.getElementById("explore")?.scrollIntoView({behavior:"smooth"});}}>{c}</button>)}
    </nav>}
    {mobileMenu && <div className="mobile-menu"><button onClick={()=>navigate("home")}>{t.explore}</button>{session ? <><button onClick={()=>navigate("dashboard")}>{t.dashboard}</button><button onClick={()=>navigate("profile")}>{t.profile}</button><button onClick={()=>navigate("settings")}>Settings</button><button onClick={()=>navigate("saved")}>{t.saved}</button><button onClick={()=>navigate("orders")}>{t.orders}</button>{activeMode==="seller"&&<button onClick={()=>navigate("portfolio")}>{t.portfolio}</button>}<button onClick={()=>{setActiveOrder(null);setActiveConversation(null);setPage("messages");loadInbox();}}>{t.messages} {unreadMessages>0&&"("+unreadMessages+")"}</button>{activeMode==="seller"&&<button onClick={()=>navigate("my-gigs")}>{t.myServices}</button>}{isAdmin&&<button onClick={()=>navigate("admin")}>Admin moderation</button>}<button onClick={signOut}>{t.logout}</button></> : <><button onClick={()=>{setAuthMode("login");navigate("auth")}}>{t.login}</button><button onClick={()=>{setAuthMode("signup");navigate("auth")}}>{t.join}</button></>}</div>}
    {demoMode && <div className="setup-banner"><span><Sparkles size={15}/> Setup required: connect your free Supabase project to enable real multi-user features.</span><button onClick={()=>show("README.md mein Android setup ke simple steps diye gaye hain.")}>How to connect</button></div>}
    {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></div>}

    {page === "home" && <>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot"></span> {t.heroEyebrow}</div>
          <h1>{t.heroTitle}<br/><span>{t.heroTitle2}</span></h1>
          <p>{t.heroText}</p>
          <div className="hero-search"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search any skill, service or job..."/><button onClick={()=>document.getElementById("explore")?.scrollIntoView({behavior:"smooth"})}>Search</button></div>
          <div className="popular">Popular: <button onClick={()=>{setSearch("electrician");setCategory("Electrical Work")}}>Electrician</button><button onClick={()=>{setSearch("logo");setCategory("Graphics & Design")}}>Logo design</button><button onClick={()=>{setSearch("plumber");setCategory("Plumbing")}}>Plumber</button><button onClick={()=>{setSearch("website");setCategory("Programming & Tech")}}>Website</button></div>
          <div className="hero-stats"><div><strong>Digital + Local</strong><span>all kinds of services</span></div><div><strong>One platform</strong><span>for workers and customers</span></div><div><strong>Simple to use</strong><span>for everyone</span></div></div>
        </div>
        <div className="hero-orb orb-one"></div><div className="hero-orb orb-two"></div>
      </section>
      <section className="choice-section">
        <div className="choice-heading"><span className="eyebrow muted">{t.getStarted}</span><h2>{t.whatDo}</h2><p>Choose how you want to use Skill Bridge.</p></div>
        <div className="choice-grid">
          <button className="choice-card" onClick={()=>{if(session){switchMode("seller");}else{setAuthForm(v=>({...v,role:"seller"}));setAuthMode("signup");navigate("auth");}}}>
            <span className="choice-icon"><BriefcaseBusiness size={25}/></span><span className="choice-copy"><strong>{t.findWork}</strong><small>Show your skills and let customers discover your services.</small></span><ArrowRight className="choice-arrow"/>
          </button>
          <button className="choice-card" onClick={()=>{if(session){switchMode("buyer");}else{setAuthForm(v=>({...v,role:"buyer"}));setAuthMode("signup");navigate("auth");}}}>
            <span className="choice-icon"><UserRound size={25}/></span><span className="choice-copy"><strong>{t.hireSomeone}</strong><small>Find skilled people for digital tasks and practical work.</small></span><ArrowRight className="choice-arrow"/>
          </button>
        </div>
      </section>
      <section className="trust-strip"><span><ShieldCheck size={18}/> For every kind of work</span><span><CheckCircle2 size={18}/> Clear work agreements</span><span><MessageCircle size={18}/> Buyer-seller messaging</span></section>
      <main className="content" id="explore">
        <div className="section-heading"><div><div className="eyebrow muted">{t.discover}</div><h2>{t.exploreAll}</h2><p>Browse digital skills, skilled trades and everyday services.</p></div><button className="outline-btn" onClick={()=>{setSearch("");setCategory("All");setLocationFilter("");setMinBudget("");setMaxBudget("");setDeliveryFilter("any");setSortBy("newest");}}><Filter size={16}/> Clear filters</button></div>
        <div className="category-row">{categories.map(c=><button key={c} className={category===c?"category active":"category"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="marketplace-filters"><label>City or country<input value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} placeholder="e.g. Lahore"/></label><label>Min budget (PKR)<input type="number" min="0" value={minBudget} onChange={e=>setMinBudget(e.target.value)} placeholder="Any"/></label><label>Max budget (PKR)<input type="number" min="0" value={maxBudget} onChange={e=>setMaxBudget(e.target.value)} placeholder="Any"/></label><label>Delivery time<select value={deliveryFilter} onChange={e=>setDeliveryFilter(e.target.value)}><option value="any">Any time</option><option value="1">Within 1 day</option><option value="3">Within 3 days</option><option value="7">Within 7 days</option></select></label><label>Sort by<select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
        <div className="gig-grid">{filteredGigs.map(g=><GigCard key={g.id} gig={g} onImpression={trackGigImpression} onClick={()=>{trackGigClick(g);setPage("home");setOrderDetails("");setSelectedGig(g);}}/> )}</div>
        {!filteredGigs.length && <Empty icon={<BriefcaseBusiness/>} title="No services found yet" text={demoMode?"The marketplace is getting ready.":"Try another search or category. You can be the first to list a service."}/>}
        {activeMode==="seller" && <div className="join-banner"><div><h3>Ready to offer your skills?</h3><p>Create a service listing and let buyers discover what you do best.</p></div><button className="btn btn-dark" onClick={()=>navigate("create-gig")}><Plus size={17}/> Create a gig</button></div>}
      </main>
    </>}

    {page === "auth" && <main className="narrow-page"><div className="auth-card"><div className="auth-logo"><span className="brand-mark"><Sparkles size={20}/></span></div><div className="eyebrow muted">WELCOME TO SKILL BRIDGE</div><h2>{authMode==="signup"?"Create your account":"Welcome back"}</h2><p className="subtext">{authMode==="signup"?"Join the community of buyers and independent sellers.":"Log in to manage your projects and services."}</p>
      {signupConfirmationPending && authMode==="login" && <div className="auth-mode-note" role="status"><strong>Check your email to confirm your account.</strong><p>After confirming, return here and log in with the same email and password. If you opened the confirmation link on your phone, your laptop will not sign in automatically — sign in on this laptop after verification.</p></div>}
      <form onSubmit={signUpOrIn} className="stack-form">
        {authMode==="signup" && <><label>Full name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label><p className="auth-mode-note">One account gives you both Buyer and Seller modes. You can switch anytime.</p></>}
        <label>Email address<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength="6" type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 6 characters"/></label>
        <button className="btn btn-dark full" disabled={busy}>{busy?"Please wait...":authMode==="signup"?"Create account":"Log in"} <ArrowRight size={17}/></button>
      </form>
      <div className="switch-auth">{authMode==="signup"?"Already have an account?":"New to Skill Bridge?"} <button onClick={()=>{setAuthMode(authMode==="signup"?"login":"signup");if(authMode==="login")setSignupConfirmationPending(false);}}>{authMode==="signup"?"Log in":"Create an account"}</button></div>
      <button className="back-link" onClick={()=>navigate("home")}>← Back to marketplace</button>
    </div></main>}

    {page === "create-gig" && <main className="narrow-page"><div className="form-panel"><div className="eyebrow muted">SELLER STUDIO</div><h2>Create a new gig</h2><p className="subtext">Describe your service clearly so buyers know what they will receive.</p><form className="stack-form" onSubmit={createGig}>
      <label>Gig title<input required maxLength="90" value={gigForm.title} onChange={e=>setGigForm({...gigForm,title:e.target.value})} placeholder="I will design a modern business logo"/></label>
      <label>Category<select value={gigForm.category} onChange={e=>setGigForm({...gigForm,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Description<textarea required rows="5" value={gigForm.description} onChange={e=>setGigForm({...gigForm,description:e.target.value})} placeholder="Explain your service, deliverables, and what you need from the buyer."/></label><div className="gig-image-field"><label>Gig cover image <small>Optional · choose a photo directly from your phone gallery</small></label><label className="gig-image-picker"><Camera size={17}/>{gigImageBusy?"Uploading image…":"Choose from Gallery"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>uploadGigImage(e,false)} disabled={gigImageBusy}/></label>{gigForm.image_url&&<div className="gig-image-preview"><img src={gigForm.image_url} alt="Gig cover preview"/><button type="button" className="outline-btn danger-outline" onClick={()=>setGigForm(prev=>({...prev,image_url:""}))}>Remove image</button></div>}</div>
      <div className="two-fields"><label>Basic package price (PKR)<input required type="number" min="1" value={gigForm.price} onChange={e=>setGigForm({...gigForm,price:e.target.value})} placeholder="1500"/></label><label>Basic delivery days<input required type="number" min="1" max="60" value={gigForm.delivery_days} onChange={e=>setGigForm({...gigForm,delivery_days:e.target.value})}/></label></div>
      <section className="package-builder"><div><h3>Service packages</h3><p>Basic is required. Standard and Premium are optional upgrades.</p></div>{extraPackages.map((p,i)=><div className="package-builder-card" key={p.name}><strong>{p.name} package</strong><label>What is included?<textarea rows="2" value={p.description} onChange={e=>updateExtraPackage(i,"description",e.target.value)} placeholder={i===0?"More features than Basic...":"Complete premium service..."}/></label><div className="two-fields"><label>Price (PKR)<input type="number" min="1" value={p.price} onChange={e=>updateExtraPackage(i,"price",e.target.value)} placeholder="Optional"/></label><label>Delivery days<input type="number" min="1" max="365" value={p.delivery_days} onChange={e=>updateExtraPackage(i,"delivery_days",e.target.value)}/></label></div><label>Revisions<input type="number" min="0" max="99" value={p.revisions} onChange={e=>updateExtraPackage(i,"revisions",e.target.value)}/></label></div>)}</section>
      <label>FAQs <small>One per line, format: Question | Answer</small><textarea rows="4" value={faqText} onChange={e=>setFaqText(e.target.value)} placeholder={"Do you provide source files? | Yes, source files are included.\nCan I request changes? | Yes, revisions depend on the package."}/></label>
      <label>What the buyer must provide <small>Write one requirement per line</small><textarea rows="3" value={requirementsText} onChange={e=>setRequirementsText(e.target.value)} placeholder={"Project details\nReference files or examples\nPreferred colours or style"}/></label>
      <button className="btn btn-dark full" disabled={busy}>{busy?"Publishing...":"Publish service"} <ArrowRight size={17}/></button>
    </form></div></main>}

    {page === "my-gigs" && <main className="content page-content"><div className="section-heading"><div><div className="eyebrow muted">SELLER STUDIO</div><h2>My gigs</h2><p>Manage the services you have published.</p></div><button className="btn btn-dark" onClick={()=>navigate("create-gig")}><Plus size={17}/> New gig</button></div>{editingGigId && <form className="dashboard-panel gig-edit-panel" onSubmit={saveGigEdit}><div className="dashboard-panel-heading"><div><h3>Edit service</h3><p>Update the information buyers see.</p></div><button type="button" className="back-link" onClick={()=>setEditingGigId(null)}>Cancel</button></div><label>Title<input required maxLength="90" value={editGigForm.title} onChange={e=>setEditGigForm({...editGigForm,title:e.target.value})}/></label><label>Category<select value={editGigForm.category} onChange={e=>setEditGigForm({...editGigForm,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>Description<textarea required rows="4" value={editGigForm.description} onChange={e=>setEditGigForm({...editGigForm,description:e.target.value})}/></label><div className="gig-image-field"><label>Gig cover image <small>Choose a new photo from your phone gallery, or keep the current one.</small></label><label className="gig-image-picker"><Camera size={17}/>{editGigImageBusy?"Uploading image…":"Choose from Gallery"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>uploadGigImage(e,true)} disabled={editGigImageBusy}/></label>{editGigForm.image_url&&<div className="gig-image-preview"><img src={editGigForm.image_url} alt="Gig cover preview"/><button type="button" className="outline-btn danger-outline" onClick={()=>setEditGigForm(prev=>({...prev,image_url:""}))}>Remove image</button></div>}</div><div className="two-fields"><label>Basic price (PKR)<input required type="number" min="1" value={editGigForm.price} onChange={e=>setEditGigForm({...editGigForm,price:e.target.value})}/></label><label>Basic delivery days<input required type="number" min="1" max="60" value={editGigForm.delivery_days} onChange={e=>setEditGigForm({...editGigForm,delivery_days:e.target.value})}/></label></div><section className="package-builder"><div><h3>Standard and Premium packages</h3><p>Leave price blank to remove an optional package.</p></div>{editExtraPackages.map((p,i)=><div className="package-builder-card" key={p.name}><strong>{p.name}</strong><label>Included work<textarea rows="2" value={p.description} onChange={e=>updateEditPackage(i,"description",e.target.value)}/></label><div className="two-fields"><label>Price (PKR)<input type="number" min="1" value={p.price} onChange={e=>updateEditPackage(i,"price",e.target.value)}/></label><label>Delivery days<input type="number" min="1" max="365" value={p.delivery_days} onChange={e=>updateEditPackage(i,"delivery_days",e.target.value)}/></label></div><label>Revisions<input type="number" min="0" max="99" value={p.revisions} onChange={e=>updateEditPackage(i,"revisions",e.target.value)}/></label></div>)}</section><label>FAQs <small>One per line: Question | Answer</small><textarea rows="3" value={editFaqText} onChange={e=>setEditFaqText(e.target.value)}/></label><label>Buyer requirements <small>One per line</small><textarea rows="3" value={editRequirementsText} onChange={e=>setEditRequirementsText(e.target.value)}/></label><button className="btn btn-dark" disabled={busy}><Save size={16}/> Save changes</button></form>}<div className="seller-gig-manager">{myGigs.map(g=><article className="seller-gig-row" key={g.id}><div className="seller-gig-icon"><BriefcaseBusiness size={20}/></div><div className="seller-gig-copy"><strong>{g.title}</strong><small>{g.category} · {g.delivery_days} day delivery · {money(g.price)}</small></div><span className={g.is_active?"service-live":"service-paused"}><i/>{g.is_active?"Active":"Paused"}</span><div className="seller-gig-actions"><button className="outline-btn" onClick={()=>{setEditingGigId(g.id);setEditGigForm({title:g.title,description:g.description,category:g.category,price:String(g.price),delivery_days:String(g.delivery_days),image_url:g.image_url||""});const ps=g.packages||[];setEditExtraPackages(["Standard","Premium"].map((name,i)=>ps.find(p=>p.name===name)||{name,description:"",price:"",delivery_days:i===0?"5":"7",revisions:i===0?"2":"3"}));setEditFaqText((g.faqs||[]).map(f=>f.question+" | "+f.answer).join("\n"));setEditRequirementsText((g.requirements||[]).join("\n"));}}><Settings size={14}/> Edit</button><button className="outline-btn" onClick={()=>toggleGigStatus(g)}>{g.is_active?"Pause":"Activate"}</button><button className="outline-btn danger-outline" onClick={()=>{if(window.confirm("Permanently delete this service?"))deleteGig(g);}}><Trash2 size={14}/> Delete</button></div></article>)}</div>{!myGigs.length&&<Empty icon={<BriefcaseBusiness/>} title="No services yet" text="Create your first service listing to appear in the marketplace."/>}</main>}

    {page === "orders" && <main className="content page-content"><div className="eyebrow muted">WORKSPACE</div><h2>Your orders</h2><p className="subtext">Track purchases and manage projects from one place.</p><div className="orders-list">{myOrders.map(o=><OrderCard key={o.id} order={o} userId={session?.user?.id} onUpdate={updateOrder} onRevision={requestRevision} onMessage={loadMessages} onReview={submitReview} reviewForm={reviewForm} setReviewForm={setReviewForm}/>)}</div>{!myOrders.length&&<Empty icon={<PackageCheck/>} title="No orders yet" text="When you place or receive an order, it will appear here."/>}</main>}


    {page === "profile" && <main className="content page-content profile-page">
      <div className="eyebrow muted">YOUR ACCOUNT</div><h2>My profile</h2><p className="subtext">Add a photo and tell people a little about yourself.</p>
      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-avatar-wrap">
            {profile?.avatar_url ? <img className="profile-avatar-large" src={profile.avatar_url} alt="Your profile"/> : <div className="profile-avatar-placeholder"><UserCircle size={58}/></div>}
            <label className="avatar-upload-button"><Camera size={16}/>{avatarBusy?"Uploading...":"Change photo"}<input type="file" accept="image/*" onChange={uploadAvatar} disabled={avatarBusy}/></label>
          </div>
          <h3>{profile?.full_name || "Skill Bridge member"}</h3><span className="profile-role-label">{activeMode==="seller"?"Seller account":"Buyer account"}</span>
          <p>{profile?.bio || "Add a short introduction to your profile."}</p>
          <small>JPG, PNG or WEBP · Maximum 3 MB</small>
        </section>
        <section className="profile-edit-card">
          <h3><Settings size={18}/> Edit profile</h3>
          <form className="stack-form" onSubmit={saveProfile}>
            <label>Full name<input required maxLength="80" value={profileForm.full_name} onChange={e=>setProfileForm({...profileForm,full_name:e.target.value})} placeholder="Your full name"/></label>
            <label>Professional title<input maxLength="100" value={profileForm.professional_title} onChange={e=>setProfileForm({...profileForm,professional_title:e.target.value})} placeholder="e.g. Graphic designer / Electrician / Web developer"/></label>
            <label>About me<textarea rows="5" maxLength="1000" value={profileForm.bio} onChange={e=>setProfileForm({...profileForm,bio:e.target.value})} placeholder="Introduce yourself, your experience and the work you do..."/></label>
            {activeMode==="seller" && <>
              <div className="two-fields"><label>Country<input value={profileForm.country} onChange={e=>setProfileForm({...profileForm,country:e.target.value})} placeholder="Pakistan"/></label><label>City<input value={profileForm.city} onChange={e=>setProfileForm({...profileForm,city:e.target.value})} placeholder="Lahore"/></label></div><label>Experience (years)<input type="number" min="0" max="60" value={profileForm.experience_years} onChange={e=>setProfileForm({...profileForm,experience_years:e.target.value})} placeholder="e.g. 3"/></label>
              <label>Skills <small>Separate each skill with a comma</small><input value={profileForm.skills} onChange={e=>setProfileForm({...profileForm,skills:e.target.value})} placeholder="Logo design, Photoshop, Branding"/></label>
              <label>Languages <small>Separate each language with a comma</small><input value={profileForm.languages} onChange={e=>setProfileForm({...profileForm,languages:e.target.value})} placeholder="Urdu, English, Punjabi"/></label>
              <label>Education<input value={profileForm.education} onChange={e=>setProfileForm({...profileForm,education:e.target.value})} placeholder="Qualification, institute (optional)"/></label>
              <label>Certifications<textarea rows="2" value={profileForm.certifications} onChange={e=>setProfileForm({...profileForm,certifications:e.target.value})} placeholder="Certificates or professional training"/></label>
              <label>Website / Portfolio link<input type="url" value={profileForm.website_url} onChange={e=>setProfileForm({...profileForm,website_url:e.target.value})} placeholder="https://..."/></label>
              <label className="availability-toggle"><input type="checkbox" checked={profileForm.availability} onChange={e=>setProfileForm({...profileForm,availability:e.target.checked})}/> Available for new work</label>
            </>}
            <label>Email address<input value={session?.user?.email || ""} readOnly/></label>
            <label>Account modes<input value="Buyer + Seller (same account)" readOnly/></label>
            <button className="btn btn-dark full" disabled={busy}><Save size={17}/>{busy?"Saving...":"Save changes"}</button>
          </form>
        </section>
      </div>
    </main>}

    {page === "settings" && <main className="content page-content settings-page">
      <div className="eyebrow muted">YOUR ACCOUNT</div><h2>Settings</h2><p className="subtext">Manage your account preferences and sign-in details. Profile information stays in the separate Profile section.</p>
      <div className="settings-grid">
        <section className="dashboard-panel settings-panel">
          <div className="dashboard-panel-heading"><div><h3><Settings size={18}/> Preferences</h3><p>Choose the language used across Skill Bridge.</p></div></div>
          <label>Display language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="ur">اردو</option><option value="pa">پنجابی</option><option value="hi">हिन्दी</option><option value="ar">العربية</option><option value="es">Español</option><option value="fr">Français</option><option value="zh">中文</option><option value="tr">Türkçe</option><option value="de">Deutsch</option></select></label>
          <p className="settings-help">Your language choice is saved on this device.</p>
        </section>
        <section className="dashboard-panel settings-panel">
          <div className="dashboard-panel-heading"><div><h3><ShieldCheck size={18}/> Account security</h3><p>Update the email address or password used to sign in.</p></div></div>
          <form className="stack-form" onSubmit={requestEmailChange}>
            <label>Current email<input value={session?.user?.email||""} readOnly/></label>
            <label>New email address<input type="email" required value={settingsEmail} onChange={e=>setSettingsEmail(e.target.value)} placeholder="new-email@example.com"/></label>
            <button className="outline-btn" disabled={busy}>Request email change</button>
          </form>
          <div className="settings-divider"></div>
          <form className="stack-form" onSubmit={updateAccountPassword}>
            <label>New password<input type="password" minLength="6" required value={settingsPassword} onChange={e=>setSettingsPassword(e.target.value)} placeholder="At least 6 characters"/></label>
            <label>Confirm new password<input type="password" minLength="6" required value={settingsPasswordConfirm} onChange={e=>setSettingsPasswordConfirm(e.target.value)} placeholder="Enter it again"/></label>
            <button className="btn btn-dark" disabled={busy}>Update password</button>
          </form>
          <p className="settings-help">Email changes may require confirmation from your new email inbox. Password updates require an active signed-in session.</p>
        </section>
        <section className="dashboard-panel settings-panel">
          <div className="dashboard-panel-heading"><div><h3><UserRound size={18}/> Account information</h3><p>These details are managed in their own sections.</p></div></div>
          <div className="settings-link-row"><div><strong>Public profile</strong><small>Name, photo, bio, skills and availability</small></div><button className="outline-btn" onClick={()=>navigate("profile")}>Open profile <ChevronRight size={15}/></button></div>
          <div className="settings-link-row"><div><strong>Workspace mode</strong><small>Switch between Buyer and Seller workspaces</small></div><div className="mode-switch"><button className={activeMode==="buyer"?"selected":""} onClick={()=>switchMode("buyer")} disabled={busy}>Buyer</button><button className={activeMode==="seller"?"selected":""} onClick={()=>switchMode("seller")} disabled={busy}>Seller</button></div></div>
          <div className="settings-link-row"><div><strong>Saved services</strong><small>Your bookmarked services</small></div><button className="outline-btn" onClick={()=>navigate("saved")}>Open saved <ChevronRight size={15}/></button></div>
          <div className="settings-link-row"><div><strong>Notifications</strong><small>Review messages and order updates from the bell in the top bar</small></div><button className="outline-btn" onClick={()=>{setNotificationsOpen(true);navigate("dashboard");}}>View notifications <ChevronRight size={15}/></button></div>
        </section>
        <section className="dashboard-panel settings-panel settings-danger-zone">
          <div className="dashboard-panel-heading"><div><h3><LogOut size={18}/> Sign out</h3><p>End this session on the current device.</p></div></div>
          <button className="outline-btn danger-outline" onClick={signOut}>Log out of Skill Bridge</button>
        </section>
      </div>
    </main>}

    {page === "seller-profile" && publicSeller && <main className="content page-content public-seller-page"><button className="back-link" onClick={()=>navigate("home")}>← Back to services</button><section className="public-seller-hero"><div className="public-seller-avatar">{publicSeller.avatar_url?<img src={publicSeller.avatar_url} alt=""/>:(publicSeller.full_name||"S").slice(0,1).toUpperCase()}</div><div className="public-seller-info"><div className="eyebrow muted">SKILL BRIDGE SELLER</div><h2>{publicSeller.full_name||"Seller"}</h2><strong>{publicSeller.professional_title||"Independent service provider"}</strong><p>{publicSeller.bio||"This seller has not added an introduction yet."}</p><div className="public-seller-meta"><span>{[publicSeller.city,publicSeller.country].filter(Boolean).join(", ")||"Location not added"}</span><span>{publicSeller.experience_years?publicSeller.experience_years+" years experience":"Experience not listed"}</span><span><Star size={15}/> {publicSellerReviews.length?(publicSellerReviews.reduce((n,r)=>n+Number(r.rating),0)/publicSellerReviews.length).toFixed(1)+" ("+publicSellerReviews.length+" reviews)":"No reviews yet"}</span></div></div>{session?.user?.id!==publicSeller.id&&<button className="btn btn-dark" onClick={()=>{const first=publicSellerGigs[0];if(first)startConversation(first);else show("This seller has no active service to start a conversation from.");}}><MessageCircle size={16}/> Contact seller</button>}</section><section className="public-seller-section"><div className="section-heading"><div><h2>Services</h2><p>Active services offered by this seller.</p></div></div><div className="gig-grid">{publicSellerGigs.map(g=><GigCard key={g.id} gig={g} onImpression={trackGigImpression} onClick={()=>{trackGigClick(g);setSelectedGig(g);setPage("home");}}/> )}</div>{!publicSellerGigs.length&&<Empty icon={<BriefcaseBusiness/>} title="No active services" text="This seller has not published an active service yet."/>}</section><section className="public-seller-section"><div className="section-heading"><div><h2>Portfolio</h2><p>Examples of previous work.</p></div></div><div className="portfolio-grid">{publicSellerPortfolio.map(item=><article className="portfolio-card" key={item.id}><img src={item.image_url} alt={item.title} loading="lazy"/><div><h3>{item.title}</h3><p>{item.description}</p><a href={item.project_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> View project</a></div></article>)}</div>{!publicSellerPortfolio.length&&<p className="subtext">No portfolio projects have been added yet.</p>}</section><section className="public-seller-section"><div className="section-heading"><div><h2>Client reviews</h2><p>Feedback from completed orders.</p></div></div>{publicSellerReviews.map(r=><article className="public-review" key={r.id}><div><strong>{r.buyer?.full_name||"Buyer"}</strong><span><Star size={14}/> {r.rating}/5</span></div><p>{r.comment||"No written comment."}</p><small>{new Date(r.created_at).toLocaleDateString()}</small></article>)}{!publicSellerReviews.length&&<p className="subtext">No reviews yet.</p>}</section></main>}

    {page === "saved" && <main className="content page-content"><div className="section-heading"><div><div className="eyebrow muted">YOUR COLLECTION</div><h2>Saved services</h2><p>Services you bookmarked for later.</p></div><button className="outline-btn" onClick={()=>navigate("home")}>Explore services <ArrowRight size={15}/></button></div><div className="gig-grid">{favoriteGigs.map(g=><GigCard key={g.id} gig={g} onImpression={trackGigImpression} onClick={()=>{setSelectedGig(g);setPage("home");}}/> )}</div>{!favoriteGigs.length&&<Empty icon={<Bookmark/>} title="No saved services yet" text="Open a service and tap Save service to keep it here."/>}</main>}

    {page === "portfolio" && <main className="content page-content"><div className="section-heading"><div><div className="eyebrow muted">SELLER STUDIO</div><h2>My portfolio</h2><p>Show buyers examples of work you have completed.</p></div></div><section className="dashboard-panel portfolio-create"><h3>Add a project</h3><form className="stack-form" onSubmit={addPortfolioItem}><label>Project title<input required maxLength="100" value={portfolioForm.title} onChange={e=>setPortfolioForm({...portfolioForm,title:e.target.value})} placeholder="e.g. Brand identity for a local business"/></label><label>Project description<textarea required rows="3" maxLength="800" value={portfolioForm.description} onChange={e=>setPortfolioForm({...portfolioForm,description:e.target.value})} placeholder="What was the work and what did you deliver?"/></label><label>Project link<input required type="url" value={portfolioForm.project_url} onChange={e=>setPortfolioForm({...portfolioForm,project_url:e.target.value})} placeholder="https://your-project.example"/></label><label>Preview image URL<input required type="url" value={portfolioForm.image_url} onChange={e=>setPortfolioForm({...portfolioForm,image_url:e.target.value})} placeholder="https://.../project-image.jpg"/></label><button className="btn btn-dark" disabled={busy}><Plus size={16}/> Add to portfolio</button></form></section><div className="portfolio-grid">{portfolioItems.map(item=><article className="portfolio-card" key={item.id}><img src={item.image_url} alt={item.title} loading="lazy"/><div><h3>{item.title}</h3><p>{item.description}</p><div className="portfolio-card-actions"><a href={item.project_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> View project</a><button className="outline-btn" onClick={()=>removePortfolioItem(item.id)}><Trash2 size={14}/> Remove</button></div></div></article>)}</div>{!portfolioItems.length&&<Empty icon={<BriefcaseBusiness/>} title="Your portfolio is empty" text="Add your first project above to show buyers what you can do."/>}</main>}

    {page === "dashboard" && <main className="content page-content dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="eyebrow muted">{activeMode==="seller"?"SELLER":"BUYER"} WORKSPACE</div>
          <h2>{profile?.full_name || "Welcome back"}</h2>
          <p>{activeMode==="seller"?"Your business overview, orders and services — all in one place.":"Your projects, purchases and conversations — all in one place."}</p>
        </div>
        <div className="dashboard-welcome-actions">
          <div className="mode-switch"><span>{t.switchWorkspace}</span><button className={activeMode==="buyer"?"selected":""} onClick={()=>switchMode("buyer")} disabled={busy}>{t.buyerMode}</button><button className={activeMode==="seller"?"selected":""} onClick={()=>switchMode("seller")} disabled={busy}>{t.sellerMode}</button></div>
          {activeMode==="seller"
            ? <button className="btn btn-dark" onClick={()=>navigate("create-gig")}><Plus size={17}/> Create a service</button>
            : <button className="btn btn-dark" onClick={()=>navigate("home")}><Search size={17}/> Find a service</button>}
        </div>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-user">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{(profile?.full_name||"U").slice(0,1).toUpperCase()}</span>}
            <div><strong>{profile?.full_name || "Skill Bridge member"}</strong><small>{activeMode==="seller"?"Service provider":"Customer"}</small></div>
          </div>
          <div className="dashboard-side-label">WORKSPACE</div>
          <button className="dashboard-side-link active"><LayoutDashboard size={17}/> Overview</button>
          <button className="dashboard-side-link" onClick={()=>navigate("orders")}><PackageCheck size={17}/> {activeMode==="seller"?"Manage orders":"My purchases"}<ChevronRight size={15}/></button>
          <button className="dashboard-side-link" onClick={()=>{setActiveOrder(null);setActiveConversation(null);navigate("messages");loadInbox();}}><MessageCircle size={17}/> Messages<ChevronRight size={15}/></button>
          <button className="dashboard-side-link" onClick={()=>navigate("saved")}><Bookmark size={17}/> Saved services<ChevronRight size={15}/></button>
          {activeMode==="seller" && <button className="dashboard-side-link" onClick={()=>navigate("portfolio")}><BriefcaseBusiness size={17}/> Portfolio<ChevronRight size={15}/></button>}
          {activeMode==="seller" && <button className="dashboard-side-link" onClick={()=>navigate("my-gigs")}><BriefcaseBusiness size={17}/> My services<ChevronRight size={15}/></button>}
          {activeMode==="seller" && <button className="dashboard-side-link" onClick={()=>navigate("performance")}><Eye size={17}/> Performance<ChevronRight size={15}/></button>}
          {activeMode==="seller" && <button className="dashboard-side-link" onClick={()=>navigate("create-gig")}><Plus size={17}/> Create service<ChevronRight size={15}/></button>}
          <button className="dashboard-side-link" onClick={()=>navigate("profile")}><UserRound size={17}/> Profile<ChevronRight size={15}/></button>
          <button className="dashboard-side-link" onClick={()=>navigate("settings")}><Settings size={17}/> Account settings<ChevronRight size={15}/></button>
          
        </aside>

        <section className="dashboard-main">
          <div className="dashboard-section-heading"><div><h3>Quick overview</h3><p>Your account at a glance. Open a section below to manage its details.</p></div></div>
          {activeMode==="seller" ? <>
            <div className="dashboard-stats">
              <div className="dashboard-stat"><span>My services</span><strong>{myGigs.length}</strong><small><BriefcaseBusiness size={14}/> {myGigs.filter(g=>g.is_active).length} active</small></div>
              <div className="dashboard-stat"><span>Open orders</span><strong>{sellerOrders.filter(o=>!["completed","cancelled"].includes(o.status)).length}</strong><small><PackageCheck size={14}/> {sellerOrders.filter(o=>o.status==="pending").length} new requests</small></div>
              <div className="dashboard-stat"><span>Unread messages</span><strong>{unreadMessages}</strong><small><MessageCircle size={14}/> Conversations</small></div>
              <div className="dashboard-stat"><span>Average rating</span><strong>{sellerReviews.filter(r=>r.seller_id===session?.user?.id).length ? (sellerReviews.filter(r=>r.seller_id===session?.user?.id).reduce((sum,r)=>sum+Number(r.rating||0),0)/sellerReviews.filter(r=>r.seller_id===session?.user?.id).length).toFixed(1) : "—"}</strong><small><Star size={14}/> Based on order reviews</small></div>
            </div>

          </> : <>
            <div className="dashboard-stats buyer-stats">
              <div className="dashboard-stat"><span>Active projects</span><strong>{buyerOrders.filter(o=>!["completed","cancelled"].includes(o.status)).length}</strong><small><Clock3 size={14}/> Work in progress</small></div>
              <div className="dashboard-stat"><span>Orders placed</span><strong>{buyerOrders.length}</strong><small><PackageCheck size={14}/> Your purchases</small></div>
              <div className="dashboard-stat"><span>Saved services</span><strong>{favoriteGigs.length}</strong><small><Bookmark size={14}/> Your shortlist</small></div>
              <div className="dashboard-stat"><span>Unread messages</span><strong>{unreadMessages}</strong><small><MessageCircle size={14}/> Replies waiting</small></div>
            </div>

          </>}

        </section>
      </div>
    </main>}
    
    {page === "performance" && <main className="content page-content">
      <div className="section-heading"><div><div className="eyebrow muted">SELLER STUDIO</div><h2>Service performance</h2><p>Views count when a service card is at least half visible. Clicks count when someone opens it.</p></div><button className="outline-btn" onClick={()=>navigate("dashboard")}>Back to dashboard</button></div>
      <div className="dashboard-stats">
        <div className="dashboard-stat"><span>Total services</span><strong>{myGigs.length}</strong><small>All your listings</small></div>
        <div className="dashboard-stat"><span>Total views</span><strong>{Object.values(gigAnalytics).reduce((n,s)=>n+Number(s.impressions||0),0)}</strong><small>Recorded impressions</small></div>
        <div className="dashboard-stat"><span>Total clicks</span><strong>{Object.values(gigAnalytics).reduce((n,s)=>n+Number(s.clicks||0),0)}</strong><small>Service openings</small></div>
      </div>
      <section className="dashboard-panel dashboard-gig-analytics"><div className="dashboard-panel-heading"><div><h3>Performance by service</h3><p>Compare views, clicks and click-through rate for each listing.</p></div><span className="dashboard-panel-icon"><Eye size={17}/></span></div>{myGigs.length?<div className="gig-analytics-list">{myGigs.map(g=>{const stats=gigAnalytics[g.id]||{impressions:0,clicks:0};const ctr=stats.impressions?((stats.clicks/stats.impressions)*100).toFixed(1):"0.0";return <div className="gig-analytics-row" key={g.id}><div><strong>{g.title}</strong><small>{g.is_active?"Live listing":"Paused listing"}</small></div><span><b>{stats.impressions}</b><small>Views</small></span><span><b>{stats.clicks}</b><small>Clicks</small></span><span><b>{ctr}%</b><small>CTR</small></span></div>;})}</div>:<div className="dashboard-empty"><Eye size={22}/><strong>No service data yet</strong><span>Create a service to start tracking views and clicks.</span><button className="btn btn-dark btn-small" onClick={()=>navigate("create-gig")}>Create a service</button></div>}</section>
    </main>}

    {page === "messages" && <main className="content page-content inbox-page">
      <div className="eyebrow muted">YOUR INBOX</div><h2>Messages</h2><p className="subtext">Talk with buyers and sellers, discuss the work and agree on a price.</p>
      <div className="inbox-layout">
        <aside className="inbox-list"><div className="inbox-list-head"><strong>Inbox</strong><span>{filteredInboxConversations.length+filteredInboxOrders.length}</span></div><input className="inbox-search" aria-label="Search inbox" placeholder="Search people, services or messages..." value={inboxSearch} onChange={e=>setInboxSearch(e.target.value)}/>
          {filteredInboxConversations.map(c=>{const other=c.buyer_id===session?.user?.id?c.seller:c.buyer;return <button key={c.id} className={activeConversation?.id===c.id?"inbox-thread active":"inbox-thread"} onClick={()=>loadConversation(c)}><span className="avatar">{(other?.full_name||"U").slice(0,1).toUpperCase()}</span><span className="inbox-thread-copy"><strong>{other?.full_name||"Member"}</strong><small>{c.gigs?.title||"Service discussion"}</small><small>{c.last_message||"Start a conversation"}</small>{unreadByThread[c.id]>0&&<span className="inbox-unread">{unreadByThread[c.id]>9?"9+":unreadByThread[c.id]}</span>}</span></button>;})}
          {filteredInboxOrders.length>0&&<><div className="inbox-list-head"><strong>Order messages</strong><span>{filteredInboxOrders.length}</span></div>{filteredInboxOrders.map(o=>{const other=o.buyer_id===session?.user?.id?o.seller:o.buyer;return <button key={"order-"+o.id} className={activeOrder?.id===o.id?"inbox-thread active":"inbox-thread"} onClick={()=>loadMessages(o)}><span className="avatar">{(other?.full_name||"U").slice(0,1).toUpperCase()}</span><span className="inbox-thread-copy"><strong>{other?.full_name||"Member"}</strong><small>{o.gigs?.title||"Marketplace order"}</small><small>Order · {o.status.replaceAll("_"," ")}</small>{unreadByOrder[o.id]>0&&<span className="inbox-unread">{unreadByOrder[o.id]>9?"9+":unreadByOrder[o.id]}</span>}</span></button>;})}</>}
          {!filteredInboxConversations.length&&!filteredInboxOrders.length&&<div className="inbox-empty">{inboxNeedle?"No matching conversations. Try another search.":"No conversations yet. Open a gig and contact its seller."}</div>}
        </aside>
        <section className="inbox-chat">{activeConversation ? <>
          <div className="inbox-chat-head"><div><strong>{(activeConversation.buyer_id===session?.user?.id?activeConversation.seller:activeConversation.buyer)?.full_name||"Member"}</strong><small>{activeConversation.gigs?.title||"Service discussion"}</small></div><span className="seller-tag">Inbox</span></div>
          <div className="inbox-chat-body">{messages.map(m=><div key={m.id} className={m.sender_id===session?.user?.id?"chat-msg own":"chat-msg"}><strong>{m.profiles?.full_name||(m.sender_id===session?.user?.id?"You":"Member")}</strong><p>{m.body}</p><small className="chat-msg-meta"><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time>{m.sender_id===session?.user?.id&&<span className={m.read_at?"chat-read-status seen":"chat-read-status"}>{m.read_at?"Seen":"Sent"}</span>}</small></div>)}{!messages.length&&<div className="empty-chat">Say hello and discuss the work.</div>}
            {conversationOffers.map(o=><div className={"custom-offer-card offer-"+o.status} key={o.id}><div className="offer-card-top"><div className="eyebrow muted">CUSTOM OFFER</div><span className={"offer-status "+o.status}>{o.status==="pending"?"Awaiting response":o.status==="accepted"?"Accepted":"Declined"}</span></div><h3>{o.title}</h3><p>{o.description}</p><div className="custom-offer-meta"><strong>{money(o.amount)}</strong><span>{o.delivery_days} days delivery</span></div>{o.status==="pending"&&o.buyer_id===session?.user?.id&&<div className="offer-actions"><button type="button" className="outline-btn" onClick={()=>respondToOffer(o,"declined")}>Decline</button><button type="button" className="btn btn-dark btn-small" onClick={()=>respondToOffer(o,"accepted")}>Accept offer</button></div>}{o.status==="accepted"&&<div className="offer-disclaimer">{o.order_id?<><strong>Order created</strong><span> · No payment has been taken.</span><button type="button" className="text-action" onClick={()=>navigate("orders")}>View order <ArrowRight size={14}/></button></>:<>Offer accepted. Check your Orders for the new order.</>}</div>}</div>)}
          </div>
          {activeConversation.seller_id===session?.user?.id&&<form className="custom-offer-form" onSubmit={sendCustomOffer}><strong>Send a custom offer</strong><small className="offer-form-hint">Agree on the work, price and delivery time here. When the buyer accepts, an order is created and appears in Orders.</small><div className="two-fields"><input required placeholder="Offer title" value={offerForm.title} onChange={e=>setOfferForm({...offerForm,title:e.target.value})}/><input required type="number" min="1" placeholder="Price (PKR)" value={offerForm.amount} onChange={e=>setOfferForm({...offerForm,amount:e.target.value})}/></div><textarea required rows="2" placeholder="Describe the work..." value={offerForm.description} onChange={e=>setOfferForm({...offerForm,description:e.target.value})}/><div className="offer-send-row"><label>Delivery days<input required type="number" min="1" max="365" value={offerForm.delivery_days} onChange={e=>setOfferForm({...offerForm,delivery_days:e.target.value})}/></label><button className="outline-btn">Send offer</button></div></form>}
          <form className="chat-compose" onSubmit={sendConversationMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Write a message..." required/><button className="btn btn-dark"><Send size={17}/></button></form>
        </> : activeOrder ? <><div className="inbox-chat-head"><div><strong>{(activeOrder.buyer_id===session?.user?.id?activeOrder.seller:activeOrder.buyer)?.full_name||"Member"}</strong><small>{activeOrder.gigs?.title||"Order conversation"} · {activeOrder.status.replaceAll("_"," ")}</small></div><span className="seller-tag">Order chat</span></div><div className="inbox-chat-body">{messages.map(m=><div key={m.id} className={m.sender_id===session?.user?.id?"chat-msg own":"chat-msg"}><strong>{m.profiles?.full_name||(m.sender_id===session?.user?.id?"You":"Member")}</strong><p>{m.body}</p><small className="chat-msg-meta"><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time>{m.sender_id===session?.user?.id&&<span className={m.read_at?"chat-read-status seen":"chat-read-status"}>{m.read_at?"Seen":"Sent"}</span>}</small></div>)}{!messages.length&&<div className="empty-chat">No order messages yet. Send an update to the other person.</div>}</div><form className="chat-compose" onSubmit={sendMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Write an order message..." required/><button className="btn btn-dark"><Send size={17}/></button></form></> : <div className="inbox-placeholder"><MessageCircle size={34}/><h3>Select a conversation</h3><p>Your messages and custom offers will appear here.</p></div>}</section>
      </div>
    </main>}

    {page === "admin" && (isAdmin ? <main className="content page-content"><div className="eyebrow muted">ADMINISTRATION</div><h2>Trust & safety</h2><p className="subtext">Review user reports. Three distinct reports against one account automatically move its cases into investigation.</p><div className="dashboard-stats"><div className="dashboard-stat"><span>Reports received</span><strong>{reports.length}</strong><small>All visible reports</small></div><div className="dashboard-stat"><span>Under investigation</span><strong>{reports.filter(r=>r.status==="investigating").length}</strong><small>Threshold reached or manually flagged</small></div><div className="dashboard-stat"><span>Pending review</span><strong>{reports.filter(r=>r.status==="pending").length}</strong><small>Awaiting moderation</small></div></div><section className="dashboard-panel moderation-panel"><div className="dashboard-panel-heading"><div><h3>Reported accounts and services</h3><p>Complaints are reviewed as evidence, not treated as proof.</p></div><button className="outline-btn" onClick={loadReports}>Refresh</button></div>{reports.map(r=>{const count=reports.filter(x=>x.reported_user_id===r.reported_user_id).length;return <article className="report-row" key={r.id}><div className="report-main"><strong>{r.reported?.full_name||"Member"} {count>=3&&<span className="investigation-flag">3+ reports</span>} {r.reported?.account_status==="banned"&&<span className="report-status dismissed">Banned</span>}</strong><small>{r.gigs?.title||"Account report"} · {r.reason.replaceAll("_"," ")} · {new Date(r.created_at).toLocaleDateString()}</small><p>{r.details}</p><small>Reported by {r.reporter?.full_name||"Member"}</small></div><div className="report-actions"><span className={"report-status "+r.status}>{r.status}</span>{r.status!=="resolved"&&<button className="outline-btn" onClick={()=>updateReport(r,"resolved")}>Resolve</button>}{r.status!=="dismissed"&&<button className="outline-btn" onClick={()=>updateReport(r,"dismissed")}>Dismiss</button>}{r.status==="investigating"&&r.reported?.account_status!=="banned"&&<button className="outline-btn danger-outline" onClick={()=>permanentlyBanUser(r)}>Permanently ban</button>}</div></article>;})}{!reports.length&&<Empty icon={<ShieldCheck/>} title="No reports received" text="When users report a service or account, it will appear here for review."/>}</section><h3 className="list-title">Recent services</h3>{gigs.slice(0,10).map(g=><div className="admin-row" key={g.id}><div><strong>{g.title}</strong><small>{g.profiles?.full_name} · {g.category}</small></div><strong>{money(g.price)}</strong><button className="outline-btn" onClick={async()=>{const {error}=await supabase.from("gigs").update({is_active:false}).eq("id",g.id);if(error)show(error.message);else{show("Service deactivated.");loadGigs();}}}>Deactivate</button></div>)}</main> : <main className="content page-content"><h2>Admin access required</h2><p className="subtext">This area is only available to authorized Skill Bridge administrators.</p></main>)}

    {selectedGig && <div className="modal-backdrop" onClick={()=>{setSelectedGig(null);setPage("home");}}><div className="gig-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>{setSelectedGig(null);setPage("home");}}><X/></button><div className="gig-art large-art">{selectedGig.image_url?<img src={selectedGig.image_url} alt={selectedGig.title}/>:<Sparkles size={34}/>}</div><div className="eyebrow muted">{selectedGig.category}</div><h2>{selectedGig.title}</h2><div className="seller-line"><span className="avatar">{(selectedGig.profiles?.full_name||"S").slice(0,1).toUpperCase()}</span><button className="seller-profile-link" onClick={()=>openSellerProfile(selectedGig.seller_id)}><strong>{selectedGig.profiles?.full_name || "Skill Bridge seller"}</strong></button><span className="seller-tag">Seller</span></div><p>{selectedGig.description}</p><div className="gig-facts"><span><Clock3 size={16}/> {activePackage?.delivery_days||selectedGig.delivery_days} day delivery</span><span><MessageCircle size={16}/> Discuss details before starting</span></div>
      <section className="gig-package-options"><div className="eyebrow muted">CHOOSE A PACKAGE</div><div className="gig-package-grid">{packageOptions.map(p=><button type="button" key={p.name} className={activePackage?.name===p.name?"gig-package-option selected":"gig-package-option"} onClick={()=>setSelectedPackage(p.name)}><strong>{p.name}</strong><b>{money(p.price)}</b><span>{p.delivery_days} day delivery</span><small>{p.revisions||0} revisions</small><p>{p.description}</p></button>)}</div></section>
      {selectedGig.faqs?.length>0&&<section className="gig-detail-section"><h3>Frequently asked questions</h3>{selectedGig.faqs.map((f,i)=><div className="gig-faq" key={i}><strong>{f.question}</strong><p>{f.answer}</p></div>)}</section>}
      {selectedGig.requirements?.length>0&&<section className="gig-detail-section"><h3>What I need from you</h3><ul>{selectedGig.requirements.map((r,i)=><li key={i}>{r}</li>)}</ul></section>}<button className="outline-btn full" onClick={()=>toggleFavorite(selectedGig)}><Bookmark size={17}/> {favoriteGigs.some(g=>g.id===selectedGig.id)?"Remove from saved":"Save service"}</button><button className="outline-btn full" onClick={()=>startConversation(selectedGig)}><MessageCircle size={17}/> Contact Seller · Discuss price</button><button className="report-trigger" onClick={()=>setReportOpen(v=>!v)}><Flag size={15}/> Report this service or seller</button>{reportOpen&&<form className="report-form" onSubmit={submitReport}><label>Reason<select value={reportForm.reason} onChange={e=>setReportForm({...reportForm,reason:e.target.value})}><option value="fake_service">Fake or misleading service</option><option value="fraud">Fraud or scam concern</option><option value="harassment">Harassment or abusive behaviour</option><option value="off_platform_payment">Unsafe off-platform payment request</option><option value="other">Other policy concern</option></select></label><label>Details<textarea required minLength="10" maxLength="1500" rows="3" value={reportForm.details} onChange={e=>setReportForm({...reportForm,details:e.target.value})} placeholder="Explain what happened. Please include relevant details."/></label><button className="btn btn-dark full">Submit report</button></form>}<div className="modal-bottom"><div><small>{activePackage?.name||"Starting at"} package</small><strong>{money(activePackage?.price??selectedGig.price)}</strong></div>{activeMode==="buyer"||!profile?<button className="btn btn-dark" onClick={()=>startConversation(selectedGig)}><MessageCircle size={17}/> Contact seller</button>:<span className="subtext">Switch to Buyer mode to contact this seller</span>}</div></div></div>}

    <footer className="footer"><div className="footer-brand"><span className="brand-mark"><Sparkles size={17}/></span><span className="brand-wordmark"><span>skill<span className="brand-accent">bridge</span></span><small>Made by Yousaf</small></span></div><p>A place where skills meet opportunity.</p><div className="footer-bottom"><span>© {new Date().getFullYear()} Skill Bridge · A place where skills meet opportunity</span><span>Find skills · Connect · Get work done</span></div></footer>
  </div>;
}

function GigCard({gig,onClick,onImpression}) {
  const cardRef = useRef(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !onImpression || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
        observer.disconnect();
        onImpression(gig);
      }
    }, { threshold: 0.5 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [gig.id, onImpression]);
  const palettes = ["art-purple","art-blue","art-orange","art-green"];
  const index = (gig.title?.length || 0) % palettes.length;
  return <button ref={cardRef} className="gig-card" onClick={onClick}><div className={`gig-art ${palettes[index]}`}>{gig.image_url?<img src={gig.image_url} alt={gig.title} loading="lazy"/>:<Sparkles size={28}/>}<span>{gig.category}</span></div><div className="gig-info"><div className="seller-line">{gig.profiles?.avatar_url?<img className="avatar gig-seller-avatar" src={gig.profiles.avatar_url} alt=""/>:<span className="avatar">{(gig.profiles?.full_name||"S").slice(0,1).toUpperCase()}</span>}<span>{gig.profiles?.full_name||"Skill Bridge seller"}</span><span className="seller-tag">Seller</span></div><h3>{gig.title}</h3><div className="gig-meta"><span><Clock3 size={14}/> {gig.delivery_days} days</span><span><Star size={14}/> {gig.sellerRating?`${gig.sellerRating} (${gig.sellerReviewCount})`:"New seller"}</span></div><div className="gig-price"><small>STARTING AT</small><strong>{money(gig.price)}</strong></div></div></button>;
}

function OrderCard({order,userId,onUpdate,onRevision,onMessage,onReview,reviewForm,setReviewForm}) {
  const buyer = order.buyer_id === userId;
  const [revisionOpen,setRevisionOpen] = useState(false);
  const [revisionNote,setRevisionNote] = useState("");
  const submitRevision = async e => { e.preventDefault(); await onRevision(order,revisionNote); setRevisionNote(""); setRevisionOpen(false); };
  const steps=[{key:"pending",label:"Order placed"},{key:"in_progress",label:"In progress"},{key:"delivered",label:"Delivered"},{key:"completed",label:"Completed"}];
  const currentIndex=steps.findIndex(s=>s.key===order.status);
  const statusCopy={pending:"Waiting for the seller to review this order.",in_progress:"The seller is working on your order.",delivered:"The delivery is ready for your review.",revision_requested:"The buyer requested changes. The seller can resubmit the delivery.",completed:"This order has been completed.",cancelled:"This order was cancelled."};
  return <div className="order-card">
    <div className="order-main"><div className="order-icon"><PackageCheck/></div><div className="order-info"><h3>{order.gigs?.title || "Marketplace service"}</h3><p>{buyer?`Seller: ${order.seller?.full_name || "Member"}`:`Buyer: ${order.buyer?.full_name || "Member"}`}</p><div className="order-tags"><span className={`status ${order.status}`}>{order.status==="revision_requested"?"Revision requested":order.status.replaceAll("_"," ")}</span></div></div><strong>{money(order.amount)}</strong></div>
    {order.status!=="cancelled"&&<div className="order-progress" aria-label="Order progress">{steps.map((step,i)=><div key={step.key} className={`order-progress-step ${currentIndex>=i?"complete":""} ${order.status===step.key?"current":""}`}><span>{i+1}</span><small>{step.label}</small></div>)}</div>}
    <div className="order-status-explainer"><strong>{statusCopy[order.status]||"Order status updated."}</strong><span>This status tracks the work only.</span></div>
    {order.revision_note&&<div className="revision-note"><strong>Latest revision note</strong><p>{order.revision_note}</p></div>}
    <div className="order-actions"><button className="outline-btn" onClick={()=>onMessage(order)}><MessageCircle size={15}/> Message</button>
      {!buyer&&order.status==="pending"&&<><button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"in_progress")}>Accept order</button><button className="outline-btn danger-outline" onClick={()=>{if(window.confirm("Decline this order? The buyer will see it as cancelled."))onUpdate(order.id,"cancelled");}}>Decline</button></>}
      {!buyer&&order.status==="in_progress"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"delivered")}>Mark delivered</button>}
      {!buyer&&order.status==="revision_requested"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"delivered")}>Resubmit delivery</button>}
      {buyer&&order.status==="delivered"&&<><button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"completed")}>Approve & complete</button><button className="outline-btn" onClick={()=>setRevisionOpen(v=>!v)}>Request revision</button></>}
    </div>
    {revisionOpen&&buyer&&<form className="revision-request-form" onSubmit={submitRevision}><label>What needs to be changed?<textarea required rows="3" value={revisionNote} onChange={e=>setRevisionNote(e.target.value)} placeholder="Explain the changes clearly..."/></label><div><button type="button" className="back-link" onClick={()=>setRevisionOpen(false)}>Cancel</button><button className="btn btn-dark btn-small">Send revision request</button></div></form>}
    {buyer&&order.status==="completed"&&<form className="review-inline" onSubmit={e=>onReview(e,order)}><select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:e.target.value})}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Write a short review" required/><button className="outline-btn">Submit review</button></form>}
  </div>;
}
function Empty({icon,title,text}) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }

createRoot(document.getElementById("root")).render(<App/>);