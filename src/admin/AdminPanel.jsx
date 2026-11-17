import {useCallback,useEffect,useMemo,useState} from "react";
import {Activity,Bike,Boxes,ClipboardList,LayoutDashboard,LogOut,Plus,RefreshCw,Search,Users,Wrench,X,CheckCircle2,AlertCircle,QrCode,Copy,Pencil,Trash2,ImagePlus,FileImage,ShieldCheck} from "lucide-react";
import KAREKODCode from "qrcode";
import {supabase} from "../lib/supabase";

const BUCKET="tmoto-private-media";
const STATUSES=[["received","Servise kabul"],["inspection","Arıza tespiti"],["waiting_approval","Onay bekliyor"],["waiting_parts","Parça bekliyor"],["in_progress","İşlemde"],["quality_check","Son kontrol"],["ready_for_pickup","Teslime hazır"],["delivered","Teslim edildi"],["cancelled","İptal"]];
const ACTIONS=[["replaced","Değiştirildi"],["installed","Takıldı"],["repaired","Onarıldı"],["inspected","Kontrol edildi"],["maintained","Bakımı yapıldı"]];
const statusLabel=s=>STATUSES.find(x=>x[0]===s)?.[1]||s;
const dateLabel=s=>s?new Date(s).toLocaleDateString("tr-TR"):"—";
const blankPart=()=>({part_id:"",part_name:"",category:"",action:"replaced",quantity:1,notes:"",is_public:false});

export default function AdminPanel(){
 const [session,setSession]=useState(null),[staff,setStaff]=useState(null),[section,setSection]=useState("overview"),[search,setSearch]=useState("");
 const [data,setData]=useState({customers:[],vehicles:[],services:[],parts:[],vehicleMedia:[],serviceMedia:[],serviceParts:[]});
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [modal,setModal]=useState(false),[form,setForm]=useState({}),[editing,setEditing]=useState(false),[qr,setQr]=useState(null),[urls,setUrls]=useState({});

 const load=useCallback(async()=>{
  setLoading(true);
  const q=await Promise.all([
   supabase.from("customers").select("*").order("created_at",{ascending:false}),
   supabase.from("vehicles").select("*,customers(full_name,phone)").order("created_at",{ascending:false}),
   supabase.from("service_records").select("*,vehicles(make,model,plate)").order("received_at",{ascending:false}),
   supabase.from("parts_catalog").select("*").order("name"),
   supabase.from("vehicle_media").select("*").order("created_at",{ascending:false}),
   supabase.from("service_media").select("*").order("created_at",{ascending:false}),
   supabase.from("service_parts").select("*").order("created_at")
  ]);
  const bad=q.find(x=>x.error);if(bad){setError(bad.error.message);setLoading(false);return;}
  const d={customers:q[0].data||[],vehicles:q[1].data||[],services:q[2].data||[],parts:q[3].data||[],vehicleMedia:q[4].data||[],serviceMedia:q[5].data||[],serviceParts:q[6].data||[]};setData(d);
  const media=[...d.vehicleMedia,...d.serviceMedia];
  const links=await Promise.all(media.map(async m=>{const {data:r}=await supabase.storage.from(BUCKET).createSignedUrl(m.storage_path,3600);return [m.id,r?.signedUrl||""];}));
  setUrls(Object.fromEntries(links));setLoading(false);
 },[]);
 useEffect(()=>{let alive=true;(async()=>{const {data:a}=await supabase.auth.getSession();if(!alive)return;if(!a.session){location.assign("/T-Moto-Garage/admin");return;}setSession(a.session);const {data:r,error:e}=await supabase.from("admin_users").select("role,is_active").eq("user_id",a.session.user.id).maybeSingle();if(!alive)return;if(e||!r?.is_active){setError("Bu hesap için aktif yönetici yetkisi bulunamadı.");setLoading(false);return;}setStaff(r);await load();})();const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>{if(!s)location.assign("/T-Moto-Garage/admin");});return()=>{alive=false;l.subscription.unsubscribe();};},[load]);

 const counts=useMemo(()=>({active:data.services.filter(x=>!["delivered","cancelled"].includes(x.status)).length}),[data.services]);
 const filtered=(items,fields)=>items.filter(x=>fields.some(f=>String(f.split(".").reduce((v,k)=>v?.[k],x)||"").toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))));
 function create(kind){
  const defaults={customer:{full_name:"",phone:"",email:"",notes:""},vehicle:{customer_id:"",plate:"",make:"",model:"",production_year:"",mileage_km:"",vin:"",notes:"",files:[],caption:""},service:{vehicle_id:"",customer_complaint:"",initial_diagnosis:"",work_summary:"",status:"received",received_at:new Date().toISOString().slice(0,16),estimated_delivery_at:"",is_published:false,parts:[blankPart()],files:[],caption:""},part:{name:"",category:"",brand:"",part_number:""}};
  setForm({kind,...defaults[kind]});setEditing(false);setModal(true);setError("");setNotice("");
 }
 function edit(kind,item){
  const v={...item,kind,files:[],caption:""};
  if(kind==="vehicle")v.media=data.vehicleMedia.filter(x=>x.vehicle_id===item.id);
  if(kind==="service"){v.media_public=true;v.received_at=item.received_at?new Date(item.received_at).toISOString().slice(0,16):"";v.estimated_delivery_at=item.estimated_delivery_at?new Date(item.estimated_delivery_at).toISOString().slice(0,16):"";v.parts=data.serviceParts.filter(x=>x.service_record_id===item.id).map(x=>({...x}));if(!v.parts.length)v.parts=[blankPart()];v.media=data.serviceMedia.filter(x=>x.service_record_id===item.id);}
  setForm(v);setEditing(true);setModal(true);setError("");setNotice("");
 }
 async function uploadImages(files,kind,id,caption,isPublic=false){
  for(const file of files){
   if(!file.type.startsWith("image/")||file.size>10*1024*1024)throw new Error("Yalnızca görsel dosyaları (en fazla 10 MB) yükleyebilirsiniz.");
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
   const path=kind+"/"+id+"/"+crypto.randomUUID()+"."+ext;
   const {error:e}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(e)throw e;
   const table=kind==="vehicles"?"vehicle_media":"service_media";
   const row=kind==="vehicles"?{vehicle_id:id,storage_path:path,caption:caption||file.name}:{service_record_id:id,storage_path:path,caption:caption||file.name,media_type:"image",is_public:Boolean(isPublic)};
   const {error:dbError}=await supabase.from(table).insert(row);if(dbError){await supabase.storage.from(BUCKET).remove([path]);throw dbError;}
  }
 }
 async function save(e){
  e.preventDefault();setSaving(true);setError("");
  const {kind,files=[],caption,parts=[],media=[],...v}=form;
  try{
   let id=form.id;
   if(kind==="customer"){
    const values={full_name:v.full_name,phone:v.phone||null,email:v.email||null,notes:v.notes||null};
    const q=editing?supabase.from("customers").update(values).eq("id",id):supabase.from("customers").insert(values);
    const {data:r,error:x}=await q.select().single();if(x)throw x;id=r.id;
   }
   if(kind==="vehicle"){
    const values={customer_id:v.customer_id||null,plate:v.plate,make:v.make,model:v.model,vin:v.vin||null,production_year:v.production_year?Number(v.production_year):null,mileage_km:v.mileage_km?Number(v.mileage_km):null,notes:v.notes||null,created_by:editing?v.created_by:session.user.id};
    const q=editing?supabase.from("vehicles").update(values).eq("id",id):supabase.from("vehicles").insert(values);
    const {data:r,error:x}=await q.select().single();if(x)throw x;id=r.id;
    if(files.length)await uploadImages(files,"vehicles",id,caption||"Motosiklet görseli");
   }
   if(kind==="part"){
    const values={name:v.name,category:v.category,brand:v.brand||null,part_number:v.part_number||null};
    const q=editing?supabase.from("parts_catalog").update(values).eq("id",id):supabase.from("parts_catalog").insert(values);
    const {error:x}=await q.select().single();if(x)throw x;
   }
   if(kind==="service"){
    const values={vehicle_id:v.vehicle_id,customer_complaint:v.customer_complaint||null,initial_diagnosis:v.initial_diagnosis||null,work_summary:v.work_summary||null,status:v.status,received_at:v.received_at?new Date(v.received_at).toISOString():new Date().toISOString(),estimated_delivery_at:v.estimated_delivery_at?new Date(v.estimated_delivery_at).toISOString():null,is_published:Boolean(v.is_published),created_by:editing?v.created_by:session.user.id};
    const q=editing?supabase.from("service_records").update(values).eq("id",id):supabase.from("service_records").insert(values);
    const {data:r,error:x}=await q.select().single();if(x)throw x;id=r.id;
    const {error:delError}=await supabase.from("service_parts").delete().eq("service_record_id",id);if(delError)throw delError;
    const partRows=parts.filter(p=>p.part_name?.trim()).map(p=>({service_record_id:id,part_id:p.part_id||null,part_name:p.part_name.trim(),category:p.category||"Genel",action:p.action||"replaced",quantity:Number(p.quantity)||1,notes:p.notes||null,is_public:Boolean(p.is_public)}));
    if(partRows.length){const {error:x}=await supabase.from("service_parts").insert(partRows);if(x)throw x;}
    if(files.length)await uploadImages(files,"services",id,caption||"Servis işlemi görseli",Boolean(v.media_public));
    if(!editing){const {error:x}=await supabase.from("service_events").insert({service_record_id:id,status:values.status,title:statusLabel(values.status),description:"Servis kaydı oluşturuldu.",is_public:values.is_published,created_by:session.user.id});if(x)throw x;}
   }
   setNotice(editing?"Kayıt güncellendi.":"Kayıt oluşturuldu.");setModal(false);await load();
  }catch(x){setError(x.message||"Kayıt sırasında hata oluştu.");}finally{setSaving(false);}
 }
 async function toggleServiceMediaPublic(m,isPublic){
  const {error:e}=await supabase.from("service_media").update({is_public:isPublic}).eq("id",m.id);
  if(e){setError(e.message);return;}
  setForm(old=>({...old,media:(old.media||[]).map(x=>x.id===m.id?{...x,is_public:isPublic}:x)}));
  setNotice(isPublic?"Görsel müşteri sorgusunda yayınlanacak.":"Görsel müşteri sorgusundan gizlendi.");
  await load();
 }
 async function removeMedia(m,kind){
  if(!confirm("Görsel kalıcı olarak silinsin mi?"))return;
  const {error:e}=await supabase.storage.from(BUCKET).remove([m.storage_path]);if(e){setError(e.message);return;}
  const {error:x}=await supabase.from(kind==="vehicle"?"vehicle_media":"service_media").delete().eq("id",m.id);if(x){setError(x.message);return;}
  setForm(old=>({...old,media:(old.media||[]).filter(y=>y.id!==m.id)}));setNotice("Görsel silindi.");await load();
 }
 async function changeStatus(item,status){
  const patch={status};if(status==="in_progress")patch.started_at=new Date().toISOString();if(status==="ready_for_pickup")patch.completed_at=new Date().toISOString();if(status==="delivered")patch.delivered_at=new Date().toISOString();
  const {error:e}=await supabase.from("service_records").update(patch).eq("id",item.id);if(e){setError(e.message);return;}
  const {error:x}=await supabase.from("service_events").insert({service_record_id:item.id,status,title:statusLabel(status),description:"Servis durumu yönetim panelinden güncellendi.",is_public:item.is_published,created_by:session.user.id});
  if(x)setError(x.message);else setNotice("Servis durumu güncellendi.");await load();
 }
 async function publish(item){const {error:e}=await supabase.from("vehicles").update({is_published:!item.is_published}).eq("id",item.id);if(e)setError(e.message);else setNotice("Yayın ayarı güncellendi.");await load();}
 async function showQr(v){const url=location.origin+"/T-Moto-Garage/takip/"+v.qr_token;const image=await KAREKODCode.toDataURL(url,{width:420,margin:2});setQr({url,image,plate:v.plate,make:v.make,model:v.model});}
 async function signOut(){await supabase.auth.signOut();location.assign("/T-Moto-Garage/admin");}
 const menus=[["overview",LayoutDashboard,"Genel Bakış"],["services",ClipboardList,"Servis Kayıtları"],["vehicles",Bike,"Motosikletler"],["customers",Users,"Müşteriler"],["parts",Boxes,"Parça Kataloğu"]];
 if(!session&&!error)return <main className="tm-admin-loading">GÜVENLİ OTURUM KONTROLÜ...</main>;
 if(error&&!staff)return <main className="tm-admin-loading"><p>{error}</p><button className="tm-button" onClick={signOut}>GİRİŞE DÖN</button></main>;
 return <main className="tm-admin">
  <aside className="tm-sidebar"><a className="tm-admin-brand" href="/T-Moto-Garage/"><span>T<span>·</span>M</span><b>T-MOTO<br/>GARAGE</b></a><small className="tm-side-caption">SERVİS YÖNETİMİ</small><nav>{menus.map(([k,I,l])=><button key={k} className={section===k?"active":""} onClick={()=>{setSection(k);setSearch("");}}><I size={17}/>{l}</button>)}</nav><div className="tm-sidebar-bottom"><b>{session?.user?.email}</b><small>{staff?.role?.toUpperCase()}</small><button onClick={signOut}><LogOut size={15}/> Güvenli çıkış</button></div></aside>
  <section className="tm-main"><header className="tm-topbar"><div><small>YÖNETİM MERKEZİ</small><b>{menus.find(x=>x[0]===section)?.[2]}</b></div><button onClick={load}><RefreshCw size={16}/> Yenile</button></header><div className="tm-content">
   <div className="tm-welcome"><div><small>T-MOTO GARAGE / OPERASYON</small><h1>{section==="overview"?"GARAJIN":menus.find(x=>x[0]===section)?.[2].toLocaleUpperCase("tr")} <em>{section==="overview"?"KONTROLÜ.":"YÖNETİMİ."}</em></h1><p>Servis operasyonlarınızı tek merkezden yönetin.</p></div>{section!=="overview"&&<button className="tm-button" onClick={()=>create(({services:"service",vehicles:"vehicle",customers:"customer",parts:"part"})[section])}><Plus size={16}/> Yeni kayıt</button>}</div>
   {error&&<div className="tm-alert"><AlertCircle size={16}/>{error}<button onClick={()=>setError("")}>×</button></div>}{notice&&<div className="tm-notice"><CheckCircle2 size={16}/>{notice}<button onClick={()=>setNotice("")}>×</button></div>}
   {section==="overview"&&<><div className="tm-stat-grid"><Stat Icon={ClipboardList} label="Toplam servis" value={data.services.length}/><Stat Icon={Activity} label="Aktif servis" value={counts.active}/><Stat Icon={Bike} label="Motosiklet" value={data.vehicles.length}/><Stat Icon={Users} label="Müşteri" value={data.customers.length}/></div><div className="tm-overview-grid"><div className="tm-panel"><PanelHead title="Son servis kayıtları" action="Tümünü gör →" onClick={()=>setSection("services")}/><ServiceTable items={data.services.slice(0,5)} onStatus={changeStatus} onEdit={x=>edit("service",x)}/></div><div className="tm-panel"><PanelHead title="Hızlı işlemler"/>{[["service","Servis kaydı",ClipboardList],["vehicle","Motosiklet",Bike],["customer","Müşteri",Users],["part","Parça",Boxes]].map(([k,l,I])=><button className="tm-quick" key={k} onClick={()=>create(k)}><I size={16}/>{l}<Plus size={14}/></button>)}</div></div><div className="tm-panel"><PanelHead title="Son eklenen motosikletler" action="Motosikletlere git →" onClick={()=>setSection("vehicles")}/><VehicleTable items={data.vehicles.slice(0,5)} onEdit={x=>edit("vehicle",x)} onQr={showQr} onPublish={publish}/></div></>}
   {section==="services"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Servis no, plaka veya model ara"/><ServiceTable items={filtered(data.services,["service_number","vehicles.plate","vehicles.make","vehicles.model"])} onStatus={changeStatus} onEdit={x=>edit("service",x)}/></div>}
   {section==="vehicles"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Plaka, marka, model veya müşteri ara"/><VehicleTable items={filtered(data.vehicles,["plate","make","model","customers.full_name"])} onEdit={x=>edit("vehicle",x)} onQr={showQr} onPublish={publish}/></div>}
   {section==="customers"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Müşteri, telefon veya e-posta ara"/><CustomerTable items={filtered(data.customers,["full_name","phone","email"])} onEdit={x=>edit("customer",x)}/></div>}
   {section==="parts"&&<div className="tm-panel"><Toolbar value={search} onChange={setSearch} placeholder="Parça adı, kategori veya marka ara"/><PartsTable items={filtered(data.parts,["name","category","brand","part_number"])} onEdit={x=>edit("part",x)}/></div>}
   {loading&&<div className="tm-loading">VERİLER YÜKLENİYOR...</div>}
   {!loading&&!data.customers.length&&!data.vehicles.length&&!data.services.length&&<div className="tm-empty-state"><Wrench/><b>Garaj henüz boş.</b><span>İlk müşteri veya motosiklet kaydınızı oluşturun.</span><button className="tm-button" onClick={()=>create("customer")}><Plus size={15}/> İlk müşteriyi ekle</button></div>}
  </div></section>
  {qr&&<div className="tm-modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)setQr(null);}}><div className="tm-modal tm-qr-modal"><div className="tm-modal-head"><div><small>KAREKOD SERVİS BAĞLANTISI</small><h2>{qr.plate} · {qr.make} {qr.model}</h2></div><button onClick={()=>setQr(null)}><X/></button></div><img src={qr.image} alt="Servis KAREKOD kodu"/><p>{qr.url}</p><div className="tm-modal-actions"><button className="tm-button tm-outline" onClick={()=>navigator.clipboard?.writeText(qr.url)}><Copy size={15}/> Bağlantıyı kopyala</button><a className="tm-button" href={qr.image} download={"tmoto-qr-"+qr.plate+".png"}>KAREKOD indir</a></div></div></div>}
  {modal&&<div className="tm-modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><form className="tm-modal tm-entry-modal" onSubmit={save}>
   <div className="tm-modal-head"><div><small>{editing?"KAYDI DÜZENLE":"YENİ KAYIT"}</small><h2>{{customer:"Müşteri",vehicle:"Motosiklet",service:"Servis kaydı",part:"Parça"}[form.kind]} {editing?"bilgileri":"oluştur"}</h2></div><button type="button" onClick={()=>setModal(false)}><X/></button></div>
   {form.kind==="customer"&&<><Field label="Ad soyad" required value={form.full_name} set={v=>setForm({...form,full_name:v})}/><Field label="Telefon" value={form.phone} set={v=>setForm({...form,phone:v})}/><Field label="E-posta" type="email" value={form.email} set={v=>setForm({...form,email:v})}/><Field label="Notlar" value={form.notes} set={v=>setForm({...form,notes:v})}/></>}
   {form.kind==="vehicle"&&<><SelectField label="Müşteri" value={form.customer_id} set={v=>setForm({...form,customer_id:v})} options={data.customers.map(x=>[x.id,x.full_name])} empty="Müşteri seç (isteğe bağlı)"/><div className="tm-form-grid"><Field label="Plaka" required value={form.plate} set={v=>setForm({...form,plate:v.toLocaleUpperCase("tr")})}/><Field label="Şasi no (VIN)" value={form.vin} set={v=>setForm({...form,vin:v})}/><Field label="Marka" required value={form.make} set={v=>setForm({...form,make:v})}/><Field label="Model" required value={form.model} set={v=>setForm({...form,model:v})}/><Field label="Model yılı" type="number" value={form.production_year} set={v=>setForm({...form,production_year:v})}/><Field label="Kilometre" type="number" value={form.mileage_km} set={v=>setForm({...form,mileage_km:v})}/></div><Field label="İç not" value={form.notes} set={v=>setForm({...form,notes:v})}/><Media items={form.media||[]} urls={urls} onDelete={m=>removeMedia(m,"vehicle")}/><ImagePicker files={form.files||[]} set={v=>setForm({...form,files:v})} caption={form.caption||""} setCaption={v=>setForm({...form,caption:v})}/></>}
   {form.kind==="service"&&<><SelectField label="Motosiklet" required value={form.vehicle_id} set={v=>setForm({...form,vehicle_id:v})} options={data.vehicles.map(x=>[x.id,x.plate+" · "+x.make+" "+x.model])}/><div className="tm-form-grid"><Field label="Servise kabul tarihi" type="datetime-local" value={form.received_at} set={v=>setForm({...form,received_at:v})}/><Field label="Tahmini teslim tarihi" type="datetime-local" value={form.estimated_delivery_at||""} set={v=>setForm({...form,estimated_delivery_at:v})}/></div><Field label="Müşteri şikâyeti" value={form.customer_complaint} set={v=>setForm({...form,customer_complaint:v})}/><Field label="İlk teşhis" value={form.initial_diagnosis} set={v=>setForm({...form,initial_diagnosis:v})}/><Field label="Yapılan iş / işlem özeti" value={form.work_summary} set={v=>setForm({...form,work_summary:v})}/><SelectField label="Servis durumu" value={form.status} set={v=>setForm({...form,status:v})} options={STATUSES}/><label className="tm-check"><input type="checkbox" checked={Boolean(form.is_published)} onChange={e=>setForm({...form,is_published:e.target.checked})}/> KAREKOD servis sayfasında yayınla</label>
    <div className="tm-subsection"><div className="tm-subsection-head"><b>Değişen / takılan / işlem gören parçalar</b><button type="button" className="tm-mini" onClick={()=>setForm({...form,parts:[...(form.parts||[]),blankPart()]})}><Plus size={13}/> Parça ekle</button></div>
    {(form.parts||[]).map((p,i)=><div className="tm-part-editor" key={i}><div className="tm-form-grid"><SelectField label="Katalogdan seç" value={p.part_id||""} set={id=>{const part=data.parts.find(x=>x.id===id),a=[...form.parts];a[i]={...a[i],part_id:id,part_name:part?.name||a[i].part_name,category:part?.category||a[i].category};setForm({...form,parts:a});}} options={data.parts.map(x=>[x.id,x.name+" · "+(x.brand||x.category)])} empty="Serbest parça"/><Field label="Parça adı" value={p.part_name} set={v=>{const a=[...form.parts];a[i]={...a[i],part_name:v,part_id:""};setForm({...form,parts:a});}}/><Field label="Kategori" value={p.category} set={v=>{const a=[...form.parts];a[i]={...a[i],category:v};setForm({...form,parts:a});}}/><SelectField label="İşlem" value={p.action} set={v=>{const a=[...form.parts];a[i]={...a[i],action:v};setForm({...form,parts:a});}} options={ACTIONS}/><Field label="Adet" type="number" value={p.quantity} set={v=>{const a=[...form.parts];a[i]={...a[i],quantity:v};setForm({...form,parts:a});}}/><Field label="Not / marka / parça no" value={p.notes||""} set={v=>{const a=[...form.parts];a[i]={...a[i],notes:v};setForm({...form,parts:a});}}/></div><div className="tm-part-bottom"><label className="tm-check"><input type="checkbox" checked={Boolean(p.is_public)} onChange={e=>{const a=[...form.parts];a[i]={...a[i],is_public:e.target.checked};setForm({...form,parts:a});}}/> KAREKOD geçmişinde göster</label><button type="button" className="tm-mini tm-danger" onClick={()=>setForm({...form,parts:form.parts.filter((_,j)=>j!==i)})}><Trash2 size={13}/> Sil</button></div></div>)}</div>
    <div className="tm-subsection"><b>Yapılan iş / değişen parçaların görselleri</b><Media items={form.media||[]} urls={urls} onDelete={m=>removeMedia(m,"service")} onToggle={toggleServiceMediaPublic}/><label className="tm-check"><input type="checkbox" checked={Boolean(form.media_public)} onChange={e=>setForm({...form,media_public:e.target.checked})}/> Yeni yüklenen görselleri müşteri sorgusunda göster</label><ImagePicker files={form.files||[]} set={v=>setForm({...form,files:v})} caption={form.caption||""} setCaption={v=>setForm({...form,caption:v})}/></div><p className="tm-private-note"><ShieldCheck size={14}/> Yalnızca müşteri yayınına açtığınız görseller, yayınlanmış servis kaydıyla birlikte KAREKOD ve plaka sorgusunda gösterilir.</p>
   </>}
   {form.kind==="part"&&<><Field label="Parça adı" required value={form.name} set={v=>setForm({...form,name:v})}/><Field label="Kategori" required value={form.category} set={v=>setForm({...form,category:v})}/><Field label="Marka" value={form.brand} set={v=>setForm({...form,brand:v})}/><Field label="Parça numarası" value={form.part_number} set={v=>setForm({...form,part_number:v})}/></>}
   <div className="tm-modal-actions"><button type="button" className="tm-button tm-outline" onClick={()=>setModal(false)}>Vazgeç</button><button className="tm-button" disabled={saving}>{saving?"Kaydediliyor...":editing?"Değişiklikleri kaydet":"Kaydı oluştur"}</button></div>
  </form></div>}
 </main>;
}
function Stat({Icon,label,value}){return <div className="tm-stat"><Icon size={19}/><div><small>{label}</small><b>{value}</b></div></div>}
function PanelHead({title,action,onClick}){return <div className="tm-panel-head"><h2>{title}</h2>{action&&<button onClick={onClick}>{action}</button>}</div>}
function Toolbar({value,onChange,placeholder}){return <div className="tm-toolbar"><Search size={16}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}
function Field({label,value,set,type="text",required=false}){return <label className="tm-field">{label}<input type={type} required={required} value={value??""} onChange={e=>set(e.target.value)}/></label>}
function SelectField({label,value,set,options,empty="Seçiniz"}){return <label className="tm-field">{label}<select value={value??""} onChange={e=>set(e.target.value)}><option value="">{empty}</option>{options.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>}
function ImagePicker({files,set,caption,setCaption}){return <div className="tm-file-picker"><label className="tm-field">Görsel açıklaması<input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Örn. Ön grenaj hasar öncesi"/></label><label className="tm-upload-button"><ImagePlus size={17}/> Görsel seç (çoklu)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>set([...files,...Array.from(e.target.files||[])])}/></label>{files.length>0&&<div className="tm-selected-files">{files.map((x,i)=><div key={i}><FileImage size={14}/><span>{x.name}</span><button type="button" onClick={()=>set(files.filter((_,j)=>j!==i))}>×</button></div>)}</div>}<small>JPG, PNG, WEBP · Her görsel en fazla 10 MB</small></div>}
function Media({items,urls,onDelete,onToggle}){return <div className="tm-media-section"><b>Kayıtlı görseller</b>{!items.length?<small>Henüz görsel eklenmemiş.</small>:<div className="tm-media-grid">{items.map(m=><div className="tm-media-thumb" key={m.id}>{urls[m.id]?<img src={urls[m.id]} alt={m.caption||"Kayıt görseli"}/>:<span>Yükleniyor...</span>}<small>{m.caption||"Görsel"}</small>{onToggle&&<label className="tm-check"><input type="checkbox" checked={Boolean(m.is_public)} onChange={e=>onToggle(m,e.target.checked)}/> Müşteri sorgusunda göster</label>}<button type="button" onClick={()=>onDelete(m)}><Trash2 size={13}/> Sil</button></div>)}</div>}</div>}
function ServiceTable({items,onStatus,onEdit}){if(!items.length)return <Empty text="Henüz servis kaydı yok."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>SERVİS NO</th><th>MOTOSİKLET</th><th>GİRİŞ</th><th>DURUM</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>#{x.service_number}</td><td><b>{x.vehicles?.make} {x.vehicles?.model}</b><small>{x.vehicles?.plate}</small></td><td>{dateLabel(x.received_at)}</td><td><select value={x.status} onChange={e=>onStatus(x,e.target.value)}>{STATUSES.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></td><td><button className="tm-mini" onClick={()=>onEdit(x)}><Pencil size={13}/> Düzenle</button></td></tr>)}</tbody></table></div>}
function VehicleTable({items,onEdit,onQr,onPublish}){if(!items.length)return <Empty text="Henüz motosiklet kaydı yok."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>MOTOSİKLET</th><th>PLAKA</th><th>MÜŞTERİ</th><th>KAREKOD</th><th>İŞLEM</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td><b>{x.make} {x.model}</b><small>{x.production_year||"—"} · {x.mileage_km||"—"} km</small></td><td>{x.plate}</td><td>{x.customers?.full_name||"—"}</td><td>{x.is_published?"YAYINDA":"GİZLİ"}</td><td><button className="tm-mini" onClick={()=>onEdit(x)}><Pencil size={13}/> Düzenle</button> <button className="tm-mini" onClick={()=>onQr(x)}><QrCode size={13}/> KAREKOD</button> <button className="tm-mini" onClick={()=>onPublish(x)}>{x.is_published?"Gizle":"Yayınla"}</button></td></tr>)}</tbody></table></div>}
function CustomerTable({items,onEdit}){if(!items.length)return <Empty text="Henüz müşteri yok."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>MÜŞTERİ</th><th>TELEFON</th><th>E-POSTA</th><th>KAYIT</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.full_name}</td><td>{x.phone||"—"}</td><td>{x.email||"—"}</td><td>{dateLabel(x.created_at)}</td><td><button className="tm-mini" onClick={()=>onEdit(x)}><Pencil size={13}/> Düzenle</button></td></tr>)}</tbody></table></div>}
function PartsTable({items,onEdit}){if(!items.length)return <Empty text="Parça kataloğu boş."/>;return <div className="tm-table-wrap"><table className="tm-table"><thead><tr><th>PARÇA</th><th>KATEGORİ</th><th>MARKA</th><th>PARÇA NO</th><th></th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.category}</td><td>{x.brand||"—"}</td><td>{x.part_number||"—"}</td><td><button className="tm-mini" onClick={()=>onEdit(x)}><Pencil size={13}/> Düzenle</button></td></tr>)}</tbody></table></div>}
function Empty({text}){return <div className="tm-empty">{text}</div>}
