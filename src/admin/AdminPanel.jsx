import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Bike, Boxes, ClipboardList, LayoutDashboard, LogOut, Plus, RefreshCw, Search, Users, Wrench, X, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const STATUSES = [["received","Servise kabul"],["inspection","Arıza tespiti"],["waiting_approval","Onay bekliyor"],["waiting_parts","Parça bekliyor"],["in_progress","İşlemde"],["quality_check","Son kontrol"],["ready_for_pickup","Teslime hazır"],["delivered","Teslim edildi"],["cancelled","İptal"]];
const statusLabel = (s) => STATUSES.find(([key]) => key === s)?.[1] || s;
const dateLabel = (s) => s ? new Date(s).toLocaleDateString("tr-TR") : "—";

export default function AdminPanel() {
  const [session,setSession] = useState(null), [staff,setStaff] = useState(null);
  const [section,setSection] = useState("overview"), [search,setSearch] = useState("");
  const [data,setData] = useState({customers:[],vehicles:[],services:[],parts:[]});
  const [loading,setLoading] = useState(true), [saving,setSaving] = useState(false);
  const [error,setError] = useState(""), [notice,setNotice] = useState("");
  const [modal,setModal] = useState(false), [form,setForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all([
      supabase.from("customers").select("*").order("created_at",{ascending:false}),
      supabase.from("vehicles").select("*, customers(full_name,phone)").order("created_at",{ascending:false}),
      supabase.from("service_records").select("*, vehicles(make,model,plate)").order("received_at",{ascending:false}),
      supabase.from("parts_catalog").select("*").order("name")
    ]);
    const failed = results.find(x => x.error);
    if (failed) setError(failed.error.message);
    else setData({customers:results[0].data||[],vehicles:results[1].data||[],services:results[2].data||[],parts:results[3].data||[]});
    setLoading(false);
  },[]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const {data:auth} = await supabase.auth.getSession();
      if (!alive) return;
      if (!auth.session) { window.location.assign("/admin"); return; }
      setSession(auth.session);
      const {data:row,error:staffError} = await supabase.from("admin_users").select("role,is_active").eq("user_id",auth.session.user.id).maybeSingle();
      if (!alive) return;
      if (staffError || !row?.is_active) { setError("Bu hesap için aktif yönetici yetkisi bulunamadı."); setLoading(false); return; }
      setStaff(row); await load();
    })();
    const {data:listener} = supabase.auth.onAuthStateChange((_event,current) => { if (!current) window.location.assign("/admin"); });
    return () => { alive=false; listener.subscription.unsubscribe(); };
  },[load]);

  const counts = useMemo(() => ({
    active:data.services.filter(x=>!["delivered","cancelled"].includes(x.status)).length
  }),[data.services]);

  function openForm(kind) {
    const defaults = {
      customer:{full_name:"",phone:"",email:"",notes:""},
      vehicle:{customer_id:"",plate:"",make:"",model:"",production_year:"",mileage_km:"",vin:"",notes:""},
      service:{vehicle_id:"",customer_complaint:"",initial_diagnosis:"",work_summary:"",status:"received",is_published:false},
      part:{name:"",category:"",brand:"",part_number:""}
    };
    setForm({kind,...defaults[kind]}); setModal(true); setError(""); setNotice("");
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError("");
    const {kind,...values} = form;
    let result;
    if (kind==="customer") result = await supabase.from("customers").insert(values);
    if (kind==="vehicle") result = await supabase.from("vehicles").insert({...values,customer_id:values.customer_id||null,production_year:values.production_year?Number(values.production_year):null,mileage_km:values.mileage_km?Number(values.mileage_km):null,created_by:session.user.id});
    if (kind==="part") result = await supabase.from("parts_catalog").insert(values);
    if (kind==="service") {
      result = await supabase.from("service_records").insert({...values,created_by:session.user.id}).select().single();
      if (!result.error) {
        const ev = await supabase.from("service_events").insert({service_record_id:result.data.id,status:values.status,title:statusLabel(values.status),description:"Servis kaydı oluşturuldu.",is_public:Boolean(values.is_published),created_by:session.user.id});
        if (ev.error) setError("Servis açıldı, ancak zaman çizelgesi eklenemedi: "+ev.error.message);
      }
    }
    if (result?.error) setError(result.error.message);
    else { setNotice("Kayıt başarıyla oluşturuldu."); setModal(false); await load(); }
    setSaving(false);
  }

  async function changeStatus(item,status) {
    setError(""); const patch={status};
    if(status==="in_progress") patch.started_at=new Date().toISOString();
    if(status==="ready_for_pickup") patch.completed_at=new Date().toISOString();
    if(status==="delivered") patch.delivered_at=new Date().toISOString();
    const {error:e} = await supabase.from("service_records").update(patch).eq("id",item.id);
    if(e) setError(e.message);
    else {
      const {error:eventError}=await supabase.from("service_events").insert({service_record_id:item.id,status,title:statusLabel(status),description:"Servis durumu yönetim panelinden güncellendi.",is_public:item.is_published,created_by:session.user.id});
      if(eventError) setError("Durum değişti ancak geçmiş kaydı eklenemedi: "+eventError.message);
      else setNotice("Servis durumu güncellendi.");
      await load();
    }
  }
  async function publish(table,item) {
    const {error:e}=await supabase.from(table).update({is_published:!item.is_published}).eq("id",item.id);
    if(e) setError(e.message); else setNotice(item.is_published?"QR sayfasından gizlendi.":"QR sayfasında yayınlandı.");
    await load();
  }
  async function signOut(){await supabase.auth.signOut();window.location.assign("/admin");}

  const menus=[["overview",LayoutDashboard,"Genel Bakış"],["services",ClipboardList,"Servis Kayıtları"],["vehicles",Bike,"Motosikletler"],["customers",Users,"Müşteriler"],["parts",Boxes,"Parça Kataloğu"]];
  const kindBySection={services:"service",vehicles:"vehicle",customers:"customer",parts:"part"};
  const filtered=(items,fields)=>items.filter(item=>fields.some(field=>String(field.split(".").reduce((v,k)=>v?.[k],item)||"").toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))));

  if(!session&&!error) return <main className="tm-admin-loading">GÜVENLİ OTURUM KONTROLÜ...</main>;
  if(error&&!staff) return <main className="tm-admin-loading"><p>{error}</p><button className="tm-button" onClick={signOut}>GİRİŞ SAYFASINA DÖN</button></main>;

  return <main className="tm-admin">
    <aside className="tm-sidebar">
      <a className="tm-admin-brand" href="/"><span>T<span>·</span>M</span><b>T-MOTO<br/>GARAGE</b></a>
      <small className="tm-side-caption">WORKSHOP MANAGEMENT</small>
      <nav>{menus.map(([key,Icon,label])=><button key={key} className={section===key?"active":""} onClick={()=>{setSection(key);setSearch("");setError("");setNotice("");}}><Icon size={17}/>{label}</button>)}</nav>
      <div className="tm-sidebar-bottom"><b>{session?.user?.email}</b><small>{staff?.role?.toUpperCase()}</small><button onClick={signOut}><LogOut size={15}/> Güvenli çıkış</button></div>
    </aside>
    <section className="tm-main">
      <header className="tm-topbar"><div><small>CONTROL ROOM</small><b>{menus.find(x=>x[0]===section)?.[2]}</b></div><button onClick={load}><RefreshCw size={16}/> Yenile</button></header>
      <div className="tm-content">
        <div className="tm-welcome"><div><small>T-MOTO GARAGE / OPERASYON</small><h1>{section==="overview"?"GARAJIN":menus.find(x=>x[0]===section)?.[2].toLocaleUpperCase("tr")} <em>{section==="overview"?"KONTROLÜ.":"YÖNETİMİ."}</em></h1><p>Servis operasyonlarınızı tek merkezden yönetin.</p></div>{section!=="overview"&&<button className="tm-button" onClick={()=>openForm(kindBySection[section])}><Plus size={16}/> Yeni kayıt</button>}</div>
        {error&&<div className="tm-alert"><AlertCircle size={16}/>{error}<button onClick={()=>setError("")}>×</button></div>}
        {notice&&<div className="tm-notice"><CheckCircle2 size={16}/>{notice}<button onClick={()=>setNotice("")}>×</button></div>}
        {section==="overview"&&<>
          <div className="tm-stat-grid"><Stat Icon={ClipboardList} label="Toplam servis" value={data.services.length}/><Stat Icon={Activity} label="Aktif servis" value={counts.active}/><Stat Icon={Bike} label="Motosiklet" value={data.vehicles.length}/><Stat Icon={Users} label="Müşteri" value={data.customers.length}/></div>
          <div className="tm-overview-grid"><div className="tm-panel"><PanelHead title="Son servis kayıtları" action="Tümünü gör →" onClick={()=>setSection("services")}/><ServiceTable items={data.services.slice(0,5)} onStatus={changeStatus}/></div><div className="tm-panel"><PanelHead title="Hızlı işlemler"/>{[["service","Servis kaydı",ClipboardList],["vehicle","Motosiklet",Bike],["customer","Müşteri",Users],["part","Parça",Boxes]].map(([kind,label,Icon])=><button className="tm-quick" key={kind} onClick={()=>openForm(kind)}><Icon size={16}/>{label}<Plus size={14}/></button>)}</div></div>
          <div className="tm-panel"><PanelHead title="Son eklenen motosikletler" action="Motosikletlere git →" onClick={()=>setSection("vehicles")}/><VehicleTable items={data.vehicles.slice(0,5)} onPublish={publish}/></div>
        </>}
        {section==="services"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Servis no, plaka veya model ara"/><ServiceTable items={filtered(data.services,["service_number","vehicles.plate","vehicles.make","vehicles.model"])} onStatus={changeStatus}/></div>}
        {section==="vehicles"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Plaka, marka, model veya müşteri ara"/><VehicleTable items={filtered(data.vehicles,["plate","make","model","customers.full_name"])} onPublish={publish}/></div>}
        {section==="customers"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Müşteri, telefon veya e-posta ara"/><CustomerTable items={filtered(data.customers,["full_name","phone","email"])}/></div>}
        {section==="parts"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Parça adı, kategori veya marka ara"/><PartsTable items={filtered(data.parts,["name","category","brand","part_number"])}/></div>}
        {loading&&<div className="tm-loading">VERİLER YÜKLENİYOR...</div>}
        {!loading&&data.customers.length===0&&data.vehicles.length===0&&data.services.length===0&&<div className="tm-empty-state"><Wrench/><b>Garaj henüz boş.</b><span>İlk müşteri veya motosiklet kaydınızı oluşturun.</span><button className="tm-button" onClick={()=>openForm("customer")}><Plus size={15}/> İlk müşteriyi ekle</button></div>}
      </div>
    </section>
    {modal&&<div className="tm-modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><form className="tm-modal" onSubmit={save}>
      <div className="tm-modal-head"><div><small>NEW GARAGE ENTRY</small><h2>{{customer:"Yeni müşteri",vehicle:"Yeni motosiklet",service:"Yeni servis kaydı",part:"Parça kataloğuna ekle"}[form.kind]}</h2></div><button type="button" onClick={()=>setModal(false)}><X/></button></div>
      {form.kind==="customer"&&<><Field label="Ad soyad" required value={form.full_name} set={v=>setForm({...form,full_name:v})}/><Field label="Telefon" value={form.phone} set={v=>setForm({...form,phone:v})}/><Field label="E-posta" type="email" value={form.email} set={v=>setForm({...form,email:v})}/><Field label="Notlar" value={form.notes} set={v=>setForm({...form,notes:v})}/></>}
      {form.kind==="vehicle"&&<><SelectField label="Müşteri" value={form.customer_id} set={v=>setForm({...form,customer_id:v})} options={data.customers.map(x=>[x.id,x.full_name])} empty="Müşteri seç (isteğe bağlı)"/><div className="tm-form-grid"><Field label="Plaka" required value={form.plate} set={v=>setForm({...form,plate:v.toLocaleUpperCase("tr")})}/><Field label="Şasi no (VIN)" value={form.vin} set={v=>setForm({...form,vin:v})}/><Field label="Marka" required value={form.make} set={v=>setForm({...form,make:v})}/><Field label="Model" required value={form.model} set={v=>setForm({...form,model:v})}/><Field label="Model yılı" type="number" value={form.production_year} set={v=>setForm({...form,production_year:v})}/><Field label="Kilometre" type="number" value={form.mileage_km} set={v=>setForm({...form,mileage_km:v})}/></div><Field label="İç not" value={form.notes} set={v=>setForm({...form,notes:v})}/></>}
      {form.kind==="service"&&<><SelectField label="Motosiklet" required value={form.vehicle_id} set={v=>setForm({...form,vehicle_id:v})} options={data.vehicles.map(x=>[x.id,x.plate+" · "+x.make+" "+x.model])}/><Field label="Müşteri şikâyeti" value={form.customer_complaint} set={v=>setForm({...form,customer_complaint:v})}/><Field label="İlk teşhis" value={form.initial_diagnosis} set={v=>setForm({...form,initial_diagnosis:v})}/><Field label="İşlem özeti" value={form.work_summary} set={v=>setForm({...form,work_summary:v})}/><SelectField label="Başlangıç durumu" value={form.status} set={v=>setForm({...form,status:v})} options={STATUSES}/><label className="tm-check"><input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})}/> QR servis sayfasında yayınla</label></>}
      {form.kind==="part"&&<><Field label="Parça adı" required value={form.name} set={v=>setForm({...form,name:v})}/><Field label="Kategori" required value={form.category} set={v=>setForm({...form,category:v})}/><Field label="Marka" value={form.brand} set={v=>setForm({...form,brand:v})}/><Field label="Parça numarası" value={form.part_number} set={v=>setForm({...form,part_number:v})}/></>}
      <div className="tm-modal-actions"><button type="button" className="tm-button tm-outline" onClick={()=>setModal(false)}>Vazgeç</button><button className="tm-button" disabled={saving}>{saving?"Kaydediliyor...":"Kaydı oluştur"}</button></div>
    </form></div>}
  </main>;
}
function Stat({Icon,label,value}){return <div className="tm-stat"><Icon size={19}/><div><small>{label}</small><b>{value}</b></div></div>}
function PanelHead({title,action,onClick}){return <div className="tm-panel-head"><h2>{title}</h2>{action&&<button onClick={onClick}>{action}</button>}</div>}
function Toolbar({value,onChange,placeholder}){return <div className="tm-toolbar"><Search size={16}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}
function Field({label,value,set,type="text",required=false}){return <label className="tm-field">{label}<input type={type} required={required} value={value??""} onChange={e=>set(e.target.value)}/></label>}
function SelectField({label,value,set,options,empty="Seçiniz"}){return <label className="tm-field">{label}<select value={value??""} onChange={e=>set(e.target.value)}><option value="">{empty}</option>{options.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>}
function ServiceTable({items,onStatus}){if(!items.length)return <Empty text="Henüz servis kaydı yok."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>SERVİS NO</th><th>MOTOSİKLET</th><th>GİRİŞ</th><th>DURUM</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>#{x.service_number}</td><td><b>{x.vehicles?.make} {x.vehicles?.model}</b><small>{x.vehicles?.plate}</small></td><td>{dateLabel(x.received_at)}</td><td><select value={x.status} onChange={e=>onStatus(x,e.target.value)}>{STATUSES.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></td></tr>)}</tbody></table></div>}
function VehicleTable({items,onPublish}){if(!items.length)return <Empty text="Henüz motosiklet kaydı yok."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>MOTOSİKLET</th><th>PLAKA</th><th>MÜŞTERİ</th><th>QR</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><b>{x.make} {x.model}</b><small>{x.production_year||"—"} · {x.mileage_km||"—"} km</small></td><td>{x.plate}</td><td>{x.customers?.full_name||"—"}</td><td>{x.is_published?"YAYINDA":"GİZLİ"}</td><td><button className="tm-mini" onClick={()=>onPublish("vehicles",x)}>{x.is_published?"Gizle":"Yayınla"}</button></td></tr>)}</tbody></table></div>}
function CustomerTable({items}){if(!items.length)return <Empty text="Henüz müşteri yok."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>MÜŞTERİ</th><th>TELEFON</th><th>E-POSTA</th><th>KAYIT</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.full_name}</td><td>{x.phone||"—"}</td><td>{x.email||"—"}</td><td>{dateLabel(x.created_at)}</td></tr>)}</tbody></table></div>}
function PartsTable({items}){if(!items.length)return <Empty text="Parça kataloğu boş."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>PARÇA</th><th>KATEGORİ</th><th>MARKA</th><th>PARÇA NO</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.category}</td><td>{x.brand||"—"}</td><td>{x.part_number||"—"}</td></tr>)}</tbody></table></div>}
function Empty({text}){return <div className="tm-empty">{text}</div>}
