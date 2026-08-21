import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, collection, query, orderBy,
  onSnapshot, serverTimestamp, limit, getDocs, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig, OPENWEATHER_API_KEY } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
try { await enableIndexedDbPersistence(db); } catch(e) {}

const $ = id => document.getElementById(id);
const state = { rates:null, emergency:null, pharmacy:null, clinics:[], deaths:[], prayer:null, weather:null };

function toast(t){ const e=$("toast"); e.textContent=t; e.classList.add("show"); setTimeout(()=>e.classList.remove("show"),1800); }
function money(n){ return Number(n||0).toLocaleString("en-US"); }
function todayKey(){ return new Date().toLocaleDateString("en-CA"); }

function cache(key,val){ try{ localStorage.setItem("armnaz_"+key,JSON.stringify(val)); }catch{} }
function cached(key,fallback=null){ try{return JSON.parse(localStorage.getItem("armnaz_"+key)) ?? fallback}catch{return fallback} }

async function watchDoc(name, cb){
  const ref=doc(db,"settings",name);
  onSnapshot(ref,snap=>{ if(snap.exists()){ state[name]=snap.data(); cache(name,state[name]); cb(state[name]); } else cb(cached(name)); },
  ()=>cb(cached(name)));
}
async function watchCollection(name, cb){
  const q=query(collection(db,name),orderBy("createdAt","desc"),limit(30));
  onSnapshot(q,snap=>{ const arr=snap.docs.map(d=>({id:d.id,...d.data()})); state[name]=arr; cache(name,arr); cb(arr); },()=>cb(cached(name,[])));
}

function applyRates(x){
  if(!x) return;
  $("rateMini").textContent=`$ ${money(x.usdSyp)} • ₺ ${money(x.trySyp)}`;
}
function applyPharmacy(x){
  if(!x)return;
  $("pharmacyMini").textContent=x.name||"مناوبة الآن";
}
function applyClinics(x){
  if(!x)return;
  const open=x.filter(c=>isOpen(c)).length;
  $("clinicMini").textContent=`${open} مفتوح الآن`;
}
function isOpen(c){
  const h=new Date().getHours()*60+new Date().getMinutes();
  const toMin=s=>{if(!s)return 0; const [a,b]=s.split(":").map(Number);return a*60+b};
  return c.openTime && c.closeTime && h>=toMin(c.openTime) && h<=toMin(c.closeTime);
}
function applyDeaths(arr){
  const now=Date.now();
  const live=arr.filter(d=>d.expiresAt && d.expiresAt.toDate ? d.expiresAt.toDate().getTime()>now : new Date(d.expiresAt||0).getTime()>now);
  $("deathMini").textContent=live.length?`${live.length} إعلان فعال`:"لا توجد إعلانات";
  const b=$("deathBanner");
  if(!live.length){b.classList.add("hidden");return}
  const d=live[0];
  b.classList.remove("hidden");
  b.innerHTML=`<div class="death-icon">🕯</div><div><strong>${esc(d.name)} ${esc(d.family||"")}</strong><small>صلاة الجنازة: ${esc(d.funeralTime||"غير محدد")} • العزاء: ${esc(d.condolencePlace||"غير محدد")}</small></div>`;
}
function applyWeather(x){
  if(!x)return;
  $("weatherTemp").innerHTML=`${Math.round(x.temp)}° <span>${x.icon||"☀"}</span>`;
  $("weatherDesc").textContent=x.description||"حالة الطقس";
  $("weatherRange").textContent=x.updatedAt ? `آخر تحديث ${new Date(x.updatedAt).toLocaleTimeString("ar-SY",{hour:"2-digit",minute:"2-digit"})}` : "أرمناز";
}

async function loadWeather(){
  const old=cached("weather"); if(old)applyWeather(old);
  if(!OPENWEATHER_API_KEY) return;
  try{
    const r=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=36.3944&lon=36.7081&units=metric&lang=ar&appid=${OPENWEATHER_API_KEY}`);
    if(!r.ok)throw Error();
    const j=await r.json();
    const x={temp:j.main.temp,description:j.weather?.[0]?.description||"مشمس",icon:"☀",updatedAt:Date.now()};
    state.weather=x; cache("weather",x); applyWeather(x);
  }catch{}
}

async function loadPrayer(){
  try{
    const date=new Date().toISOString().slice(0,10);
    const r=await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=36.3944&longitude=36.7081&method=4`);
    const j=await r.json(); if(j.code===200){state.prayer=j.data.timings;cache("prayer",state.prayer)}
  }catch{state.prayer=cached("prayer")}
  if(state.prayer) $("prayerMini").textContent=`الفجر ${state.prayer.Fajr} • الظهر ${state.prayer.Dhuhr}`;
}

function modal(title,html){
  $("modalBody").innerHTML=`<h2>${title}</h2>${html}`;$("modal").classList.remove("hidden");
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

document.querySelectorAll("[data-section]").forEach(b=>b.addEventListener("click",()=>{
 const s=b.dataset.section;
 if(s==="rates")modal("أسعار الصرف",`<div class="detail-grid"><div><small>الدولار / ليرة سورية</small><b>${money(state.rates?.usdSyp)} ل.س</b></div><div><small>التركي / ليرة سورية</small><b>${money(state.rates?.trySyp)} ل.س</b></div><div><small>الدولار / ليرة تركية</small><b>${money(state.rates?.usdTry)} ₺</b></div></div><p>آخر تحديث: ${state.rates?.updatedAt?.toDate?state.rates.updatedAt.toDate().toLocaleString("ar-SY"): "غير محدد"}</p>`);
 if(s==="pharmacy")modal("الصيدلية المناوبة",state.pharmacy?`<h3>${esc(state.pharmacy.name)}</h3><p>الصيدلي: ${esc(state.pharmacy.pharmacist||"")}</p><p>☎ ${esc(state.pharmacy.phone||"")}</p><a class="call" href="tel:${esc(state.pharmacy.phone||"")}">اتصال مباشر</a>`:"لا توجد بيانات");
 if(s==="emergency")modal("مركز الطوارئ",`<div class="calls">${Object.entries(state.emergency||{}).map(([k,v])=>`<a href="tel:${esc(v)}"><b>${esc(k)}</b><span>${esc(v)}</span></a>`).join("")}</div>`);
 if(s==="death")modal("الوفيات والعزاء",(state.deaths||[]).filter(d=>d.expiresAt).map(d=>`<article class="death-item"><b>${esc(d.name)} ${esc(d.family||"")}</b><p>الجنازة: ${esc(d.funeralTime||"")} — ${esc(d.condolencePlace||"")}</p></article>`).join("")||"<p>لا توجد إعلانات فعالة.</p>");
 if(s==="prayer")modal("مواقيت الصلاة",state.prayer?`<div class="detail-grid prayer">${["Fajr","Dhuhr","Asr","Maghrib","Isha"].map(k=>`<div><small>${k}</small><b>${state.prayer[k]}</b></div>`).join("")}</div>`:"تعذر تحميل المواقيت");
 if(s==="clinics")modal("العيادات",(state.clinics||[]).map(c=>`<article class="clinic"><b>${esc(c.name)}</b><span class="${isOpen(c)?"open":"closed"}">${isOpen(c)?"مفتوح":"مغلق"}</span><small>${esc(c.openTime)} — ${esc(c.closeTime)}<br>${esc(c.phone||"")}</small></article>`).join("")||"لا توجد عيادات");
 if(s==="weather")modal("الطقس",`<div class="weather-big">${Math.round(state.weather?.temp??0)}°</div><p>${esc(state.weather?.description||"")}</p>`);
 if(s==="more")modal("أرمناز الخدمي","مشروع مجتمعي مجاني لخدمة أهالي أرمناز ومحيطها.");
}));

$("modalClose").onclick=()=>$("modal").classList.add("hidden");
$("adminOpen").onclick=()=>onAuthStateChanged(auth,u=>u?openAdmin():$("login").classList.remove("hidden"));
$("loginClose").onclick=()=>$("login").classList.add("hidden");
$("loginBtn").onclick=async()=>{
 try{await signInWithEmailAndPassword(auth,$("email").value,$("password").value);$("login").classList.add("hidden");openAdmin()}
 catch(e){$("loginMsg").textContent="بيانات الدخول غير صحيحة أو الحساب غير مفعّل."}
};
$("logoutBtn").onclick=async()=>{await signOut(auth);closeAdmin()};
$("adminClose").onclick=closeAdmin;
$("adminRefresh").onclick=()=>renderAdmin("dashboard");

function openAdmin(){ $("admin").classList.remove("hidden"); renderAdmin("dashboard"); }
function closeAdmin(){ $("admin").classList.add("hidden"); }

document.querySelectorAll("[data-admin]").forEach(b=>b.onclick=()=>renderAdmin(b.dataset.admin));

function renderAdmin(section){
 const c=$("adminContent");$("adminTitle").textContent=({dashboard:"لوحة الإدارة",rates:"أسعار الصرف",pharmacy:"الصيدلية المناوبة",death:"الوفيات والعزاء",emergency:"الطوارئ",clinics:"العيادات"})[section];
 if(section==="dashboard") c.innerHTML=`<div class="stats"><article><span>حالة النظام</span><b class="green">متصل</b><small>Firebase فعال</small></article><article><span>آخر تحديث للأسعار</span><b>${state.rates?.updatedAt?.toDate?state.rates.updatedAt.toDate().toLocaleTimeString("ar-SY",{hour:"2-digit",minute:"2-digit"}):"--"}</b><small>البيانات الحية</small></article><article><span>الصيدلية</span><b>${esc(state.pharmacy?.name||"--")}</b><small>مناوبة اليوم</small></article><article><span>إعلانات فعالة</span><b>${state.deaths?.length||0}</b><small>تختفي تلقائيًا</small></article></div><div class="admin-grid"><div class="panel"><h2>تحديث سريع للأسعار</h2>${rateForm()}</div><div class="panel"><h2>الصيدلية الحالية</h2><p>${esc(state.pharmacy?.name||"لا توجد بيانات")}</p><button onclick="window.__admin('pharmacy')">إدارة الصيدلية</button></div><div class="panel"><h2>الإعلانات</h2><p>عدد السجلات: ${state.deaths?.length||0}</p><button onclick="window.__admin('death')">إدارة الوفيات</button></div></div>`;
 if(section==="rates") c.innerHTML=`<div class="panel">${rateForm()}</div>`;
 if(section==="pharmacy") c.innerHTML=`<div class="panel"><h2>الصيدلية المناوبة</h2><form id="pharmacyForm"><input name="name" value="${esc(state.pharmacy?.name||"")}" placeholder="اسم الصيدلية" required><input name="pharmacist" value="${esc(state.pharmacy?.pharmacist||"")}" placeholder="اسم الصيدلي"><input name="phone" value="${esc(state.pharmacy?.phone||"")}" placeholder="رقم الهاتف"><button class="primary">حفظ</button></form></div>`;
 if(section==="emergency") c.innerHTML=`<div class="panel"><h2>أرقام الطوارئ</h2><form id="emergencyForm">${["الشرطة","الإسعاف","الدفاع المدني","الكهرباء","المستشفى"].map(k=>`<input name="${k}" value="${esc(state.emergency?.[k]||"")}" placeholder="${k}">`).join("")}<button class="primary">حفظ الأرقام</button></form></div>`;
 if(section==="clinics") c.innerHTML=`<div class="panel"><h2>العيادات</h2><form id="clinicForm"><input name="name" placeholder="اسم العيادة" required><input name="openTime" placeholder="09:00"><input name="closeTime" placeholder="14:00"><input name="phone" placeholder="الهاتف"><button class="primary">إضافة عيادة</button></form><div class="list">${state.clinics.map(c=>`<div><b>${esc(c.name)}</b><span>${esc(c.openTime)} — ${esc(c.closeTime)}</span><button onclick="window.__deleteClinic('${c.id}')">حذف</button></div>`).join("")}</div></div>`;
 if(section==="death") c.innerHTML=`<div class="panel"><h2>إضافة إعلان وفاة</h2><form id="deathForm"><input name="name" placeholder="اسم المتوفى" required><input name="family" placeholder="العائلة"><input name="funeralTime" placeholder="وقت صلاة الجنازة"><input name="condolencePlace" placeholder="مكان العزاء"><input name="phone" placeholder="هاتف اختياري"><label>يظهر لمدة 3 أيام <input name="days" type="number" value="3" min="1" max="7"></label><button class="primary">نشر الإعلان</button></form><div class="list">${state.deaths.map(d=>`<div><b>${esc(d.name)} ${esc(d.family||"")}</b><span>${esc(d.condolencePlace||"")}</span><button onclick="window.__deleteDeath('${d.id}')">حذف</button></div>`).join("")}</div></div>`;
 bindAdminForms();
}
function rateForm(){return `<form id="rateForm"><input name="usdSyp" type="number" value="${state.rates?.usdSyp||""}" placeholder="الدولار / ل.س"><input name="trySyp" type="number" value="${state.rates?.trySyp||""}" placeholder="التركي / ل.س"><input name="usdTry" type="number" step="0.01" value="${state.rates?.usdTry||""}" placeholder="الدولار / التركي"><button class="primary">حفظ الأسعار</button></form>`}

function bindAdminForms(){
 $("rateForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);await setDoc(doc(db,"settings","rates"),{usdSyp:Number(f.get("usdSyp")),trySyp:Number(f.get("trySyp")),usdTry:Number(f.get("usdTry")),updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid});toast("تم حفظ الأسعار");renderAdmin("rates")});
 $("pharmacyForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);await setDoc(doc(db,"settings","pharmacy"),{name:f.get("name"),pharmacist:f.get("pharmacist"),phone:f.get("phone"),updatedAt:serverTimestamp()});toast("تم تحديث الصيدلية");renderAdmin("pharmacy")});
 $("emergencyForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);const o={};for(const [k,v] of f)o[k]=v;await setDoc(doc(db,"settings","emergency"),o);toast("تم حفظ الأرقام");renderAdmin("emergency")});
 $("clinicForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);await addDoc(collection(db,"clinics"),{name:f.get("name"),openTime:f.get("openTime"),closeTime:f.get("closeTime"),phone:f.get("phone"),createdAt:serverTimestamp()});toast("تمت إضافة العيادة");renderAdmin("clinics")});
 $("deathForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);const days=Number(f.get("days")||3);const expires=new Date(Date.now()+days*86400000);await addDoc(collection(db,"deaths"),{name:f.get("name"),family:f.get("family"),funeralTime:f.get("funeralTime"),condolencePlace:f.get("condolencePlace"),phone:f.get("phone"),expiresAt:expires,createdAt:serverTimestamp()});toast("تم نشر الإعلان");renderAdmin("death")});
}
window.__admin=renderAdmin;
window.__deleteClinic=async id=>{await deleteDoc(doc(db,"clinics",id));renderAdmin("clinics")};
window.__deleteDeath=async id=>{await deleteDoc(doc(db,"deaths",id));renderAdmin("death")};

watchDoc("rates",applyRates); watchDoc("pharmacy",applyPharmacy); watchDoc("emergency",()=>{}); watchCollection("clinics",applyClinics); watchCollection("deaths",applyDeaths);
loadPrayer(); loadWeather();

window.addEventListener("offline",()=>$("offlineBanner").classList.remove("hidden"));
window.addEventListener("online",()=>$("offlineBanner").classList.add("hidden"));
if(!navigator.onLine)$("offlineBanner").classList.remove("hidden");

setInterval(()=>{applyClinics(state.clinics);},60000);

if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
