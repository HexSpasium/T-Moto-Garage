import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bike, Check, ChevronRight,
  CircleHelp, Clock3, Instagram, KeyRound, Menu, Search, ShieldCheck,
  Wrench, X, Zap
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";
import AdminPanel from "./admin/AdminPanel";

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
      <span className="brand-copy">T-MOTO <b>GARAGE</b><small>PERFORMANCE / SERVICE / TRUST</small></span><span className="brand-owner"><small>İŞLETME SAHİBİ</small><strong>MAHMUT BERK DEMİRKALE</strong></span>
    </Link>
    <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menüyü aç">
      {open ? <X /> : <Menu />}
    </button>
    <nav className={open ? "nav nav-open" : "nav"}>
      <a href={`${import.meta.env.BASE_URL}#services`} onClick={() => setOpen(false)}>HİZMETLER</a>
      <a href={`${import.meta.env.BASE_URL}#workshop`} onClick={() => setOpen(false)}>GARAJ</a>
      <a href={`${import.meta.env.BASE_URL}#tracking`} onClick={() => setOpen(false)}>SERVİS TAKİBİ</a>
      <Link className="nav-admin" to="/admin" onClick={() => setOpen(false)}><KeyRound size={15}/> YÖNETİCİ GİRİŞİ</Link>
    </nav>
  </header>;
}

function Footer() {
  return <footer className="footer">
    <div className="footer-top">
      <div className="brand footer-brand"><span className="brand-mark">T<span>·</span>M</span><span className="brand-copy">T-MOTO <b>GARAGE</b><small>EVERY DETAIL MATTERS.</small></span><span className="brand-owner"><small>İŞLETME SAHİBİ</small><strong>MAHMUT BERK DEMİRKALE</strong></span></div>
      <p>Makinenize gösterdiğimiz özen,<br/>yola duyduğumuz saygıdır.</p>
      <a className="social-link" href="https://www.instagram.com/t_moto_garage" target="_blank" rel="noreferrer"><Instagram size={17}/> INSTAGRAM <ArrowUpRight size={14}/></a>
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
      <div className="intro-note"><p>Bakım ve onarımı bir işlem değil, bir sorumluluk olarak görüyoruz. Her müdahale kayıt altında. Her detay şeffaf.</p><a className="text-link" href="#about">HAKKIMIZDA <ArrowUpRight size={15}/></a></div>
    </section>

    <section className="section business-about" id="about">
      <div className="business-about-heading"><p className="eyebrow">T-MOTO GARAGE / ABOUT & CONTACT</p><h2>GÜVENİLİR<br/><em>MOTOSİKLET SERVİSİ.</em></h2><p>Mahmut Berk DEMİRKALE yönetiminde; bakım, onarım ve servis hizmetleri.</p></div>
      <div className="business-about-grid">
        <div className="business-services"><span className="business-kicker">01 / HİZMETLER</span><ul><li>Fren servisi ve tamiri</li><li>Karbüratör temizliği</li><li>Teslimat</li><li>Elektrik tamiri</li><li>Motor tamiri</li><li>Yağ değişimi</li><li>Direksiyon ve süspansiyon tamiri</li><li>Lastikler</li><li>Tekerlek ayarı</li></ul></div>
        <div className="business-contact"><span className="business-kicker">02 / İLETİŞİM & KONUM</span><h3>MAHMUT BERK DEMİRKALE</h3><a className="business-phone" href="tel:+905309743247">0530 974 32 47 <ArrowUpRight size={15}/></a><p>Turgutreis, Cengiz Topel Cd. NO:79,<br/>33000 Akdeniz / Mersin</p><a className="button button-primary" href="https://www.google.com/maps?udm&fvr=1&pvq=Cg0vZy8xMXo4c2N0Y3cxIhMKDXQtbW90byBnYXJhZ2UQAhgD&lqi=Cg10LW1vdG8gZ2FyYWdlSOHe8oWjvoCACFobEAAQARACGAAYARgCIg10IG1vdG8gZ2FyYWdlkgEWbW90b3JjeWNsZV9yZXBhaXJfc2hvcA&vet=10CAAQoqAOahcKEwjg5N31zI-YAxUAAAAAHQAAAAAQDQ..i&cs=0&um=1&ie=UTF-8&fb=1&gl=tr&sa=X&ftid=0x1527f39006624055:0x33fbef0c05dbc332" target="_blank" rel="noreferrer">HARİTADA YOL TARİFİ <ArrowUpRight size={15}/></a></div>
      </div>
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
      <form className="tracking-form" onSubmit={(e) => {e.preventDefault(); if(query.trim()) { const value=query.trim(); const isQr=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); navigate(isQr?"/takip/"+encodeURIComponent(value):"/plaka-sorgula?plate="+encodeURIComponent(value)); }}}>
        <label htmlFor="tracking-query">PLAKA / QR KODU</label>
        <div className="tracking-input"><Search size={18}/><input id="tracking-query" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Örn. 34 ABC 123 veya QR kodu" required/><button aria-label="Sorgula"><ArrowUpRight/></button></div>
        <small><ShieldCheck size={14}/> Plaka sorgusunda yalnızca yayınlanmış servis bilgileri gösterilir.</small>
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
  const { token } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !token) {
        setError("Servis kaydı bağlantısı henüz hazır değil.");
        setLoading(false);
        return;
      }
      const { data: response, error: lookupError } = await supabase.functions.invoke("plate-service-lookup", { body: { qr_token: token } });
      const data = response?.history;
      const rpcError = lookupError;
      if (!active) return;
      if (rpcError) setError("Servis kaydı şu anda görüntülenemiyor.");
      else if (!data) setError("Bu QR koduna ait yayınlanmış servis kaydı bulunamadı.");
      else setRecord(data);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [token]);

  const labels = {
    received: "Servise kabul edildi", inspection: "Arıza tespiti",
    waiting_approval: "Onay bekleniyor", waiting_parts: "Parça bekleniyor",
    in_progress: "Onarım devam ediyor", quality_check: "Son kontrol",
    ready_for_pickup: "Teslime hazır", delivered: "Müşteriye teslim edildi",
    cancelled: "İşlem iptal edildi"
  };

  if (loading) return <main className="not-found"><p className="eyebrow">DIGITAL SERVICE RECORD</p><h1>KAYIT<br/><em>YÜKLENİYOR.</em></h1></main>;
  if (error) return <main className="not-found"><div className="not-found-icon"><CircleHelp size={28}/></div><p className="eyebrow">DIGITAL SERVICE RECORD</p><h1>KAYIT<br/><em>BULUNAMADI.</em></h1><p>{error}</p><Link className="button button-primary" to="/">ANA SAYFAYA DÖN <ArrowRight size={16}/></Link></main>;

  const vehicle = record.vehicle || {};
  const records = record.records || [];
  return <main className="record-page">
    <section className="record-hero">
      <p className="eyebrow">T-MOTO GARAGE / DIGITAL SERVICE HISTORY</p>
      <div className="record-vehicle-summary"><div className="record-vehicle-copy"><h1>{vehicle.make}<br/><em>{vehicle.model}</em></h1><div className="record-meta"><span>{vehicle.production_year || "—"} MODEL</span><span>PLAKA: {vehicle.plate}</span></div></div>{(vehicle.images || []).length > 0 && <button className="record-vehicle-thumb" onClick={() => setLightbox(vehicle.images[0])}><img src={vehicle.images[0].url} alt={vehicle.images[0].caption || (vehicle.make + " " + vehicle.model)}/><span>FOTOĞRAFI BÜYÜT</span></button>}</div>}
    </section>
    <section className="record-list">
      <div className="record-heading"><div><p className="eyebrow">VERIFIED WORKSHOP LOG</p><h2>SERVİS <em>GEÇMİŞİ.</em></h2></div><span>{records.length} KAYIT</span></div>
      {records.length === 0 ? <p className="record-empty">Bu motosiklet için henüz yayınlanmış servis kaydı bulunmuyor.</p> : records.map((item) => <article className="record-card" key={item.service_number}>
        <div className="record-card-top"><span>#{item.service_number}</span><b>{labels[item.status] || item.status}</b></div>
        <div className="record-dates"><span>GİRİŞ <b>{new Date(item.received_at).toLocaleString("tr-TR")}</b></span>{item.delivered_at && <span>TESLİM <b>{new Date(item.delivered_at).toLocaleString("tr-TR")}</b></span>}</div>
        {item.work_summary && <p>{item.work_summary}</p>}
        {(item.events || []).length > 0 && <div className="record-events">{item.events.map((event, index) => <div className="record-event" key={index}><i/><div><b>{event.title}</b><small>{new Date(event.occurred_at).toLocaleString("tr-TR")}</small>{event.description && <p>{event.description}</p>}</div></div>)}</div>}
        {(item.parts || []).length > 0 && <div className="record-parts"><h3>PARÇA / İŞLEM DETAYLARI</h3>{item.parts.map((part,index)=><div key={index}><span>{part.part_name} <small>· {part.category}</small></span><b>{part.action} × {part.quantity}</b></div>)}</div>}{(item.media || []).length > 0 && <div className="record-service-media"><h3>SERVİS / PARÇA FOTOĞRAFLARI</h3><div>{item.media.map((img,index)=><button key={index} onClick={() => setLightbox(img)}><img src={img.url} alt={img.caption || "Servis fotoğrafı"}/><span>{img.caption || "Görüntüle"}</span></button>)}</div></div>}
      </article>)}
    </section>
    {lightbox && <div className="record-lightbox" onClick={() => setLightbox(null)}><button className="record-lightbox-close">×</button><img src={lightbox.url} alt={lightbox.caption || "Fotoğraf"}/></div>}
  </main>;
}


function PlateLookup() {
 const [params]=useSearchParams();
 const [plate,setPlate]=useState(params.get("plate")||"");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [record,setRecord]=useState(null);
 const [lightbox,setLightbox]=useState(null);
 async function lookup(e){
  e.preventDefault();setBusy(true);setError("");setRecord(null);
  try{
   if(!supabase)throw new Error("Sorgulama servisi hazır değil.");
   const normalized=plate.trim().toLocaleUpperCase("tr-TR");
   if(normalized.replace(/[^A-Z0-9]/g,"").length<5)throw new Error("Geçerli bir plaka girin.");
   const {data:r,error:x}=await supabase.functions.invoke("plate-service-lookup",{body:{plate:normalized}});
   if(x)throw new Error("Bu plakaya ait yayınlanmış servis kaydı bulunamadı.");
   if(!r?.history)throw new Error("Bu plakaya ait yayınlanmış servis kaydı bulunamadı.");
   setRecord(r.history);
  }catch(e){setError(e.message||"Sorgulama başarısız oldu.");}
  finally{setBusy(false);}
 }
 const labels={received:"Servise kabul edildi",inspection:"Arıza tespiti",waiting_approval:"Onay bekleniyor",waiting_parts:"Parça bekleniyor",in_progress:"Onarım devam ediyor",quality_check:"Son kontrol",ready_for_pickup:"Teslime hazır",delivered:"Müşteriye teslim edildi",cancelled:"İşlem iptal edildi"};
 return <main className="plate-lookup-page"><div className="plate-lookup-card"><Link to="/" className="back-link">← ANA SAYFA</Link><p className="eyebrow">T-MOTO GARAGE / PLATE LOOKUP</p><h1>PLAKADAN<br/><em>SERVİS TAKİBİ.</em></h1>
 <form className="plate-lookup-form" onSubmit={lookup}><p>QR kodunuz yanınızda değilse aracınızın plakasını girerek yayınlanmış servis geçmişini görüntüleyebilirsiniz.</p><label>ARAÇ PLAKASI<input value={plate} onChange={e=>setPlate(e.target.value.toLocaleUpperCase("tr"))} placeholder="34 ABC 123" required/></label><button className="button button-primary full-button" disabled={busy}>{busy?"SORGULANIYOR...":"SERVİS GEÇMİŞİNİ GÖR"} <ArrowUpRight size={16}/></button></form>
 {record&&<div className="plate-lookup-result"><div className="plate-result-vehicle"><div><small>{record.vehicle?.plate}</small><h2>{record.vehicle?.make} {record.vehicle?.model}</h2><span>{record.vehicle?.production_year||"—"} MODEL</span></div>{record.vehicle?.images?.[0]&&<button className="record-vehicle-thumb" onClick={()=>setLightbox(record.vehicle.images[0])}><img src={record.vehicle.images[0].url} alt="Araç fotoğrafı"/><span>FOTOĞRAFI BÜYÜT</span></button>}</div><h3>YAYINLANMIŞ SERVİS GEÇMİŞİ</h3>{!(record.records||[]).length?<p>Yayınlanmış servis kaydı bulunmuyor.</p>:(record.records||[]).map(item=><article className="record-card" key={item.service_number}><div className="record-card-top"><span>#{item.service_number}</span><b>{labels[item.status]||item.status}</b></div><div className="record-dates"><span>GİRİŞ <b>{new Date(item.received_at).toLocaleString("tr-TR")}</b></span>{item.delivered_at&&<span>TESLİM <b>{new Date(item.delivered_at).toLocaleString("tr-TR")}</b></span>}</div>{item.work_summary&&<p>{item.work_summary}</p>}{(item.parts||[]).length>0&&<div className="record-parts"><h3>PARÇA / İŞLEM DETAYLARI</h3>{item.parts.map((p,i)=><div key={i}><span>{p.part_name} · {p.category}</span><b>{labels[p.action]||p.action} × {p.quantity}</b></div>)}</div>}{(item.media||[]).length>0&&<div className="record-service-media"><h3>SERVİS / PARÇA FOTOĞRAFLARI</h3><div>{item.media.map((img,i)=><button key={i} onClick={()=>setLightbox(img)}><img src={img.url} alt={img.caption||"Servis fotoğrafı"}/><span>{img.caption||"Görüntüle"}</span></button>)}</div></div>}</article>)}</div>}
 {lightbox&&<div className="record-lightbox" onClick={()=>setLightbox(null)}><button className="record-lightbox-close">×</button><img src={lightbox.url} alt={lightbox.caption||"Fotoğraf"}/></div>}
 {error&&<div className="form-error">{error}</div>}<div className="plate-lookup-secure"><ShieldCheck size={15}/> YALNIZCA YAYINLANMIŞ SERVİS BİLGİLERİ GÖSTERİLİR</div></div></main>;
}

function App() {
  return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/admin" element={<AdminLogin/>}/><Route path="/admin/panel" element={<AdminPanel/>}/><Route path="/takip/:token" element={<TrackingResult/>}/><Route path="/plaka-sorgula" element={<PlateLookup/>}/><Route path="*" element={<main className="not-found"><h1>404</h1><Link className="button button-primary" to="/">ANA SAYFA</Link></main>}/></Routes><Footer/></>;
}

export default App;