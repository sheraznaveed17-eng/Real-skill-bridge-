import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search, BriefcaseBusiness, UserRound, Plus, LogOut, Menu, X, Star,
  MessageCircle, LayoutDashboard, ShieldCheck, ArrowRight, CheckCircle2,
  Clock3, Wallet, Sparkles, Filter, PackageCheck, Send, ChevronRight
} from "lucide-react";
import { supabase, isConfigured } from "./supabase";
import "./style.css";

const categories = ["All", "Graphics & Design", "Writing & Translation", "Programming & Tech", "Video & Animation", "Digital Marketing", "Business"];
const money = n => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("home");
  const [gigs, setGigs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email:"", password:"", name:"", role:"buyer" });
  const [gigForm, setGigForm] = useState({ title:"", description:"", category:"Graphics & Design", price:"", delivery_days:"3" });
  const [orderDetails, setOrderDetails] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating:"5", comment:"" });

  const demoMode = !isConfigured;

  useEffect(() => {
    if (!isConfigured) {
      setGigs([]);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) loadProfile(next.user);
      else { setProfile(null); setOrders([]); }
    });
    loadGigs();
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadGigs();
      loadOrders();
    }
  }, [session]);

  const loadProfile = async user => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) setProfile(data);
    else {
      const fallback = { id:user.id, full_name:user.user_metadata?.full_name || user.email?.split("@")[0], role:user.user_metadata?.role || "buyer" };
      const { data: created } = await supabase.from("profiles").upsert(fallback).select().single();
      setProfile(created || fallback);
    }
  };

  const loadGigs = async () => {
    const { data, error } = await supabase.from("gigs").select("*, profiles(full_name, avatar_url)").eq("is_active", true).order("created_at", { ascending:false });
    if (!error) setGigs(data || []);
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
  const navigate = p => { setPage(p); setMobileMenu(false); setSelectedGig(null); };

  const signUpOrIn = async e => {
    e.preventDefault(); setBusy(true);
    if (demoMode) { show("Pehle Supabase free project connect karein. Setup README mein hai."); setBusy(false); return; }
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email:authForm.email, password:authForm.password,
          options:{ data:{ full_name:authForm.name, role:authForm.role } }
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

  const signOut = async () => { if (!demoMode) await supabase.auth.signOut(); navigate("home"); show("You have logged out."); };

  const createGig = async e => {
    e.preventDefault();
    if (!profile || demoMode) return show("Gig publish karne ke liye account aur Supabase connection zaroori hai.");
    setBusy(true);
    const { error } = await supabase.from("gigs").insert({
      seller_id:session.user.id, title:gigForm.title.trim(), description:gigForm.description.trim(),
      category:gigForm.category, price:Number(gigForm.price), delivery_days:Number(gigForm.delivery_days)
    });
    if (error) show(error.message);
    else { show("Your gig is now published!"); setGigForm({title:"",description:"",category:"Graphics & Design",price:"",delivery_days:"3"}); await loadGigs(); navigate("my-gigs"); }
    setBusy(false);
  };

  const placeOrder = async () => {
    if (!session?.user || !profile) return show("Order place karne ke liye pehle login karein.");
    if (selectedGig.seller_id === session.user.id) return show("Aap apni gig khud order nahi kar sakte.");
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      gig_id:selectedGig.id, buyer_id:session.user.id, seller_id:selectedGig.seller_id,
      requirements:orderDetails, amount:selectedGig.price, status:"pending", payment_status:"simulated"
    });
    if (error) show(error.message);
    else { show("Demo checkout successful — koi real payment nahi hui."); await loadOrders(); setSelectedGig(null); navigate("orders"); }
    setBusy(false);
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

  const myGigs = gigs.filter(g => g.seller_id === session?.user?.id);
  const myOrders = orders.filter(o => o.buyer_id === session?.user?.id || o.seller_id === session?.user?.id);
  const isAdmin = profile?.role === "admin";

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")}><span className="brand-mark"><Sparkles size={20}/></span><span>skill<span className="brand-accent">bridge</span></span></button>
      <div className="desktop-nav">
        <button onClick={() => navigate("home")}>Explore</button>
        <button onClick={() => navigate("orders")}>Orders</button>
        {profile?.role === "seller" && <button onClick={() => navigate("my-gigs")}>My Gigs</button>}
      </div>
      <div className="top-actions">
        <button className="icon-btn mobile-only" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button>
        {session ? <>
          <button className="nav-plain" onClick={() => navigate("dashboard")}><LayoutDashboard size={17}/> Dashboard</button>
          <button className="profile-pill" onClick={() => navigate("dashboard")}><span className="avatar">{(profile?.full_name || "U").slice(0,1).toUpperCase()}</span><span>{profile?.full_name || "My account"}</span></button>
          <button className="icon-btn" title="Logout" onClick={signOut}><LogOut size={18}/></button>
        </> : <><button className="nav-plain" onClick={() => {setAuthMode("login");navigate("auth");}}>Log in</button><button className="btn btn-dark btn-small" onClick={() => {setAuthMode("signup");navigate("auth");}}>Join Skill Bridge</button></>}
      </div>
    </header>
    {mobileMenu && <div className="mobile-menu"><button onClick={()=>navigate("home")}>Explore</button><button onClick={()=>navigate("orders")}>Orders</button><button onClick={()=>navigate("dashboard")}>Dashboard</button></div>}
    {demoMode && <div className="setup-banner"><span><Sparkles size={15}/> Setup required: connect your free Supabase project to enable real multi-user features.</span><button onClick={()=>show("README.md mein Android setup ke simple steps diye gaye hain.")}>How to connect</button></div>}
    {notice && <div className="toast"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice("")}><X size={16}/></button></div>}

    {page === "home" && <>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot"></span> THE FREELANCE MARKETPLACE</div>
          <h1>Find the right talent.<br/><span>Make great work happen.</span></h1>
          <p>Discover skilled freelancers, share what you do best, and turn ideas into real results — all in one place.</p>
          <div className="hero-search"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try “logo design”, “website”, “video editing”..."/><button onClick={()=>document.getElementById("explore")?.scrollIntoView({behavior:"smooth"})}>Search</button></div>
          <div className="popular">Popular: <button onClick={()=>{setSearch("logo");setCategory("Graphics & Design")}}>Logo design</button><button onClick={()=>{setSearch("website");setCategory("Programming & Tech")}}>Website</button><button onClick={()=>{setSearch("video");setCategory("Video & Animation")}}>Video editing</button></div>
          <div className="hero-stats"><div><strong>One place</strong><span>for skills & projects</span></div><div><strong>Simple</strong><span>order management</span></div><div><strong>Free to explore</strong><span>college project platform</span></div></div>
        </div>
        <div className="hero-orb orb-one"></div><div className="hero-orb orb-two"></div>
      </section>
      <section className="trust-strip"><span><ShieldCheck size={18}/> Student project marketplace</span><span><CheckCircle2 size={18}/> Simulated checkout</span><span><MessageCircle size={18}/> Buyer-seller messaging</span></section>
      <main className="content" id="explore">
        <div className="section-heading"><div><div className="eyebrow muted">DISCOVER SERVICES</div><h2>Explore the marketplace</h2><p>Find a service that moves your project forward.</p></div><button className="outline-btn" onClick={()=>{setSearch("");setCategory("All")}}><Filter size={16}/> Clear filters</button></div>
        <div className="category-row">{categories.map(c=><button key={c} className={category===c?"category active":"category"} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="gig-grid">{filteredGigs.map(g=><GigCard key={g.id} gig={g} onClick={()=>setSelectedGig(g)}/> )}</div>
        {!filteredGigs.length && <Empty icon={<BriefcaseBusiness/>} title="No services found yet" text={demoMode?"Connect Supabase, then sellers can publish gigs here.":"Try another search, or be the first seller to publish a service."}/>}
        {profile?.role === "seller" && <div className="join-banner"><div><h3>Ready to offer your skills?</h3><p>Create a service listing and let buyers discover what you do best.</p></div><button className="btn btn-dark" onClick={()=>navigate("create-gig")}><Plus size={17}/> Create a gig</button></div>}
      </main>
    </>}

    {page === "auth" && <main className="narrow-page"><div className="auth-card"><div className="auth-logo"><span className="brand-mark"><Sparkles size={20}/></span></div><div className="eyebrow muted">WELCOME TO SKILL BRIDGE</div><h2>{authMode==="signup"?"Create your account":"Welcome back"}</h2><p className="subtext">{authMode==="signup"?"Join the community of buyers and independent sellers.":"Log in to manage your projects and services."}</p>
      <form onSubmit={signUpOrIn} className="stack-form">
        {authMode==="signup" && <><label>Full name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label><label>I want to<select value={authForm.role} onChange={e=>setAuthForm({...authForm,role:e.target.value})}><option value="buyer">Hire freelancers (Buyer)</option><option value="seller">Offer my services (Seller)</option></select></label></>}
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

    {page === "dashboard" && <main className="content page-content"><div className="eyebrow muted">YOUR WORKSPACE</div><h2>Hello, {profile?.full_name || "there"} 👋</h2><p className="subtext">Here is your Skill Bridge account overview.</p><div className="dashboard-grid"><div className="metric-card"><span>My active orders</span><strong>{myOrders.filter(o=>!["completed","cancelled"].includes(o.status)).length}</strong><small><Clock3 size={14}/> Orders in progress</small></div><div className="metric-card"><span>{profile?.role==="seller"?"Published gigs":"Orders placed"}</span><strong>{profile?.role==="seller"?myGigs.length:myOrders.filter(o=>o.buyer_id===session?.user?.id).length}</strong><small><BriefcaseBusiness size={14}/> Your activity</small></div><div className="metric-card"><span>Account type</span><strong className="role-value">{profile?.role || "Member"}</strong><small><UserRound size={14}/> Skill Bridge member</small></div></div><div className="quick-actions"><button onClick={()=>navigate("orders")}><PackageCheck/> View orders <ChevronRight/></button>{profile?.role==="seller"&&<button onClick={()=>navigate("my-gigs")}><BriefcaseBusiness/> Manage gigs <ChevronRight/></button>}<button onClick={()=>navigate("home")}><Search/> Explore services <ChevronRight/></button>{isAdmin&&<button onClick={()=>navigate("admin")}><ShieldCheck/> Admin panel <ChevronRight/></button>}</div></main>}

    {page === "messages" && <main className="content page-content"><button className="back-link" onClick={()=>navigate("orders")}>← Back to orders</button><h2>Order conversation</h2><p className="subtext">Messages stay connected to this order.</p><div className="chat-panel"><div className="chat-head"><MessageCircle/> {activeOrder?.gigs?.title || "Project messages"}</div><div className="chat-body">{messages.map(m=><div key={m.id} className={m.sender_id===session?.user?.id?"chat-msg own":"chat-msg"}><strong>{m.profiles?.full_name || (m.sender_id===session?.user?.id?"You":"Member")}</strong><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString()}</small></div>)}{!messages.length&&<div className="empty-chat">No messages yet. Start the conversation below.</div>}</div><form className="chat-compose" onSubmit={sendMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Write a message..." required/><button className="btn btn-dark"><Send size={17}/></button></form></div></main>}

    {page === "admin" && <main className="content page-content"><div className="eyebrow muted">ADMINISTRATION</div><h2>Admin overview</h2><p className="subtext">Basic marketplace moderation view.</p><div className="dashboard-grid"><div className="metric-card"><span>Total active gigs</span><strong>{gigs.length}</strong></div><div className="metric-card"><span>Total orders</span><strong>{orders.length}</strong></div><div className="metric-card"><span>Marketplace members</span><strong>—</strong><small>Use Supabase dashboard for user management</small></div></div><h3 className="list-title">Recent gigs</h3>{gigs.slice(0,10).map(g=><div className="admin-row" key={g.id}><div><strong>{g.title}</strong><small>{g.profiles?.full_name} · {g.category}</small></div><strong>{money(g.price)}</strong><button className="outline-btn" onClick={async()=>{const {error}=await supabase.from("gigs").update({is_active:false}).eq("id",g.id);if(error)show(error.message);else{show("Gig deactivated.");loadGigs();}}}>Deactivate</button></div>)}</main>}

    {selectedGig && <div className="modal-backdrop" onClick={()=>setSelectedGig(null)}><div className="gig-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedGig(null)}><X/></button><div className="gig-art large-art"><Sparkles size={34}/></div><div className="eyebrow muted">{selectedGig.category}</div><h2>{selectedGig.title}</h2><div className="seller-line"><span className="avatar">{(selectedGig.profiles?.full_name||"S").slice(0,1).toUpperCase()}</span><strong>{selectedGig.profiles?.full_name || "Skill Bridge seller"}</strong><span className="seller-tag">Seller</span></div><p>{selectedGig.description}</p><div className="gig-facts"><span><Clock3 size={16}/> {selectedGig.delivery_days} day delivery</span><span><ShieldCheck size={16}/> Simulated checkout</span></div><div className="modal-bottom"><div><small>Starting at</small><strong>{money(selectedGig.price)}</strong></div>{profile?.role==="buyer"||!profile?<button className="btn btn-dark" onClick={()=>{if(!session){setSelectedGig(null);navigate("auth");show("Please log in as a buyer to continue.");}else setPage("checkout");}}>Continue <ArrowRight size={17}/></button>:<span className="subtext">Log in as a buyer to order</span>}</div>{page==="checkout"&&<div className="checkout-box"><h3>Confirm your demo order</h3><label>Project requirements<textarea rows="3" value={orderDetails} onChange={e=>setOrderDetails(e.target.value)} placeholder="Tell the seller what you need..."/></label><div className="demo-payment"><Wallet size={18}/><div><strong>Demo checkout</strong><small>No real money is charged. No card details are requested.</small></div><span>TEST</span></div><button className="btn btn-dark full" disabled={busy} onClick={placeOrder}>Place demo order · {money(selectedGig.price)}</button></div>}</div></div>}

    <footer className="footer"><div className="footer-brand"><span className="brand-mark"><Sparkles size={17}/></span> skill<span className="brand-accent">bridge</span></div><p>A place where skills meet opportunity.</p><div className="footer-bottom"><span>© {new Date().getFullYear()} Skill Bridge · College project</span><span>Demo checkout · No real payments</span></div></footer>
  </div>;
}

function GigCard({gig,onClick}) {
  const palettes = ["art-purple","art-blue","art-orange","art-green"];
  const index = (gig.title?.length || 0) % palettes.length;
  return <button className="gig-card" onClick={onClick}><div className={`gig-art ${palettes[index]}`}><Sparkles size={28}/><span>{gig.category}</span></div><div className="gig-info"><div className="seller-line"><span className="avatar">{(gig.profiles?.full_name||"S").slice(0,1).toUpperCase()}</span><span>{gig.profiles?.full_name||"Skill Bridge seller"}</span><span className="seller-tag">Seller</span></div><h3>{gig.title}</h3><div className="gig-meta"><span><Clock3 size={14}/> {gig.delivery_days} days</span><span><Star size={14}/> New seller</span></div><div className="gig-price"><small>STARTING AT</small><strong>{money(gig.price)}</strong></div></div></button>;
}

function OrderCard({order,userId,onUpdate,onMessage,onReview,reviewForm,setReviewForm}) {
  const buyer = order.buyer_id === userId;
  return <div className="order-card"><div className="order-main"><div className="order-icon"><PackageCheck/></div><div className="order-info"><h3>{order.gigs?.title || "Marketplace service"}</h3><p>{buyer?`Seller: ${order.seller?.full_name || "Member"}`:`Buyer: ${order.buyer?.full_name || "Member"}`}</p><div className="order-tags"><span className={`status ${order.status}`}>{order.status}</span><span className="status simulated">Demo payment</span></div></div><strong>{money(order.amount)}</strong></div><div className="order-actions"><button className="outline-btn" onClick={()=>onMessage(order)}><MessageCircle size={15}/> Message</button>{!buyer&&order.status==="pending"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"in_progress")}>Accept order</button>}{!buyer&&order.status==="in_progress"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"delivered")}>Mark delivered</button>}{buyer&&order.status==="delivered"&&<button className="btn btn-dark btn-small" onClick={()=>onUpdate(order.id,"completed")}>Approve & complete</button>}</div>{buyer&&order.status==="completed"&&<form className="review-inline" onSubmit={e=>onReview(e,order)}><select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:e.target.value})}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Write a short review" required/><button className="outline-btn">Submit review</button></form>}</div>;
}

function Empty({icon,title,text}) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }

createRoot(document.getElementById("root")).render(<App/>);
