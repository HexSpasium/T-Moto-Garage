import { useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bike, Check, ChevronRight,
  CircleHelp, Clock3, Instagram, KeyRound, Menu, Search, ShieldCheck,
  Wrench, X, Zap
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

const showcase = [
  { make: "DUCATI", model: "Panigale V4 S", year: "2024", category: "SUPERSPORT", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=85", tag: "PERFORMANCE" },
  { make: "BMW", model: "S 1000 RR", year: "2023", category: "SUPERSPORT", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1400&q=85", tag: "PRECISION" },
  { make: "YAMAHA", model: "MT-09 SP", year: "2024", category: "HYPER NAKED", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1400&q=85", tag: "ENGINEERING" },
];

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="header">
    <Link to="/" className="brand" onClick={() => setOpen(false)}>
      <span className="brand-mark">T<span>·</span>M</span>
      <span className="brand-copy">T-MOTO <b>GARAGE</b><small>PERFORMANCE / SERVICE / TRUST</small></span>
    </Link>
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menüyü aç">
      {open ? <X /> : <Menu />}
    </button>
    <nav className={open ? "nav nav-open" : "nav"}>
      <a href="/#services" onClick={() => setOpen(false)}>HİZMETLER</a>
      <a href="/#workshop" onClick={() => setOpen(false)}>GARAJ</a>
      <a href="/#tracking" onClick={() => setOpen(false)}>SERVİS TAKİBİ</a>
      <Link className="nav-admin" to="/admin" onClick={() => setOpen(false)}><KeyRound size={15}/> YÖNETİCİ GİRİŞİ</Link>
    </nav>
  </header>;
}

function Footer() {
  return <footer className="footer">
    <div className="footer-top">
      <div className="brand footer-brand"><span className="brand-mark">T<span>·</span>M</span><span className="brand-copy">T-MOTO <b>GARAGE</b><small>EVERY DETAIL MATTERS.</small></span></div>
      <p>Makinenize gösterdiğimiz özen,<br/>yola duyduğumuz saygıdır.</p>
      <a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={17}/> INSTAGRAM <ArrowUpRight size={14}/></a>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} T-MOTO GARAGE</span><span>BUILT FOR THE RIDE.</span><span>ALL SYSTEMS <i className="status-dot"/></span></div>
  </footer>;
}

function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  return <>
    <section className="hero">
      <div className="hero-image"/>
      <div className="hero-grain"/>
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-line"/> MOTORCYCLE CARE / EST. FOR RIDERS</div>
        <h1>BUILT TO<br/><em>PERFORM.</em></h1>
        <p className="hero-sub">Her makinenin bir karakteri var.<br/>Biz onu en iyi halinde tutuyoruz.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#services">GARAJI KEŞFET <ArrowUpRight size={16}/></a>
          <a className="button button-ghost" href="#tracking">SERVİS KAYDINI SORGULA <ArrowDownRight size={16}/></a>
        </div>
      </div>
      <div className="hero-side">SERVICE / REPAIR / PERFORMANCE</div>
      <div className="hero-bottom"><span>01 — CRAFTED FOR THE ROAD</span><span>SCROLL TO EXPLORE <ArrowDownRight size={14}/></span></div>
    </section>

    <section className="ticker" aria-label="Hizmetler"><div className="ticker-track">
      {Array.from({length: 2}).map((_,i) => <span key={i}>PRECISION SERVICE <b>✳</b> MECHANICAL CARE <b>✳</b> PERFORMANCE <b>✳</b> RIDER FIRST <b>✳</b></span>)}
    </div></section>

    <section className="section intro" id="workshop">
      <div className="section-index">01 / THE GARAGE</div>
      <div className="intro-copy"><p className="eyebrow">MORE THAN A WORKSHOP</p><h2>MAKİNENİZİN<br/><em>RİTMİNİ</em> BİLİRİZ.</h2></div>
      <div className="intro-note"><p>Bakım ve onarımı bir işlem değil, bir sorumluluk olarak görüyoruz. Her müdahale kayıt altında. Her detay şeffaf.</p><a className="text-link" href="#services">YAKLAŞIMIMIZ <ArrowUpRight size={15}/></a></div>
    </section>

    <section className="showcase-section" id="services">
      <div className="section-heading"><div><p className="eyebrow">02 / OUR EXPERTISE</p><h2>HER MARKA.<br/><em>AYNI ÖZEN.</em></h2></div><span className="heading-side">ENGINEERED TO KEEP<br/>YOU MOVING.</span></div>
      <div className="bike-grid">{showcase.map((bike, i) => <article className="bike-card" key={bike.model}>
        <div className="bike-image"><img src={bike.image} alt={bike.make + " " + bike.model}/><span className="bike-number">0{i+1}</span><span className="bike-tag">{bike.tag}</span></div>
        <div className="bike-meta"><span>{bike.category} / {bike.year}</span><span>0{i+1} — 03</span></div>
        <h3>{bike.make} <b>{bike.model}</b></h3>
      </article>)}</div>
      <p className="showcase-footnote">TÜM MARKA VE MODELLER İÇİN BAKIM / ONARIM DESTEĞİ</p>
    </section>

    <section className="service-band">
      <div className="service-band-image"/>
      <div className="service-band-content"><p className="eyebrow">PRECISION IS NOT OPTIONAL</p><h2>DETAILS MAKE<br/><em>THE DIFFERENCE.</em></h2><p>Doğru teşhis. Nitelikli işçilik. Şeffaf servis geçmişi.</p><a className="button button-primary" href="#tracking">SERVİS SÜRECİNİ İNCELE <ArrowRight size={16}/></a></div>
    </section>

    <section className="tracking-section" id="tracking">
      <div className="tracking-copy"><p className="eyebrow">03 / DIGITAL SERVICE HISTORY</p><h2>HER ŞEY<br/><em>KAYIT ALTINDA.</em></h2><p>Motosikletinize ait servis geçmişine plaka veya size özel servis koduyla güvenli şekilde ulaşın.</p></div>
      <form className="tracking-form" onSubmit={(e) => {e.preventDefault(); if(query.trim()) navigate("/takip/" + encodeURIComponent(query.trim()));}}>
        <label htmlFor="tracking-query">PLAKA / SERVİS KODU</label>
        <div className="tracking-input"><Search size={18}/><input id="tracking-query" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Örn. 34 ABC 123" required/><button aria-label="Sorgula"><ArrowUpRight/></button></div>
        <small><ShieldCheck size={14}/> Servis bilgileri kontrollü olarak paylaşılır.</small>
      </form>
    </section>
  </>;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    if (!supabaseConfigured) { setError("Supabase bağlantısı yapılandırılmamış. .env dosyasını kontrol edin."); setBusy(false); return; }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    else navigate("/admin/panel");
    setBusy(false);
  }

  return <main className="admin-page"><div className="admin-backdrop"/>
    <div className="admin-card"><Link to="/" className="back-link">← ANA SAYFA</Link><div className="admin-symbol"><KeyRound size={22}/></div>
      <p className="eyebrow">T-MOTO GARAGE / CONTROL ROOM</p><h1>YÖNETİCİ<br/><em>GİRİŞİ.</em></h1>
      <p className="muted">Servis operasyonlarını yönetmek için oturum açın.</p>
      <form onSubmit={submit} className="admin-form">
        <label>E-POSTA<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@tmotogarage.com" required/></label>
        <label>ŞİFRE<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••••" required/></label>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary full-button" disabled={busy}>{busy ? "GİRİŞ YAPILIYOR..." : "GÜVENLİ GİRİŞ YAP"} <ArrowUpRight size={16}/></button>
      </form>
      <div className="admin-secure"><ShieldCheck size={15}/> KORUMALI YÖNETİCİ OTURUMU</div>
    </div>
  </main>;
}

function TrackingResult() {
  const { token } = useMemo(() => ({ token: decodeURIComponent(window.location.pathname.split("/").pop() || "") }), []);
  return <main className="not-found"><div className="not-found-icon"><CircleHelp size={28}/></div><p className="eyebrow">DIGITAL SERVICE RECORD</p><h1>KAYIT<br/><em>DOĞRULANAMADI.</em></h1><p>Bu servis koduna ait yayınlanmış bir kayıt bulunamadı. Kodunuzu kontrol ederek yeniden deneyin.</p><Link className="button button-primary" to="/">ANA SAYFAYA DÖN <ArrowRight size={16}/></Link></main>;
}

function AdminPanel() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useMemo(() => {
    if (!supabase) { setLoading(false); setError("Supabase yapılandırması eksik."); return; }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setLoading(false); });
    const {data} = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => data.subscription.unsubscribe();
  }, []);
  if (loading) return <main className="not-found">YÜKLENİYOR...</main>;
  if (!session) return <AdminLogin/>;
  return <main className="admin-page"><div className="admin-card"><p className="eyebrow">T-MOTO GARAGE / CONTROL ROOM</p><h1>YÖNETİM<br/><em>PANELİ.</em></h1><p className="muted">Oturum açıldı: {session.user.email}</p><div className="panel-placeholder"><Wrench/><div><b>Operasyon paneli hazırlanıyor.</b><span>Araç kayıtları ve servis akışları veritabanı kurulumu tamamlandığında burada görünecek.</span></div></div><button className="button button-ghost full-button" onClick={()=>supabase.auth.signOut()}>GÜVENLİ ÇIKIŞ</button></div></main>;
}

function App() {
  return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/admin" element={<AdminLogin/>}/><Route path="/admin/panel" element={<AdminPanel/>}/><Route path="/takip/:token" element={<TrackingResult/>}/><Route path="*" element={<main className="not-found"><h1>404</h1><Link className="button button-primary" to="/">ANA SAYFA</Link></main>}/></Routes><Footer/></>;
}

export default App;