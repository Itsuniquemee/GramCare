// GramCare — Core App (Role-aware)
const API='';
let currentUser=null;

function toast(msg,type='info'){const c=document.getElementById('toastContainer');if(!c)return;const t=document.createElement('div');t.className='toast '+type;t.innerHTML=`<span>${msg}</span>`;c.appendChild(t);setTimeout(()=>{t.classList.add('hiding');setTimeout(()=>t.remove(),300)},3500)}

function openModal(id){document.getElementById(id).classList.add('active');document.body.style.overflow='hidden'}
function closeModal(id){document.getElementById(id).classList.remove('active');document.body.style.overflow=''}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))closeModal(e.target.id)});

async function api(path,opts={}){
  const r=await fetch(API+path,{headers:{'Content-Type':'application/json'},...opts});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Failed');return d;
}

function showSection(name){
  document.querySelectorAll('[id^="section-"]').forEach(s=>s.style.display='none');
  const el=document.getElementById('section-'+name);if(el)el.style.display='block';
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(event?.currentTarget)event.currentTarget.classList.add('active');
  const titles={dashboard:['Dashboard','Overview of your health system'],appointments:['Appointments','Manage bookings'],medicines:['Medicines','Search pharmacy inventory'],records:['Health Records','Manage records'],symptoms:['AI Checker','Describe your symptoms'],consult:['Consultation','Connect with a doctor'],family:['Family Profiles','Manage members'],alerts:['Health Alerts','Active advisories'],camps:['Health Camps','Upcoming events'],incoming:['Incoming Requests','Patient consultation requests']};
  const t=titles[name]||['GramCare',''];
  document.getElementById('pageTitle').textContent=t[0];
  document.getElementById('pageSub').textContent=t[1];
  if(window.innerWidth<=900)toggleSidebar();
}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('mobileOverlay').classList.toggle('show')}

function speakText(text){if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=0.9;window.speechSynthesis.speak(u)}}

function logout(){localStorage.removeItem('gramcare_user');window.location.href='/login.html'}

// Init
document.addEventListener('DOMContentLoaded',async()=>{
  currentUser=JSON.parse(localStorage.getItem('gramcare_user'));
  if(!currentUser){window.location.href='/login.html';return}

  // Set user info in sidebar
  const uname=document.getElementById('userName');if(uname)uname.textContent=currentUser.name;
  const urole=document.getElementById('userRole');if(urole)urole.textContent=(currentUser.role==='doctor'?'Doctor':'Patient')+' • '+(currentUser.village||'Nabha');
  const uavatar=document.getElementById('userAvatar');if(uavatar)uavatar.textContent=currentUser.name.split(' ').map(w=>w[0]).join('').slice(0,2);
  document.getElementById('pageTitle').textContent='Dashboard';
  document.getElementById('pageSub').textContent='Welcome, '+currentUser.name.split(' ')[0];

  // Show/hide role-specific nav items
  if(currentUser.role==='doctor'){
    document.querySelectorAll('.patient-only').forEach(e=>e.style.display='none');
    document.querySelectorAll('.doctor-only').forEach(e=>e.style.display='');
  }else{
    document.querySelectorAll('.doctor-only').forEach(e=>e.style.display='none');
    document.querySelectorAll('.patient-only').forEach(e=>e.style.display='');
  }

  try{const s=await api('/api/status');
    const sp=document.getElementById('statPatients');if(sp)sp.textContent=s.patientsToday;
    const sd=document.getElementById('statDoctors');if(sd)sd.textContent=s.doctorsOnline+'/'+s.totalDoctors;
    const sn=document.getElementById('statNodes');if(sn)sn.textContent=s.networkNodes;
  }catch(e){}
  loadDoctors();loadAppointments();loadDashAlerts();loadVillageMap();
  if(currentUser.role==='doctor')loadIncomingRequests();
});
