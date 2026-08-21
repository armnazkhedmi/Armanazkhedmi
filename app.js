const DEFAULTS={
  rates:{usdSyp:0,trySyp:0,usdTry:0,updatedAt:""},
  pharmacy:{name:"لم تُحدد بعد",pharmacist:"",phone:"",date:""},
  death:null,
  emergency:[
    ["الشرطة","—"],["الإسعاف","—"],["الدفاع المدني","—"],["طوارئ الكهرباء","—"],["المستشفى","—"]
  ],
  clinics:[
    {name:"مستشفى/عيادة أرمناز",phone:"",morning:"08:00 - 12:00",evening:"16:00 - 20:00"}
  ]
};
const key="armnaz_service_data";
function data(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(key)||"{}")}}catch{return DEFAULTS}}
let D=data();
function save(){localStorage.setItem(key,JSON.stringify(D)); renderAll()}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function phoneLink(p){return p&&p!=="—"?`<a class="call" href="tel:${esc(p)}">اتصال مباشر</a>`:""}
function renderAll(){
  document.getElementById("rates").innerHTML=[
    ["الدولار مقابل الليرة السورية",D.rates.usdSyp],["التركي مقابل الليرة السورية",D.rates.trySyp],["الدولار مقابل الليرة التركية",D.rates.usdTry]
  ].map(x=>`<div class="rate-row"><span>${x[0]}</span><span class="rate-value">${x[1]||"—"}</span></div>`).join("");
  document.getElementById("ratesTime").textContent=D.rates.updatedAt?`آخر تحديث: ${D.rates.updatedAt}`:"لم يُحدّث";
  document.getElementById("pharmacyDate").textContent=new Date().toLocaleDateString("ar-SY");
  document.getElementById("pharmacy").innerHTML=`<div class="pharmacy-main">${esc(D.pharmacy.name)}</div><div class="muted">${esc(D.pharmacy.pharmacist)}</div>${phoneLink(D.pharmacy.phone)}`;
  document.getElementById("emergencyGrid").innerHTML=D.emergency.map(x=>`<button class="emergency" onclick="call('${esc(x[1])}')">☎️ ${esc(x[0])}<small>${esc(x[1])}</small></button>`).join("");
  const now=new Date(), death=D.death;
  const active=death && new Date(death.expiresAt+"T23:59:59")>=now;
  const dc=document.getElementById("deathCard");
  dc.classList.toggle("hidden",!active);
  if(active)dc.innerHTML=`<h2>🕊️ إعلان وفاة وعزاء</h2><div class="big">${esc(death.name)} ${esc(death.family)}</div><div>صلاة الجنازة: ${esc(death.funeral)}</div><div>العزاء: ${esc(death.place)}</div>${phoneLink(death.phone)}`;
  document.getElementById("clinics").innerHTML=D.clinics.map(c=>{const h=now.getHours()+now.getMinutes()/60;const [m1,m2]=c.morning.split("-").map(t=>hm(t));const [e1,e2]=c.evening.split("-").map(t=>hm(t));const open=(h>=m1&&h<m2)||(h>=e1&&h<e2);return `<div class="clinic"><b>${esc(c.name)}</b> <span class="status ${open?"":"closed"}">${open?"مفتوح الآن":"مغلق الآن"}</span><div class="muted">صباحي: ${esc(c.morning)} • مسائي: ${esc(c.evening)}</div>${phoneLink(c.phone)}</div>`}).join("");
}
function hm(s){let p=s.trim().split(":");return +p[0]+(+p[1]||0)/60}
function call(p){if(p&&p!=="—")location.href="tel:"+p}
function clock(){const d=new Date();document.getElementById("clock").textContent=d.toLocaleTimeString("ar-SY",{hour:"2-digit",minute:"2-digit"})}
setInterval(clock,1000);clock();

function loadAPIs(){
  fetch("https://api.open-meteo.com/v1/forecast?latitude=35.72&longitude=36.50&current=temperature_2m,weather_code&timezone=auto")
    .then(r=>r.json()).then(x=>{const c=x.current;document.getElementById("weather").innerHTML=`<div class="weather-temp">${Math.round(c.temperature_2m)}°C</div><div>${weatherText(c.weather_code)}</div>`;document.getElementById("weatherTime").textContent="مباشر"}).catch(()=>document.getElementById("weather").innerHTML='<div class="muted">تعذر جلب الطقس الآن. البيانات المحلية تبقى متاحة.</div>');
  fetch("https://api.aladhan.com/v1/timingsByCity?city=Armanaz&country=Syria&method=4")
    .then(r=>r.json()).then(x=>{const t=x.data.timings;document.getElementById("prayers").innerHTML=[["الفجر",t.Fajr],["الظهر",t.Dhuhr],["العصر",t.Asr],["المغرب",t.Maghrib],["العشاء",t.Isha]].map(p=>`<div class="prayer"><b>${p[0]}</b>${p[1]}</div>`).join("");document.getElementById("prayerDate").textContent=x.data.date.readable}).catch(()=>document.getElementById("prayers").innerHTML='<div class="muted">تعذر جلب المواقيت الآن.</div>');
}
function weatherText(c){if(c===0)return"صحو";if([1,2,3].includes(c))return"غائم جزئيًا";if([45,48].includes(c))return"ضباب";if(c>=51&&c<=67)return"أمطار";if(c>=71&&c<=77)return"ثلوج";if(c>=80&&c<=82)return"زخات مطر";if(c>=95)return"عواصف رعدية";return"حالة جوية متغيرة"}

const modal=document.getElementById("adminModal");
document.getElementById("adminBtn").onclick=()=>{openAdmin();modal.classList.remove("hidden")};
document.getElementById("closeAdmin").onclick=()=>modal.classList.add("hidden");
function openAdmin(){
  a_usdSyp.value=D.rates.usdSyp;a_trySyp.value=D.rates.trySyp;a_usdTry.value=D.rates.usdTry;
  a_phName.value=D.pharmacy.name;a_pharmacist.value=D.pharmacy.pharmacist;a_phPhone.value=D.pharmacy.phone;
  if(D.death){a_dName.value=D.death.name;a_dFamily.value=D.death.family;a_dFuneral.value=D.death.funeral;a_dPlace.value=D.death.place;a_dPhone.value=D.death.phone;a_dExpires.value=D.death.expiresAt}
  emergencyInputs.innerHTML=D.emergency.map((x,i)=>`<label>${esc(x[0])}<input id="e${i}" value="${esc(x[1])}"></label>`).join("");
  clinicInputs.innerHTML=D.clinics.map((c,i)=>`<label>اسم العيادة<input id="c${i}n" value="${esc(c.name)}"></label><label>الهاتف<input id="c${i}p" value="${esc(c.phone)}"></label><label>الدوام الصباحي<input id="c${i}m" value="${esc(c.morning)}"></label><label>الدوام المسائي<input id="c${i}e" value="${esc(c.evening)}"></label>`).join("");
}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.remove("hidden")});
saveRates.onclick=()=>{D.rates={usdSyp:a_usdSyp.value,trySyp:a_trySyp.value,usdTry:a_usdTry.value,updatedAt:new Date().toLocaleString("ar-SY")};save();alert("تم حفظ الأسعار")};
savePharmacy.onclick=()=>{D.pharmacy={name:a_phName.value,pharmacist:a_pharmacist.value,phone:a_phPhone.value,date:new Date().toISOString().slice(0,10)};save();alert("تم حفظ المناوبة")};
saveDeath.onclick=()=>{D.death={name:a_dName.value,family:a_dFamily.value,funeral:a_dFuneral.value,place:a_dPlace.value,phone:a_dPhone.value,expiresAt:a_dExpires.value||new Date(Date.now()+3*86400000).toISOString().slice(0,10)};save();alert("تم نشر البطاقة")};
removeDeath.onclick=()=>{D.death=null;save();alert("تم حذف البطاقة")};
saveEmergency.onclick=()=>{D.emergency=D.emergency.map((x,i)=>[x[0],document.getElementById("e"+i).value]);save();alert("تم حفظ الأرقام")};
saveClinics.onclick=()=>{D.clinics=D.clinics.map((c,i)=>({name:document.getElementById("c"+i+"n").value,phone:document.getElementById("c"+i+"p").value,morning:document.getElementById("c"+i+"m").value,evening:document.getElementById("c"+i+"e").value}));save();alert("تم حفظ العيادات")};

renderAll();loadAPIs();

/*
  ربط Firebase:
  هذه النسخة تعمل فورًا على GitHub Pages وتحفظ لوحة الإدارة محليًا في نفس المتصفح.
  لكي تظهر التعديلات لجميع الزوار، اربط Firestore هنا ثم استبدل دوال save/data
  باستدعاءات Firebase. لا تضع كلمة مرور المدير أو مفاتيح سرية في JavaScript.
*/
