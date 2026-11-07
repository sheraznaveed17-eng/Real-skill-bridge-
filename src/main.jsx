import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, BriefcaseBusiness, UserRound, Plus, LogOut, Menu, X, Star, Bookmark, Trash2, ExternalLink,
  MessageCircle, LayoutDashboard, ShieldCheck, ArrowRight, CheckCircle2,
  Clock3, Wallet, Sparkles, Filter, PackageCheck, Send, ChevronRight, ChevronDown, Camera, Save, UserCircle, Settings, ShoppingBag
} from "lucide-react";
import { supabase, isConfigured } from "./supabase";
import "./style.css";

const categories = ["All", "Graphics & Design", "Writing & Translation", "Programming & Tech", "Video & Animation", "Digital Marketing", "Business", "Construction", "Masonry & Labour", "Plumbing", "Electrical Work", "Painting", "Carpentry", "AC & Appliance Repair", "Vehicle Repair", "Cleaning & Home Services", "Gardening", "Transport", "Education & Tutoring", "Events & Catering"];
const money = n => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeMode, setActiveMode] = useState("buyer");
  const [page, setPage] = useState("home");
  const [gigs, setGigs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email:"", password:"", name:"", role:"buyer" });
  const [gigForm, setGigForm] = useState({ title:"", description:"", category:"Graphics & Design", price:"", delivery_days:"3" });
  const [orderDetails, setOrderDetails] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("JazzCash");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationOffers, setConversationOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({title:"",description:"",amount:"",delivery_days:"3"});
  const [messageText, setMessageText] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating:"5", comment:"" });
  const [profileForm, setProfileForm] = useState({ full_name:"", bio:"", professional_title:"", country:"", languages:"", skills:"", experience_years:"", education:"", certifications:"", website_url:"", availability:true });
  const [sellerReviews, setSellerReviews] = useState([]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [favoriteGigs, setFavoriteGigs] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({title:"",description:"",project_url:"",image_url:""});

  const demoMode = !isConfigured;

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
    }
  }, [session]);

  const loadProfile = async user => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) { const preferredMode = user.user_metadata?.active_mode || data.active_mode || (data.role==="seller"?"seller":"buyer"); setActiveMode(preferredMode); if (data.active_mode !== preferredMode) supabase.from("profiles").update({active_mode:preferredMode}).eq("id",user.id); setProfile(data); setProfileForm({ full_name:data.full_name || "", bio:data.bio || "", professional_title:data.professional_title || "", country:data.country || "", languages:(data.languages || []).join(", "), skills:(data.skills || []).join(", "), experience_years:data.experience_years ?? "", education:data.education || "", certifications:data.certifications || "", website_url:data.website_url || "", availability:data.availability ?? true }); }
    else {
      const fallback = { id:user.id, full_name:user.user_metadata?.full_name || user.email?.split("@")[0], role:user.user_metadata?.role || "buyer", account_modes:["buyer","seller"], active_mode:user.user_metadata?.active_mode || "buyer" };
      const { data: created } = await supabase.from("profiles").upsert(fallback).select().single();
      setProfile(created || fallback); setActiveMode(fallback.active_mode); setProfileForm({ full_name:fallback.full_name || "", bio:fallback.bio || "", professional_title:"", country:"", languages:"", skills:"", experience_years:"", education:"", certifications:"", website_url:"", availability:true });
    }
  };

  const loadGigs = async () => {
    const { data, error } = await supabase.from("gigs").select("*, profiles(full_name, avatar_url)").eq("is_active", true).order("created_at", { ascending:false });
    if (!error) setGigs(data || []);
  };

  const loadSellerReviews = async () => {
    const { data, error } = await supabase.from("reviews").select("id,seller_id,rating,comment,created_at").order("created_at", { ascending:false });
    if (!error) setSellerReviews(data || []);
  };

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*, gigs(title, price), buyer:profiles!orders_buyer_id_fkey(full_name), seller:profiles!orders_seller_id_fkey(full_name)").order("created_at", { ascending:false });
    setOrders(data || []);
  };

  const filteredGigs = useMemo(() => gigs.filter(g => {
    const matchesText = `${g.title} ${g.description} ${g.category} ${g.profiles?.full_name || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesText && (category === "All" || g.category === category);
  }), [gigs, search, category]);

  const show = msg => { setNotice(msg); setTimeout(() => setNotice(""), 4200); };
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
        if (data.session) show("Account ban gaya! Skill Bridge mein khush aamdeed.");
        else show("Signup request complete. Email confirmation aaye to verify karein.");
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

  const saveProfile = async e => {
    e.preventDefault();
    if (!session?.user) return;
    setBusy(true);
    const { data, error } = await supabase.from("profiles").update({
      full_name:profileForm.full_name.trim(), bio:profileForm.bio.trim(),
      professional_title:profileForm.professional_title.trim(), country:profileForm.country.trim(),
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


  const createGig = async e => {
    e.preventDefault();
    if (!profile || demoMode) return show("Gig publish karne ke liye account aur Supabase connection zaroori hai.");
    if (activeMode !== "seller") return show("Seller mode par switch karein to publish a service.");
    setBusy(true);
    const { error } = await supabase.from("gigs").insert({
      seller_id:session.user.id, title:gigForm.title.trim(), description:gigForm.description.trim(),
      category:gigForm.category, price:Number(gigForm.price), delivery_days:Number(gigForm.delivery_days)
    });
    if (error) show(error.message);
    else { show("Your gig is now published!"); setGigForm({title:"",description:"",category:"Graphics & Design",price:"",delivery_days:"3"}); await loadGigs(); navigate("my-gigs"); }
    setBusy(false);
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

  const placeOrder = async () => {
    show("Payment service is currently unavailable. Please try again later.");
  };

  const updateOrder = async (id, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) show(error.message); else { show("Order status updated."); loadOrders(); }
  };

  const loadMessages = async order => {
    setActiveOrder(order); navigate("messages");
    const { data, error } = await supabase.from("messages").select("*, profiles(full_name)").eq("order_id", order.id).order("created_at");
    if (!error) setMessages(data || []);
  };


  const loadInbox = async () => {
    if (!session?.user) return;
    const {data,error} = await supabase.from("conversations").select("*, gigs(title), buyer:profiles!conversations_buyer_id_fkey(full_name,avatar_url), seller:profiles!conversations_seller_id_fkey(full_name,avatar_url)").or("buyer_id.eq."+session.user.id+",seller_id.eq."+session.user.id).order("updated_at",{ascending:false});
    if (!error) setConversations(data || []);
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
    const {error}=await supabase.from("custom_offers").insert({conversation_id:activeConversation.id,seller_id:session.user.id,buyer_id:activeConversation.buyer_id,title:offerForm.title.trim(),description:offerForm.description.trim(),amount:Number(offerForm.amount),delivery_days:Number(offerForm.delivery_days)});
    if (error) show(error.message);
    else { setOfferForm({title:"",description:"",amount:"",delivery_days:"3"}); show("Custom offer sent."); await loadConversation(activeConversation); await supabase.from("conversations").update({last_message:"Custom offer sent",updated_at:new Date().toISOString()}).eq("id",activeConversation.id); await loadInbox(); }
  };

  const respondToOffer = async (offer,status) => {
    const {error}=await supabase.from("custom_offers").update({status}).eq("id",offer.id).eq("buyer_id",session.user.id);
    if (error) show(error.message); else { show(status==="accepted"?"Offer accepted.":"Offer declined."); await loadConversation(activeConversation); }
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
      order_id:order.id, gig_id:order.gig_id, reviewer_id:session.user.id,
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

  const myGigs = gigs.filter(g => g.seller_id === session?.user?.id);
  const myOrders = orders.filter(o => o.buyer_id === session?.user?.id || o.seller_id === session?.user?.id);
  const isAdmin = profile?.role === "admin";

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")}><span className="brand-mark"><Sparkles size={20}/></span><span className="brand-wordmark"><span>skill<span className="brand-accent">bridge</span></span><small>Made by Yousaf</small></span></button>
      <nav className="desktop-nav">
        <button onClick={() => navigate("home")}>Explore</button>
        {session && <button onClick={() => navigate("orders")}>Orders</button>}
        {session && <button onClick={() => {setActiveOrder(null);setActiveConversation(null);setPage("messages");loadInbox();}}>Messages</button>}
        {session && activeMode==="seller" && <button onClick={() => navigate("my-gigs")}>My services</button>}
      </nav>
      <div className="top-actions">
        <button className="icon-btn mobile-only" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button>
        {session ? <>
          <button className="nav-plain desktop-account-link" onClick={() => navigate("dashboard")}>Dashboard</button>
          <div className="account-menu-wrap">
            <button className="account-trigger" aria-expanded={accountMenu} onClick={() => setAccountMenu(v=>!v)}>
              {profile?.avatar_url ? <img className="avatar account-avatar" src={profile.avatar_url} alt=""/> : <span className="avatar account-avatar">{(profile?.full_name || "U").slice(0,1).toUpperCase()}</span>}
              <span className="account-trigger-name">{profile?.full_name || "My account"}</span><ChevronDown size={16}/>
            </button>
            {accountMenu && <div className="account-dropdown">
              <div className="account-dropdown-user"><strong>{profile?.full_name || "Skill Bridge member"}</strong><small>{session.user.email}</small></div>
              <div className="account-mode-actions"><button onClick={()=>switchMode("buyer")}>Buyer mode</button><button onClick={()=>switchMode("seller")}>Seller mode</button></div>
              <button onClick={()=>{navigate("profile");setAccountMenu(false)}}><UserCircle size={17}/> My profile</button>
              <button onClick={()=>{navigate("dashboard");setAccountMenu(false)}}><LayoutDashboard size={17}/> Dashboard</button>
              <button onClick={()=>{navigate("saved");setAccountMenu(false)}}><Bookmark size={17}/> Saved services</button>
              {activeMode==="seller" && <button onClick={()=>{navigate("portfolio");setAccountMenu(false)}}><BriefcaseBusiness size={17}/> My portfolio</button>}
              <button onClick={()=>{navigate("orders");setAccountMenu(false)}}><PackageCheck size={17}/> Orders</button>
              {activeMode==="seller" && <button onClick={()=>{navigate("my-gigs");setAccountMenu(false)}}><BriefcaseBusiness size={17}/> My services</button>}
              <button className="dropdown-logout" onClick={()=>{setAccountMenu(false);signOut()}}><LogOut size={17}/> Log out</button>
            </div>}
          </div>
        </> : <><button className="nav-plain" onClick={() => {setAuthMode("login");navigate("auth");}}>Log in</button><button className="btn btn-dark btn-small" onClick={() => {setAuthMode("signup");navigate("auth");}}>Join Skill Bridge</button></>}
        <form className="header-search" onSubmit={e=>{e.preventDefault();navigate("home");document.getElementById("explore")?.scrollIntoView({behavior:"smooth"});}}>
          <Search size={17}/><input aria-label="Search services" value={search} onChange={e=>setSearch(e.target.value)} placeholder="What service do you need?"/><button type="submit">Search</button>
        </form>
      </div>
    </header>
    <nav className="marketplace-subnav" aria-label="Popular categories">
      {categories.slice(1,11).map(c=><button key={c} className={category===c?"selected":""} onClick={()=>{setCategory(c);navigate("home");document.getElementById("explore")?.scrollIntoView({behavior:"smooth"});}}>{c}</button>)}
    </nav>
    {mobileMenu && <div className="mobile-menu"><button onClick={()=>navigate("home")}>Explore</button>{session ? <><button onClick={()=>navigate("dashboard")}>Dashboard</button><button onClick={()=>navigate("profile")}>My profile</button><button onClick={()=>navigate("saved")}>Saved services</button><button onClick={()=>navigate("orders")}>Orders</button>{activeMode==="seller"&&<button onClick={()=>navigate("portfolio")}>My portfolio</button><button onClick={()=>{setActiveOrder(null);setActiveConversation(null);setPage("messages");loadInbox();}}>Messages</button>{activeMode==="seller"&&<button onClick={()=>navigate("my-gigs")}>My services</button>}<button onClick={signOut}>Log out</button></> : <><button onClick={()=>{setAuthMode("login");navigate("auth")}}>Log in</button><button onClick={()=>{setAuthMode("signup");navigate("auth")}}>Join Skill Bridge</button></>}</div>}
    {demoMode && <div className="setup-banner"><span><Sparkles size={15}/> Setup required: connect your free Supabase project to enable real multi-user features.</span><button onClick={()=>show("README.md mein Android setup ke simple steps diye gaye hain.")}>How to connect</button></div>}
    {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></div>}

    {page === "home" && <>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot"></span> THE MARKETPLACE FOR EVERY KIND OF WORK</div>
          <h1>Find work. Hire talent.<br/><span>Get things done.</span></h1>
          <p>From digital services to hands-on local jobs, connect with skilled people for every task — all in one simple place.</p>
          <div className="hero-search"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search any skill, service or job..."/><button onClick={()=>document.getElementById("explore")?.scrollIntoView({behavior:"smooth"})}>Search</button></div>
          <div className="popular">Popular: <button onClick={()=>{setSearch("electrician");setCategory("Electrical Work")}}>Electrician</button><button onClick={()=>{setSearch("logo");setCategory("Graphics & Design")}}>Logo design</button><button onClick={()=>{setSearch("plumber");setCategory("Plumbing")}}>Plumber</button><button onClick={()=>{setSearch("website");setCategory("Programming & Tech")}}>Website</button></div>
          <div className="hero-stats"><div><strong>Digital + Local</strong><span>all kinds of services</span></div><div><strong>One platform</strong><span>for workers and customers</span></div><div><strong>Simple to use</strong><span>for everyone</span></div></div>
        </div>
        <div className="hero-orb orb-one"></div><div className="hero-orb orb-two"></div>
      </section>
      <section className="choice-section">
        <div className="choice-heading"><span className="eyebrow muted">GET STARTED</span><h2>What would you like to do?</h2><p>Choose how you want to use Skill Bridge.</p></div>
        <div className="choice-grid">
          <button className="choice-card" onClick={()=>{if(session){switchMode("seller");}else{setAuthForm(v=>({...v,role:"seller"}));setAuthMode("signup");navigate("auth");}}}>
            <span className="choice-icon"><BriefcaseBusiness size={25}/></span><span className="choice-copy"><strong>Find Work</strong><small>Show your skills and let customers discover your services.</small></span><ArrowRight className="choice-arrow"/>
          </button>
          <button className="choice-card" onClick={()=>{if(session){switchMode("buyer");}else{setAuthForm(v=>({...v,role:"buyer"}));setAuthMode("signup");navigate("auth");}}}>
            <span className="choice-icon"><UserRound size={25}/></span><span className="choice-copy"><strong>Hire Someone</strong><small>Find skilled people for digital tasks and practical work.</small></span><ArrowRight className="choice-arrow"/>
          </button>
        </div>
      </section>
      <section className="trust-strip"><span><ShieldCheck size={18}/> For every kind of work</span><span><CheckCircle2 size={18}/> Multiple payment options</span><span><MessageCircle size={18}/> Buyer-seller messaging</span></section>
      <main className="content" id="explore">
        <div className="section-heading"><div><div className="eyebrow muted">DISCOVER SERVICES</div><h2>Explore all services</h2><p>Browse digital skills, skilled trades and everyday services.</p></div><button className="outline-btn" onClick={()=>{setSearch("");setCategory("All")}}><Filter size={16}/> Clear filters</button></div>
        <div className="category-row">{categories.map(c=><button key={c} className={category===c?"category active":"category"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="gig-grid">{filteredGigs.map(g=><GigCard key={g.id} gig={g} onClick={()=>{setPage("home");setOrderDetails("");setSelectedGig(g);}}/> )}</div>
        {!filteredGigs.length && <Empty icon={<BriefcaseBusiness/>} title="No services found yet" text={demoMode?"The marketplace is getting ready.":"Try another search or category. You can be the first to list a service."}/>}
        {activeMode==="seller" && <div className="join-banner"><div><h3>Ready to offer your skills?</h3><p>Create a service listing and let buyers discover what you do best.</p></div><button className="btn btn-dark" onClick={()=>navigate("create-gig")}><Plus size={17}/> Create a gig</button></div>}
      </main>
    </>}

    {page === "auth" && <main className="narrow-page"><div className="auth-card"><div className="auth-logo"><span className="brand-mark"><Sparkles size={20}/></span></div><div className="eyebrow muted">WELCOME TO SKILL BRIDGE</div><h2>{authMode==="signup"?"Create your account":"Welcome back"}</h2><p className="subtext">{authMode==="signup"?"Join the community of buyers and independent sellers.":"Log in to manage your projects and services."}</p>
      <form onSubmit={signUpOrIn} className="stack-form">
        {authMode==="signup" && <><label>Full name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label><p className="auth-mode-note">One account gives you both Buyer and Seller modes. You can switch anytime.</p></>}
        <label>Email address<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength="6" type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 6 characters"/></label>
        <button className="btn btn-dark full" disabled={busy}>{busy?"Please wait...":authMode==="signup"?"Create account":"Log in"} <ArrowRight size={17}/></button>
      </form>
      <div className="switch-auth">{authMode==="signup"?"Already have an account?":"New to Skill Bridge?"} <button onClick={()=>setAuthMode(authMode==="signup"?"login":"signup")}>{authMode==="signup"?"Log in":"Create an account"}</button></div>
      <button className="back-link" onClick={()=>navigate("home")}>← Back to marketplace</button>
    </div></main>}

    {page === "create-gig" && <main className="narrow-page"><div className="form-panel"><div className="eyebrow muted">SELLER STUDIO</div><h2>Create a new gig</h2><p className="subtext">Describe your service clearly so buyers know what they will receive.</p><form className="stack-form" onSubmit={createGig}>
      <label>Gig title<input required maxLength="90" value={gigForm.title} onChange={e=>setGigForm({...gigForm,title:e.target.value})} placeholder="I will design a modern business logo"/></label>
      <label>Category<select value={gigForm.category} onChange={e=>setGigForm({...gigForm,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Description<textarea required rows="5" value={gigForm.description} onChange={e=>setGigForm({...gigForm,description:e.target.value})} placeholder="Explain your service, deliverables, and what you need from the buyer."/></label>
      <div className="two-fields"><label>Price (PKR)<input required type="number" min="1" value={gigForm.price} onChange={e=>setGigForm({...gigForm,price:e.target.value})} placeholder="1500"/></label><label>Delivery days<input required type="number" min="1" max="60" value={gigForm.delivery_days} onChange={e=>setGigForm({...gigForm,delivery_days:e.target.value})}/></label></div>
      <button className="btn btn-dark full" disabled={busy}>Publish gig <ArrowRight size={17}/></button>
    </form></div></main>}

    {page === "my-gigs" && <main className="content page-content"><div className="section-heading"><div><div className="eyebrow muted">SELLER STUDIO</div><h2>My gigs</h2><p>Manage the services you have published.</p></div><button className="btn btn-dark" onClick={()=>navigate("create-gig")}><Plus size={17}/> New gig</button></div><div className="gig-grid">{myGigs.map(g=><GigCard key={g.id} gig={g} onClick={()=>setSelectedGig(g)}/>)}</div>{!myGigs.length&&<Empty icon={<BriefcaseBusiness/>} title="No gigs published" text="Create your first service listing to appear in the marketplace."/>}</main>}

    {page === "orders" && <main className="content page-content"><div className="eyebrow muted">WORKSPACE</div><h2>Your orders</h2><p className="subtext">Track purchases and manage projects from one place.</p><div className="orders-list">{myOrders.map(o=><OrderCard key={o.id} order={o} userId={session?.user?.id} onUpdate={updateOrder} onMessage={loadMessages} onReview={submitReview} reviewForm={reviewForm} setReviewForm={setReviewForm}/>)}</div>{!myOrders.length&&<Empty icon={<PackageCheck/>} title="No orders yet" text="When you place or receive an order, it will appear here."/>}</main>}


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
              <div className="two-fields"><label>Country<input value={profileForm.country} onChange={e=>setProfileForm({...profileForm,country:e.target.value})} placeholder="Pakistan"/></label><label>Experience (years)<input type="number" min="0" max="60" value={profileForm.experience_years} onChange={e=>setProfileForm({...profileForm,experience_years:e.target.value})} placeholder="e.g. 3"/></label></div>
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

    {page === "saved" && <main className="content page-content"><div className="section-heading"><div><div className="eyebrow muted">YOUR COLLECTION</div><h2>Saved services</h2><p>Services you bookmarked for later.</p></div><button className="outline-btn" onClick={()=>navigate("home")}>Explore services <ArrowRight size={15}/></button></div><div className="gig-grid">{favoriteGigs.map(g=><GigCard key={g.id} gig={g} onClick={()=>{setSelectedGig(g);setPage("home");}}/> )}</div>{!favoriteGigs.length&&<Empty icon={<Bookmark/>} title="No saved services yet" text="Open a service and tap Save service to keep it here."/>}</main>}

    {page === "portfolio" && <main className="content page-content"><div className="section-heading"><div><div className="eyebrow muted">SELLER STUDIO</div><h2>My portfolio</h2><p>Show buyers examples of work you have completed.</p></div></div><section className="dashboard-panel portfolio-create"><h3>Add a project</h3><form className="stack-form" onSubmit={addPortfolioItem}><label>Project title<input required maxLength="100" value={portfolioForm.title} onChange={e=>setPortfolioForm({...portfolioForm,title:e.target.value})} placeholder="e.g. Brand identity for a local business"/></label><label>Project description<textarea required rows="3" maxLength="800" value={portfolioForm.description} onChange={e=>setPortfolioForm({...portfolioForm,description:e.target.value})} placeholder="What was the work and what did you deliver?"/></label><label>Project link<input required type="url" value={portfolioForm.project_url} onChange={e=>setPortfolioForm({...portfolioForm,project_url:e.target.value})} placeholder="https://your-project.example"/></label><label>Preview image URL<input required type="url" value={portfolioForm.image_url} onChange={e=>setPortfolioForm({...portfolioForm,image_url:e.target.value})} placeholder="https://.../project-image.jpg"/></label><button className="btn btn-dark" disabled={busy}><Plus size={16}/> Add to portfolio</button></form></section><div className="portfolio-grid">{portfolioItems.map(item=><article className="portfolio-card" key={item.id}><img src={item.image_url} alt={item.title} loading="lazy"/><div><h3>{item.title}</h3><p>{item.description}</p><div className="portfolio-card-actions"><a href={item.project_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> View project</a><button className="outline-btn" onClick={()=>removePortfolioItem(item.id)}><Trash2 size={14}/> Remove</button></div></div></article>)}</div>{!portfolioItems.length&&<Empty icon={<BriefcaseBusiness/>} title="Your portfolio is empty" text="Add your first project above to show buyers what you can do."/>}</main>}

    {page === "dashboard" && <main className="content page-content dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="eyebrow muted">{activeMode==="seller"?"SELLER":"BUYER"} WORKSPACE</div>
          <h2>{profile?.full_name || "Welcome back"}</h2>
          <p>{activeMode==="seller"?"Your business overview, orders and services — all in one place.":"Your projects, purchases and conversations — all in one place."}</p>
        </div>
        <div className="dashboard-welcome-actions">
          <div className="mode-switch"><span>Switch workspace</span><button className={activeMode==="buyer"?"selected":""} onClick={()=>switchMode("buyer")} disabled={busy}>Buyer</button><button className={activeMode==="seller"?"selected":""} onClick={()=>switchMode("seller")} disabled={busy}>Seller</button></div>
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
          <button className="dashboard-side-link" onClick={()=>navigate("saved")}><Bookmark size={17}/> Saved services<ChevronRight size={15}/></button>
          {activeMode==="seller" && <button className="dashboard-side-link" onClick={()=>navigate("portfolio")}><BriefcaseBusiness size={17}/> Portfolio<ChevronRight size={15}/></button>
          {activeMode==="seller" && <button className="dashboard-side-link" onClick={()=>navigate("my-gigs")}><BriefcaseBusiness size={17}/> My services<ChevronRight size={15}/></button>}
          <button className="dashboard-side-link" onClick={()=>navigate("profile")}><UserRound size={17}/> Profile settings<ChevronRight size={15}/></button>
          <div className="dashboard-sidebar-help"><strong>Need to update your details?</strong><p>Keep your profile clear so other members know who they are working with.</p><button onClick={()=>navigate("profile")}>Edit profile <ArrowRight size={14}/></button></div>
        </aside>

        <section className="dashboard-main">
          {activeMode==="seller" ? <>
            <div className="dashboard-section-heading"><div><h3>Business overview</h3><p>Here’s what’s happening with your services.</p></div><button className="text-action" onClick={()=>navigate("orders")}>View all orders <ArrowRight size={15}/></button></div>
            <div className="dashboard-stats">
              <div className="dashboard-stat"><span>Active orders</span><strong>{myOrders.filter(o=>o.seller_id===session?.user?.id && !["completed","cancelled"].includes(o.status)).length}</strong><small><Clock3 size={14}/> Currently in progress</small></div>
              <div className="dashboard-stat"><span>New order requests</span><strong>{myOrders.filter(o=>o.seller_id===session?.user?.id && o.status==="pending").length}</strong><small><PackageCheck size={14}/> Waiting for your response</small></div>
              <div className="dashboard-stat"><span>Completed orders</span><strong>{myOrders.filter(o=>o.seller_id===session?.user?.id && o.status==="completed").length}</strong><small><CheckCircle2 size={14}/> Successfully completed</small></div>
              <div className="dashboard-stat"><span>Active services</span><strong>{myGigs.length}</strong><small><BriefcaseBusiness size={14}/> Visible in marketplace</small></div>
              <div className="dashboard-stat"><span>Average rating</span><strong>{sellerReviews.filter(r=>r.seller_id===session?.user?.id).length ? (sellerReviews.filter(r=>r.seller_id===session?.user?.id).reduce((sum,r)=>sum+Number(r.rating||0),0)/sellerReviews.filter(r=>r.seller_id===session?.user?.id).length).toFixed(1) : "—"}</strong><small><Star size={14}/> {sellerReviews.filter(r=>r.seller_id===session?.user?.id).length} order reviews</small></div>
            </div>
            <div className="dashboard-two-column">
              <section className="dashboard-panel">
                <div className="dashboard-panel-heading"><div><h3>Priority tasks</h3><p>Things that may need your attention.</p></div><span className="dashboard-panel-icon"><Clock3 size={17}/></span></div>
                {myOrders.filter(o=>o.seller_id===session?.user?.id && ["pending","in_progress","delivered"].includes(o.status)).length
                  ? myOrders.filter(o=>o.seller_id===session?.user?.id && ["pending","in_progress","delivered"].includes(o.status)).slice(0,4).map(o=><div className="dashboard-task" key={o.id}><span className="dashboard-task-dot"/><div><strong>{o.status==="pending"?"Review new order":o.status==="in_progress"?"Continue active order":"Waiting for buyer approval"}</strong><small>{o.gigs?.title || "Marketplace service"} · {o.buyer?.full_name || "Buyer"}</small></div><span className={`status ${o.status}`}>{o.status.replace("_"," ")}</span></div>)
                  : <div className="dashboard-empty"><PackageCheck size={22}/><strong>You’re all caught up</strong><span>New order requests and active work will appear here.</span></div>}
                <button className="dashboard-panel-footer" onClick={()=>navigate("orders")}>Open order manager <ArrowRight size={15}/></button>
              </section>
              <section className="dashboard-panel">
                <div className="dashboard-panel-heading"><div><h3>Account snapshot</h3><p>Your current seller setup.</p></div><span className="dashboard-panel-icon"><UserRound size={17}/></span></div>
                <div className="dashboard-account-row"><span>Account type</span><strong>Seller</strong></div>
                <div className="dashboard-account-row"><span>Profile name</span><strong>{profile?.full_name || "Not set"}</strong></div>
                <div className="dashboard-account-row"><span>Profile photo</span><strong>{profile?.avatar_url?"Added":"Not added"}</strong></div>
                <div className="dashboard-account-row"><span>Earnings</span><strong className="muted-value">Unavailable</strong></div>
                <p className="dashboard-note">Payments are not active yet, so no earnings or payout balance is being displayed.</p>
                <button className="dashboard-panel-footer" onClick={()=>navigate("profile")}>Complete your profile <ArrowRight size={15}/></button>
              </section>
            </div>
            <section className="dashboard-panel dashboard-services-panel">
              <div className="dashboard-panel-heading"><div><h3>Your services</h3><p>Manage the services buyers can discover.</p></div><button className="outline-btn" onClick={()=>navigate("my-gigs")}>Manage services</button></div>
              {myGigs.length ? <div className="dashboard-service-list">{myGigs.slice(0,4).map(g=><div className="dashboard-service-row" key={g.id}><span className="dashboard-service-art"><BriefcaseBusiness size={18}/></span><div><strong>{g.title}</strong><small>{g.category} · {g.delivery_days} day delivery</small></div><strong>{money(g.price)}</strong><span className="service-live"><i/> Active</span></div>)}</div> : <div className="dashboard-empty"><BriefcaseBusiness size={22}/><strong>Your first service starts here</strong><span>Create a service listing to appear in Skill Bridge search.</span><button className="btn btn-dark btn-small" onClick={()=>navigate("create-gig")}><Plus size={15}/> Create a service</button></div>}
            </section>
          </> : <>
            <div className="dashboard-section-heading"><div><h3>Your projects</h3><p>Keep track of the services you’ve ordered.</p></div><button className="text-action" onClick={()=>navigate("home")}>Explore services <ArrowRight size={15}/></button></div>
            <div className="dashboard-stats buyer-stats">
              <div className="dashboard-stat"><span>Active projects</span><strong>{myOrders.filter(o=>o.buyer_id===session?.user?.id && !["completed","cancelled"].includes(o.status)).length}</strong><small><Clock3 size={14}/> Work in progress</small></div>
              <div className="dashboard-stat"><span>Orders placed</span><strong>{myOrders.filter(o=>o.buyer_id===session?.user?.id).length}</strong><small><PackageCheck size={14}/> Your purchases</small></div>
              <div className="dashboard-stat"><span>Completed projects</span><strong>{myOrders.filter(o=>o.buyer_id===session?.user?.id && o.status==="completed").length}</strong><small><CheckCircle2 size={14}/> Finished work</small></div>
            </div>
            <section className="dashboard-panel buyer-orders-panel">
              <div className="dashboard-panel-heading"><div><h3>Recent orders</h3><p>Updates from the people working with you.</p></div><button className="outline-btn" onClick={()=>navigate("orders")}>All orders</button></div>
              {myOrders.filter(o=>o.buyer_id===session?.user?.id).length ? <div className="dashboard-service-list">{myOrders.filter(o=>o.buyer_id===session?.user?.id).slice(0,5).map(o=><div className="dashboard-service-row" key={o.id}><span className="dashboard-service-art"><PackageCheck size={18}/></span><div><strong>{o.gigs?.title || "Marketplace service"}</strong><small>Seller: {o.seller?.full_name || "Skill Bridge member"}</small></div><span className={`status ${o.status}`}>{o.status.replace("_"," ")}</span><button className="text-action" onClick={()=>loadMessages(o)}>Message <ArrowRight size={14}/></button></div>)}</div> : <div className="dashboard-empty"><ShoppingBag size={22}/><strong>No projects yet</strong><span>Explore services and find the right person for your next task.</span><button className="btn btn-dark btn-small" onClick={()=>navigate("home")}><Search size={15}/> Explore services</button></div>}
            </section>
            <section className="dashboard-panel buyer-discovery-panel">
              <div className="dashboard-panel-heading"><div><h3>Get started</h3><p>Everything you need to use Skill Bridge.</p></div></div>
              <div className="buyer-action-grid"><button onClick={()=>navigate("home")}><Search size={20}/><strong>Find a service</strong><span>Browse digital and local services</span></button><button onClick={()=>navigate("orders")}><PackageCheck size={20}/><strong>Track an order</strong><span>Check progress and delivery updates</span></button><button onClick={()=>navigate("profile")}><UserRound size={20}/><strong>Update your profile</strong><span>Manage your account details</span></button></div>
            </section>
          </>}
        </section>
      </div>
    </main>}
    
    {page === "messages" && <main className="content page-content inbox-page">
      <div className="eyebrow muted">YOUR INBOX</div><h2>Messages</h2><p className="subtext">Talk with buyers and sellers, discuss the work and agree on a price.</p>
      <div className="inbox-layout">
        <aside className="inbox-list"><div className="inbox-list-head"><strong>All conversations</strong><span>{conversations.length}</span></div>
          {conversations.map(c=>{const other=c.buyer_id===session?.user?.id?c.seller:c.buyer;return <button key={c.id} className={activeConversation?.id===c.id?"inbox-thread active":"inbox-thread"} onClick={()=>loadConversation(c)}><span className="avatar">{(other?.full_name||"U").slice(0,1).toUpperCase()}</span><span className="inbox-thread-copy"><strong>{other?.full_name||"Member"}</strong><small>{c.gigs?.title||"Service discussion"}</small><small>{c.last_message||"Start a conversation"}</small></span></button>;})}
          {!conversations.length&&<div className="inbox-empty">No conversations yet. Open a gig and contact its seller.</div>}
        </aside>
        <section className="inbox-chat">{activeConversation ? <>
          <div className="inbox-chat-head"><div><strong>{(activeConversation.buyer_id===session?.user?.id?activeConversation.seller:activeConversation.buyer)?.full_name||"Member"}</strong><small>{activeConversation.gigs?.title||"Service discussion"}</small></div><span className="seller-tag">Inbox</span></div>
          <div className="inbox-chat-body">{messages.map(m=><div key={m.id} className={m.sender_id===session?.user?.id?"chat-msg own":"chat-msg"}><strong>{m.profiles?.full_name||(m.sender_id===session?.user?.id?"You":"Member")}</strong><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString()}</small></div>)}{!messages.length&&<div className="empty-chat">Say hello and discuss the work.</div>}
            {conversationOffers.map(o=><div className="custom-offer-card" key={o.id}><div className="eyebrow muted">CUSTOM OFFER · {o.status.toUpperCase()}</div><h3>{o.title}</h3><p>{o.description}</p><div className="custom-offer-meta"><strong>{money(o.amount)}</strong><span>{o.delivery_days} days delivery</span></div>{o.status==="pending"&&o.buyer_id===session?.user?.id&&<div className="offer-actions"><button className="outline-btn" onClick={()=>respondToOffer(o,"declined")}>Decline</button><button className="btn btn-dark btn-small" onClick={()=>respondToOffer(o,"accepted")}>Accept offer</button></div>}</div>)}
          </div>
          {activeConversation.seller_id===session?.user?.id&&<form className="custom-offer-form" onSubmit={sendCustomOffer}><strong>Send a custom offer</strong><div className="two-fields"><input required placeholder="Offer title" value={offerForm.title} onChange={e=>setOfferForm({...offerForm,title:e.target.value})}/><input required type="number" min="1" placeholder="Price (PKR)" value={offerForm.amount} onChange={e=>setOfferForm({...offerForm,amount:e.target.value})}/></div><textarea required rows="2" placeholder="Describe the work..." value={offerForm.description} onChange={e=>setOfferForm({...offerForm,description:e.target.value})}/><div className="offer-send-row"><label>Delivery days<input required type="number" min="1" max="365" value={offerForm.delivery_days} onChange={e=>setOfferForm({...offerForm,delivery_days:e.target.value})}/></label><button className="outline-btn">Send offer</button></div></form>}
          <form className="chat-compose" onSubmit={sendConversationMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Write a message..." required/><button className="btn btn-dark"><Send size={17}/></button></form>
        </> : <div className="inbox-placeholder"><MessageCircle size={34}/><h3>Select a conversation</h3><p>Your messages and custom offers will appear here.</p></div>}</section>
      </div>
    </main>}

    {page === "admin" && <main className="content page-content"><div className="eyebrow muted">ADMINISTRATION</div><h2>Admin overview</h2><p className="subtext">Basic marketplace moderation view.</p><div className="dashboard-grid"><div className="metric-card"><span>Total active gigs</span><strong>{gigs.length}</strong></div><div className="metric-card"><span>Total orders</span><strong>{orders.length}</strong></div><div className="metric-card"><span>Marketplace members</span><strong>—</strong><small>Use Supabase dashboard for user management</small></div></div><h3 className="list-title">Recent gigs</h3>{gigs.slice(0,10).map(g=><div className="admin-row" key={g.id}><div><strong>{g.title}</strong><small>{g.profiles?.full_name} · {g.category}</small></div><strong>{money(g.price)}</strong><button className="outline-btn" onClick={async()=>{const {error}=await supabase.from("gigs").update({is_active:false}).eq("id",g.id);if(error)show(error.message);else{show("Gig deactivated.");loadGigs();}}}>Deactivate</button></div>)}</main>}

    {selectedGig && <div className="modal-backdrop" onClick={()=>{setSelectedGig(null);setPage("home");}}><div className="gig-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>{setSelectedGig(null);setPage("home");}}><X/></button><div className="gig-art large-art"><Sparkles size={34}/></div><div className="eyebrow muted">{selectedGig.category}</div><h2>{selectedGig.title}</h2><div className="seller-line"><span className="avatar">{(selectedGig.profiles?.full_name||"S").slice(0,1).toUpperCase()}</span><strong>{selectedGig.profiles?.full_name || "Skill Bridge seller"}</strong><span className="seller-tag">Seller</span></div><p>{selectedGig.description}</p><div className="gig-facts"><span><Clock3 size={16}/> {selectedGig.delivery_days} day delivery</span><span><ShieldCheck size={16}/> Buyer protection planned</span></div><button className="outline-btn full" onClick={()=>toggleFavorite(selectedGig)}><Bookmark size={17}/> {favoriteGigs.some(g=>g.id===selectedGig.id)?"Remove from saved":"Save service"}</button><button className="outline-btn full" onClick={()=>startConversation(selectedGig)}><MessageCircle size={17}/> Contact Seller · Discuss price</button><div className="modal-bottom"><div><small>Starting at</small><strong>{money(selectedGig.price)}</strong></div>{activeMode==="buyer"||!profile?<button className="btn btn-dark" onClick={()=>{if(!session){setSelectedGig(null);navigate("auth");show("Please log in as a buyer to continue.");}else setPage("checkout");}}>Continue <ArrowRight size={17}/></button>:<span className="subtext">Log in as a buyer to order</span>}</div>{page==="checkout"&&<div className="checkout-box"><button className="back-link" onClick={()=>setPage("home")}>← Back to gig details</button><h3>Final step · Checkout</h3><p className="subtext">Review your requirements first. Payment is shown only at this final stage.</p><label>Project requirements<textarea rows="3" value={orderDetails} onChange={e=>setOrderDetails(e.target.value)} placeholder="Tell the seller what you need..."/></label><div className="payment-options"><p className="payment-group-title">Pakistan</p>{["JazzCash","Easypaisa"].map(method=><button type="button" key={method} className={selectedPayment===method?"payment-option selected":"payment-option"} onClick={()=>setSelectedPayment(method)}><span>{method}</span><strong>{selectedPayment===method?"Selected":"Select"}</strong></button>)}<p className="payment-group-title">International</p>{["Visa / Mastercard","PayPal","International bank transfer"].map(method=><button type="button" key={method} className={selectedPayment===method?"payment-option selected":"payment-option"} onClick={()=>setSelectedPayment(method)}><span>{method}</span><strong>{selectedPayment===method?"Selected":"Select"}</strong></button>)}</div><section className="protection-policy"><h4>Skill Bridge payment protection</h4><ul><li><strong>50% after completion:</strong> paid when the work is finished.</li><li>Payments are intended to be held by Skill Bridge and released to the worker after the buyer confirms completion, subject to the approved payment provider and applicable rules.</li></ul><p><strong>Account safety:</strong> when an account receives three complaints, Skill Bridge will investigate the case. If the investigation confirms any violation of Skill Bridge rules, the account will be permanently banned. Complaints alone do not prove wrongdoing; evidence will be reviewed before action.</p><small>Planned policy only. Payment holding, release, strikes and bans are not active yet.</small></section><div className="payment-unavailable"><strong>Payment service is currently unavailable.</strong><span>Please try again later. No payment has been taken.</span></div><button className="btn btn-dark full" onClick={placeOrder}>Continue to payment · {money(selectedGig.price)}</button></div>}</div></div>}

    <footer className="footer"><div className="footer-brand"><span className="brand-mark"><Sparkles size={17}/></span><span className="brand-wordmark"><span>skill<span className="brand-accent">bridge</span></span><small>Made by Yousaf</small></span></div><p>A place where skills meet opportunity.</p><div className="footer-bottom"><span>© {new Date().getFullYear()} Skill Bridge · A place where skills meet opportunity</span><span>Payment options listed · Service unavailable</span></div></footer>
  </div>;
}

function GigCard({gig,onClick}) {
  const palettes = ["art-purple","art-blue","art-orange","art-green"];
  const index = (gig.title?.length || 0) % palettes.length;
  return <button className="gig-card" onClick={onClick}><div className={`gig-art ${palettes[index]}`}><Sparkles size={28}/><span>{gig.category}</span></div><div className="gig-info"><div className="seller-line">{gig.profiles?.avatar_url?<img className="avatar gig-seller-avatar" src={gig.profiles.avatar_url} alt=""/>:<span className="avatar">{(gig.profiles?.full_name||"S").slice(0,1).toUpperCase()}</span>}<span>{gig.profiles?.full_name||"Skill Bridge seller"}</span><span className="seller-tag">Seller</span></div><h3>{gig.title}</h3><div className="gig-meta"><span><Clock3 size={14}/> {gig.delivery_days} days</span><span><Star size={14}/> New seller</span></div><div className="gig-price"><small>STARTING AT</small><strong>{money(gig.price)}</strong></div></div></button>;
}

function OrderCard({order,userId,onUpdate,onMessage,onReview,reviewForm,setReviewForm}) {
  const buyer = order.buyer_id === userId;
  return <div className="order-card"><div className="order-main"><div className="order-icon"><PackageCheck/></div><div className="order-info"><h3>{order.gigs?.title || "Marketplace service"}</h3><p>{buyer?`Seller: ${order.seller?.full_name || "Member"}`:`Buyer: ${order.buyer?.full_name || "Member"}`}</p><div className="order-tags"><span className={`status ${order.status}`}>{order.status}</span><span className="status simulated">Demo payment</span></div></div><strong>{money(order.amount)}</strong></div><div className="order-actions"><button className="outline-btn" onClick={()=>onMessage(order)}><MessageCircle size={15}/> Message</button>{!buyer&&order.status==="pending"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"in_progress")}>Accept order</button>}{!buyer&&order.status==="in_progress"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"delivered")}>Mark delivered</button>}{buyer&&order.status==="delivered"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"completed")}>Approve & complete</button>}</div>{buyer&&order.status==="completed"&&<form className="review-inline" onSubmit={e=>onReview(e,order)}><select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:e.target.value})}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Write a short review" required/><button className="outline-btn">Submit review</button></form>}</div>;
}

function Empty({icon,title,text}) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }

createRoot(document.getElementById("root")).render(<App/>);
