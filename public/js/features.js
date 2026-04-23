// GramCare — Features (All working with backend API)

// === DOCTORS & APPOINTMENTS ===
let allDoctors=[],selectedSlot=null;
async function loadDoctors(){
  try{allDoctors=await api('/api/doctors');
  const sel=document.getElementById('doctorSelect');if(!sel)return;
  sel.innerHTML='<option value="">Select a doctor</option>'+allDoctors.map(d=>`<option value="${d.id}" ${!d.available?'disabled':''}>${d.photo} ${d.name} — ${d.specialty}${!d.available?' (Unavailable)':''}</option>`).join('');
  // Also populate consult doctor list
  const csel=document.getElementById('consultDoctorSelect');if(csel)csel.innerHTML='<option value="">Select a doctor</option>'+allDoctors.filter(d=>d.available).map(d=>`<option value="${d.id}">${d.photo} ${d.name} — ${d.specialty}</option>`).join('')}catch(e){}
}
function updateSlots(){
  const id=document.getElementById('doctorSelect').value;const cont=document.getElementById('slotsContainer');const info=document.getElementById('doctorInfo');
  if(!id){cont.innerHTML='<span style="color:#aaa;font-size:13px">Select a doctor</span>';info.innerHTML='';return}
  const d=allDoctors.find(x=>x.id===id);
  info.innerHTML=`<div style="padding:12px;background:var(--cream);border-radius:12px;margin-bottom:16px;font-size:14px"><strong>${d.photo} ${d.name}</strong><br><span style="color:#888;font-size:13px">${d.specialty} • ${d.village} • ⭐ ${d.rating} • ${d.experience} yrs</span></div>`;
  cont.innerHTML=d.slots.map(s=>`<button class="btn btn-sm btn-outline" onclick="pickSlot(this,'${s}')">${s}</button>`).join('');
}
function pickSlot(btn,slot){document.querySelectorAll('#slotsContainer .btn').forEach(b=>{b.className='btn btn-sm btn-outline'});btn.className='btn btn-sm btn-terra';selectedSlot=slot}

async function bookAppt(){
  const docId=document.getElementById('doctorSelect').value,name=document.getElementById('apptName').value||currentUser?.name,reason=document.getElementById('apptReason').value;
  if(!docId||!selectedSlot){toast('Select a doctor and time slot','error');return}
  const btn=document.getElementById('bookBtn');btn.textContent='Booking...';btn.disabled=true;
  try{const a=await api('/api/appointments',{method:'POST',body:JSON.stringify({doctorId:docId,patientName:name,slot:selectedSlot,reason})});
    document.getElementById('apptResult').innerHTML=`<div style="padding:16px;background:rgba(155,168,159,.15);border-radius:12px;font-size:14px"><strong>✓ ${a.id}</strong> — ${a.doctorName} • ${a.slot} • ${a.date}</div>`;
    toast('Appointment booked!','success');selectedSlot=null;loadAppointments();
  }catch(e){toast(e.message,'error')}
  btn.textContent='Confirm Booking';btn.disabled=false;
}

async function loadAppointments(){
  try{const apts=await api('/api/appointments');
  const recent=document.getElementById('recentAppointments');const full=document.getElementById('appointmentsList');
  if(!apts.length){if(recent)recent.innerHTML='<p style="color:#aaa;font-size:14px">No appointments yet.</p>';if(full)full.innerHTML='<p style="color:#aaa">No appointments.</p>';return}
  const render=a=>`<div class="list-item"><div class="list-icon" style="background:rgba(193,122,77,.12)">📅</div><div class="list-content"><div class="list-title">${a.doctorName}</div><div class="list-sub">${a.specialty} • ${a.slot} • ${a.date}</div></div><span class="badge badge-green">${a.status}</span></div>`;
  if(recent)recent.innerHTML=apts.slice(0,3).map(render).join('');
  if(full)full.innerHTML=apts.map(render).join('')}catch(e){}
}

// === MEDICINES ===
let medTimer;
function searchMeds(q){
  clearTimeout(medTimer);const t=document.getElementById('medResults');
  if(!q||q.length<2){t.innerHTML='';return}
  t.innerHTML='<p style="color:#aaa">Searching...</p>';
  medTimer=setTimeout(async()=>{try{const m=await api('/api/medicines?q='+encodeURIComponent(q));
    if(!m.length){t.innerHTML='<p style="color:#aaa">No results.</p>';return}
    t.innerHTML=m.map(x=>`<div class="list-item"><div class="list-icon" style="background:${x.stock>20?'rgba(155,168,159,.15)':x.stock>0?'rgba(193,122,77,.12)':'rgba(239,68,68,.1)'}">💊</div><div class="list-content"><div class="list-title">${x.name}</div><div class="list-sub">${x.generic} • ${x.pharmacy} • ₹${x.price}</div></div><span class="badge ${x.stock===0?'badge-red':x.stock<20?'badge-orange':'badge-green'}">${x.stock===0?'Out of Stock':x.stock+' in stock'}</span></div>`).join('')}catch(e){}},300);
}

// === SYMPTOM CHECKER ===
async function checkSymptom(){
  const input=document.getElementById('symptomInput');const v=input.value.trim();if(!v)return;
  const chat=document.getElementById('chatContainer');
  chat.innerHTML+=`<div class="chat-msg user">${v}</div>`;input.value='';
  try{const r=await api('/api/symptoms',{method:'POST',body:JSON.stringify({symptom:v})});
    let html='';
    if(r.found){html=`<strong>Analysis:</strong> ${r.advice}<br><br><span class="badge ${r.urgency==='CRITICAL'?'badge-red':r.urgency==='HIGH'?'badge-orange':'badge-green'}">${r.urgency}</span> • Specialist: ${r.doctor}`;if(r.suggest)html+=` • OTC: ${r.suggest}`}
    else html=r.advice;
    chat.innerHTML+=`<div class="chat-msg bot">${html}</div>`}catch(e){chat.innerHTML+=`<div class="chat-msg bot">Error. Try again.</div>`}
  chat.scrollTop=chat.scrollHeight;
}

// === CONSULTATION (Real chat with WebRTC audio/video support) ===
let activeConsultation=null,pollTimer=null,lastMsgId='0';
let peerConnection=null,localStream=null,remoteStream=null;
let signalingIndex=0,micEnabled=false,camEnabled=false,speakerEnabled=true;

async function requestConsultation(){
  const docId=document.getElementById('consultDoctorSelect')?.value;
  const mode=document.querySelector('input[name="consultMode"]:checked')?.value||'chat';
  const reason=document.getElementById('consultReason')?.value||'';
  if(!docId){toast('Select a doctor','error');return}
  try{
    const con=await api('/api/consultations',{method:'POST',body:JSON.stringify({patientId:currentUser.id,patientName:currentUser.name,doctorId:docId,mode,reason})});
    activeConsultation=con;lastMsgId='0';
    document.getElementById('consultSetup').style.display='none';
    document.getElementById('consultActive').style.display='block';
    // Show correct UI based on mode
    if(mode==='chat'){
      document.getElementById('callContainer').style.display='none';
      document.getElementById('chatOnlyContainer').style.display='block';
    } else {
      document.getElementById('chatOnlyContainer').style.display='none';
      document.getElementById('callContainer').style.display='block';
      const doc=allDoctors.find(d=>d.id===con.doctorId);
      document.getElementById('callDocName').textContent=con.doctorName;
      document.getElementById('callSpecialty').textContent=con.specialty;
      if(mode==='video'){
        document.getElementById('videoArea').style.display='block';
        document.getElementById('audioArea').style.display='none';
        document.getElementById('btnCam').style.display='';
      } else {
        document.getElementById('videoArea').style.display='none';
        document.getElementById('audioArea').style.display='block';
        document.getElementById('callAvatar').textContent=con.doctorName.split(' ').map(w=>w[0]).join('').slice(0,2);
        document.getElementById('callAudioName').textContent=con.doctorName;
        document.getElementById('callStatus').textContent='Connecting...';
        document.getElementById('btnCam').style.display='none';
      }
      startCallTimer();
      await initializeMediaForConsultation(mode);
    }
    document.getElementById('consultInfo').innerHTML=`<strong>${con.doctorName}</strong> • ${con.specialty} • <span class="badge badge-orange">Waiting for doctor...</span>`;
    document.getElementById('consultModeLabel').textContent=mode==='video'?'📹 Video Call':mode==='audio'?'🎙 Audio Call':'💬 Text Chat';
    
    startPolling(con.id);
    toast('Request sent to '+con.doctorName,'success');
  }catch(e){toast(e.message,'error')}
}

async function initializeMediaForConsultation(mode) {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: mode === 'video' ? { width: {ideal: 640}, height: {ideal: 480} } : false
    };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // For video mode, show video element
    if(mode === 'video') {
      const videoElement = document.getElementById('localVideo');
      if(videoElement) {
        videoElement.srcObject = localStream;
        videoElement.style.display = 'block';
      }
      const videoGrid = document.getElementById('videoArea');
      if(videoGrid) videoGrid.style.display = 'grid';
    } 
    // For audio mode, play audio locally (don't use audio element, let WebRTC handle it)
    else {
      const audioArea = document.getElementById('audioArea');
      if(audioArea) audioArea.style.display = 'flex';
      // Audio will be handled through WebRTC peer connection
    }
    
    // Initialize peer connection immediately after getting media
    initializePeerConnection();
    
    // Try to initiate call to doctor
    await initiateWebRTCCall();
    
    micEnabled = true;
    camEnabled = (mode === 'video');
    speakerEnabled = true;
    
    console.log(`✅ Media initialized for ${mode} call`);
  } catch(e) {
    toast('Media access failed: ' + e.message, 'error');
    console.error('Media error:', e);
  }
}

function startPolling(conId){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(async()=>{
    try{
      const r=await api(`/api/consultations/${conId}/messages?after=${lastMsgId}`);
      if(r.status==='ACTIVE'){
        document.getElementById('consultInfo').innerHTML=document.getElementById('consultInfo').innerHTML.replace(/Waiting for doctor.../,'<span class="badge badge-green">Connected</span>');
        const cs=document.getElementById('callStatus');if(cs&&cs.textContent==='Connecting...')cs.textContent='🟢 Connected';
        const wf=document.querySelectorAll('.wave-bar');wf.forEach(b=>b.classList.remove('paused'));
      }
      if(r.status==='ENDED'){
        clearInterval(pollTimer);stopCallTimer();
        document.getElementById('consultInfo').innerHTML+=' <span class="badge badge-red">Ended</span>';
        const cs=document.getElementById('callStatus');if(cs)cs.textContent='Call Ended';
        const wf=document.querySelectorAll('.wave-bar');wf.forEach(b=>b.classList.add('paused'));
        endWebRTCConnection();return;
      }
      r.messages.forEach(m=>{
        if(m.sender!==currentUser.id){
          const el=document.getElementById('consultMessages');if(el)el.innerHTML+=`<div class="chat-msg bot"><strong>${m.senderName}:</strong> ${m.text}</div>`;
          const cm=document.getElementById('callChatMsgs');if(cm)cm.innerHTML+=`<div style="margin:4px 0"><strong>${m.senderName}:</strong> ${m.text}</div>`;
        }
        lastMsgId=m.id;
      });
      if(r.messages.length){const el=document.getElementById('consultMessages');if(el)el.scrollTop=el.scrollHeight}
    }catch(e){}
  },2000);
}

async function pollSignaling(conId) {
  try {
    const res = await api(`/api/consultations/${conId}/signal?since=${signalingIndex}`);
    if(res.signals && res.signals.length > 0) {
      for(let sig of res.signals) {
        await handleSignaling(sig);
        signalingIndex++;
      }
    }
  } catch(e) {
    console.error('Signaling poll error:', e);
  }
}

async function handleSignaling(signal) {
  if(!peerConnection) {
    initializePeerConnection();
  }
  
  try {
    if(signal.type === 'offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await api(`/api/consultations/${activeConsultation.id}/signal`, {
        method: 'POST',
        body: JSON.stringify({ type: 'answer', data: answer, from: currentUser.id })
      });
    } else if(signal.type === 'answer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
    } else if(signal.type === 'ice') {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
      } catch(e) {
        console.error('ICE error:', e);
      }
    }
  } catch(e) {
    console.error('Signaling error:', e);
  }
}

function initializePeerConnection() {
  if(peerConnection) {
    peerConnection.close();
  }
  
  const config = { 
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] }
    ] 
  };
  
  peerConnection = new RTCPeerConnection(config);
  console.log('✅ RTCPeerConnection created');
  
  // Add local tracks to peer connection
  if(localStream) {
    localStream.getTracks().forEach(track => {
      const sender = peerConnection.addTrack(track, localStream);
      console.log(`✅ Added ${track.kind} track to peer connection`);
    });
  }
  
  // Handle remote tracks
  peerConnection.ontrack = (event) => {
    console.log(`📡 Received ${event.track.kind} track from remote`);
    remoteStream = event.streams[0];
    
    if(event.track.kind === 'video') {
      const remoteVideo = document.getElementById('remoteVideo');
      if(remoteVideo) {
        remoteVideo.srcObject = remoteStream;
        console.log('✅ Remote video connected');
      }
    } else if(event.track.kind === 'audio') {
      // Play remote audio through speaker
      const remoteAudio = document.getElementById('remoteAudio');
      if(remoteAudio) {
        remoteAudio.srcObject = remoteStream;
        remoteAudio.play().catch(e => console.error('Audio play error:', e));
        console.log('✅ Remote audio connected');
      }
    }
  };
  
  // Handle ICE connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
    const statusEl = document.getElementById('callStatus');
    if(statusEl) {
      if(peerConnection.connectionState === 'connected') {
        statusEl.textContent = '🟢 Connected';
      } else if(peerConnection.connectionState === 'failed') {
        statusEl.textContent = '🔴 Connection Failed';
      }
    }
  };
  
  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if(event.candidate) {
      api(`/api/consultations/${activeConsultation.id}/signal`, {
        method: 'POST',
        body: JSON.stringify({ type: 'ice', data: event.candidate, from: currentUser.id })
      }).catch(e => console.error('ICE send error:', e));
    }
  };
}

async function initiateWebRTCCall() {
  if(!activeConsultation) {
    console.error('No active consultation');
    return;
  }
  
  if(!peerConnection) {
    initializePeerConnection();
  }
  
  try {
    console.log('Creating WebRTC offer...');
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await peerConnection.setLocalDescription(offer);
    console.log('✅ Offer created and local description set');
    
    await api(`/api/consultations/${activeConsultation.id}/signal`, {
      method: 'POST',
      body: JSON.stringify({ type: 'offer', data: offer, from: currentUser.id })
    });
    console.log('✅ Offer sent to doctor');
  } catch(e) {
    console.error('WebRTC initiation failed:', e);
    toast('WebRTC initiation failed: ' + e.message, 'error');
  }
}

function endWebRTCConnection() {
  if(localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  if(peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  remoteStream = null;
}

async function sendConsultMsg(){
  if(!activeConsultation)return;
  // Check which input is active
  let input=document.getElementById('consultInput');
  const callInput=document.getElementById('callChatInput');
  if(callInput&&callInput.value.trim())input=callInput;
  const text=input.value.trim();if(!text)return;
  try{await api(`/api/consultations/${activeConsultation.id}/message`,{method:'POST',body:JSON.stringify({sender:currentUser.id,senderName:currentUser.name,text})});
    const msgHtml=`<div class="chat-msg user">${text}</div>`;
    const el=document.getElementById('consultMessages');if(el){el.innerHTML+=msgHtml;el.scrollTop=el.scrollHeight}
    const callMsgs=document.getElementById('callChatMsgs');if(callMsgs)callMsgs.innerHTML+=`<div style="margin:4px 0"><strong style="color:#C17A4D">You:</strong> ${text}</div>`;
    input.value='';
  }catch(e){toast('Failed to send','error')}
}

async function endConsultation(){
  if(!activeConsultation)return;
  try{await api(`/api/consultations/${activeConsultation.id}/end`,{method:'PUT'});
    clearInterval(pollTimer);stopCallTimer();
    endWebRTCConnection();
    activeConsultation=null;
    document.getElementById('consultActive').style.display='none';
    document.getElementById('callContainer').style.display='none';
    document.getElementById('consultSetup').style.display='block';
    document.getElementById('consultMessages').innerHTML='';
    const callMsgs=document.getElementById('callChatMsgs');if(callMsgs)callMsgs.innerHTML='';
    toast('Consultation ended','info');
  }catch(e){}
}

// === DOCTOR: Incoming Requests ===
async function loadIncomingRequests(){
  if(!currentUser||currentUser.role!=='doctor')return;
  try{
    const doctorId=currentUser.doctorId||'DOC-001';
    const cons=await api(`/api/consultations?doctorId=${doctorId}`);
    const el=document.getElementById('incomingList');if(!el)return;
    if(!cons.length){el.innerHTML='<p style="color:#aaa">No consultation requests.</p>';return}
    el.innerHTML=cons.map(c=>`<div class="card" style="margin-bottom:12px"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><div><strong>${c.patientName}</strong><br><span style="font-size:13px;color:#888">${c.mode.toUpperCase()} • ${c.reason||'General'} • ${new Date(c.createdAt).toLocaleString()}</span></div><div style="display:flex;gap:8px">${c.status==='PENDING'?`<button class="btn btn-sm btn-terra" onclick="acceptRequest('${c.id}')">Accept</button>`:`<span class="badge ${c.status==='ACTIVE'?'badge-green':c.status==='ENDED'?'badge-red':'badge-orange'}">${c.status}</span>`}${c.status==='ACTIVE'?`<button class="btn btn-sm btn-outline" onclick="openDoctorChat('${c.id}')">Open Chat</button>`:''}</div></div></div></div>`).join('');
  }catch(e){}
}

async function acceptRequest(conId){
  try{await api(`/api/consultations/${conId}/accept`,{method:'PUT'});toast('Request accepted!','success');loadIncomingRequests()}catch(e){toast(e.message,'error')}
}

function openDoctorChat(conId){
  activeConsultation={id:conId};lastMsgId='0';
  document.getElementById('consultSetup').style.display='none';
  document.getElementById('consultActive').style.display='block';
  document.getElementById('consultInfo').innerHTML='<strong>Patient Consultation</strong> <span class="badge badge-green">Active</span>';
  document.getElementById('consultModeLabel').textContent='💬 Live Chat';
  document.getElementById('consultMessages').innerHTML='';
  startPolling(conId);
  showSection('consult');
}

// === RECORDS ===
async function loadRecords(){try{const r=await api('/api/records');const el=document.getElementById('recordsList');if(!el)return;el.innerHTML=r.length?r.map(x=>`<div class="list-item"><div class="list-icon" style="background:rgba(155,168,159,.15)">📋</div><div class="list-content"><div class="list-title">${x.patientName}</div><div class="list-sub">${x.type} • ${x.date} • ${x.id}</div></div><span class="badge badge-green">Synced</span><button class="btn btn-sm btn-outline" style="margin-left:8px" onclick="delRecord('${x.id}')">×</button></div>`).join(''):'<p style="color:#aaa">No records.</p>'}catch(e){}}
async function addRecord(){
  const name=document.getElementById('recName').value||currentUser?.name,date=document.getElementById('recDate').value,type=document.getElementById('recType').value,notes=document.getElementById('recNotes').value;
  if(!date||!notes){toast('Fill all fields','error');return}
  try{await api('/api/records',{method:'POST',body:JSON.stringify({patientName:name,date,type,notes})});toast('Record saved!','success');loadRecords();closeModal('recordModal');document.getElementById('recNotes').value=''}catch(e){}
}
async function delRecord(id){try{await api('/api/records/'+id,{method:'DELETE'});toast('Deleted','info');loadRecords()}catch(e){}}
function syncRecs(){toast('All records synced!','success');loadRecords()}

// === FAMILY ===
async function loadFamily(){try{const p=await api('/api/profiles');const el=document.getElementById('familyList');if(!el)return;el.innerHTML=p.length?p.map(x=>`<div class="list-item"><div class="list-icon" style="background:rgba(193,122,77,.12)">👤</div><div class="list-content"><div class="list-title">${x.name}</div><div class="list-sub">Age ${x.age} • ${x.relation}</div></div><button class="btn btn-sm btn-outline" onclick="delFamily('${x.id}')">Remove</button></div>`).join(''):'<p style="color:#aaa">No family members.</p>'}catch(e){}}
async function addFamilyMember(){
  const name=document.getElementById('famName').value,age=document.getElementById('famAge').value,rel=document.getElementById('famRel').value;
  if(!name||!age){toast('Enter name & age','error');return}
  try{await api('/api/profiles',{method:'POST',body:JSON.stringify({name,age,relation:rel||'Self'})});toast('Added!','success');loadFamily();document.getElementById('famName').value='';document.getElementById('famAge').value='';document.getElementById('famRel').value=''}catch(e){}
}
async function delFamily(id){try{await api('/api/profiles/'+id,{method:'DELETE'});toast('Removed','info');loadFamily()}catch(e){}}

// === SOS ===
async function triggerSOS(){
  openModal('sosModal');const el=document.getElementById('sosContent');
  el.innerHTML='<div style="font-size:48px;margin:20px 0">🚑</div><p>Dispatching...</p>';
  try{const s=await api('/api/sos',{method:'POST',body:JSON.stringify({patientName:currentUser?.name||'User',location:currentUser?.village||'GPS'})});
  el.innerHTML=`<div style="font-size:48px;margin:20px 0">🚑</div><h3 style="color:#ef4444;margin-bottom:12px">Emergency Dispatched</h3><div style="background:rgba(239,68,68,.08);padding:16px;border-radius:12px;text-align:left;font-size:14px"><strong>${s.id}</strong><br>Ambulance ETA: ${s.ambulanceETA} mins<br>${s.hospital}</div><button class="btn btn-terra" onclick="closeModal('sosModal')" style="margin-top:16px">Dismiss</button>`;
  toast('⚠ SOS dispatched!','error');speakText('Emergency SOS triggered.')}catch(e){el.innerHTML='<p style="color:#ef4444">Failed. Call 108.</p>'}
}

// === ALERTS ===
async function loadDashAlerts(){
  try{const a=await api('/api/alerts');
  const el=document.getElementById('dashAlerts');if(el)el.innerHTML=a.slice(0,3).map(x=>`<div class="list-item"><div class="list-icon" style="background:${x.type==='CRITICAL'?'rgba(239,68,68,.1)':x.type==='WARNING'?'rgba(193,122,77,.12)':'rgba(155,168,159,.15)'}">${x.type==='CRITICAL'?'🔴':x.type==='WARNING'?'🟡':'🟢'}</div><div class="list-content"><div class="list-title">${x.title}</div><div class="list-sub">${x.region} • ${x.date}</div></div><span class="badge ${x.type==='CRITICAL'?'badge-red':x.type==='WARNING'?'badge-orange':'badge-green'}">${x.type}</span></div>`).join('');
  const al=document.getElementById('alertsList');if(al)al.innerHTML=a.map(x=>`<div class="card" style="margin-bottom:12px"><div class="card-body"><span class="badge ${x.type==='CRITICAL'?'badge-red':x.type==='WARNING'?'badge-orange':'badge-green'}" style="margin-bottom:8px">${x.type}</span><h4 style="font-size:16px;font-weight:600;margin-top:4px">${x.title}</h4><p style="font-size:13px;color:#888;margin-top:2px">${x.region} • ${x.date}</p><p style="font-size:14px;margin-top:8px">${x.detail}</p></div></div>`).join('')}catch(e){}
}

// === CAMPS ===
async function loadCamps(){
  try{
    const [camps,vData]=await Promise.all([api('/api/camps'),api('/api/villages')]);
    // Map camp locations to village coordinates
    const locMap={};
    vData.villages.forEach(v=>{locMap[v.name]={x:v.x,y:v.y,status:v.status}});
    // Render camp map
    const svg=document.getElementById('campMap');
    if(svg) renderCampMap(svg,camps,vData,locMap);
    // Render camp cards
    const el=document.getElementById('campsList');if(!el)return;
    el.innerHTML=camps.map(c=>{const pct=Math.round(c.registered/c.slots*100);const avail=c.slots-c.registered;const col=avail>c.slots*.3?'#10b981':avail>0?'#f59e0b':'#ef4444';
    return`<div class="card" style="margin-bottom:12px;border-left:4px solid ${col}"><div class="card-body"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px"><div style="flex:1;min-width:200px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><h4 style="font-size:16px;font-weight:600">${c.name}</h4></div><p style="font-size:13px;color:#888;margin:2px 0">📍 ${c.location} | 📅 ${c.date}</p><p style="font-size:13px;color:#888;margin:2px 0">🏛️ ${c.org}</p><p style="font-size:13px;margin-top:4px">${c.description}</p><div style="height:6px;background:#e5e7eb;border-radius:4px;margin-top:10px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${col};transition:width .3s"></div></div><p style="font-size:12px;color:#666;margin-top:6px"><strong style="color:${col}">${avail}</strong> seats available • <strong>${c.registered}</strong>/${c.slots} (${pct}%)</p></div><button class="btn btn-sm btn-terra" onclick="regCamp('${c.id}')" ${avail===0?'disabled style="opacity:.5"':''}>${avail===0?'Full':'Register'}</button></div></div></div>`}).join('');
  }catch(e){console.error('Camp load:',e)}
}
function renderCampMap(svg,camps,vData,locMap){
  const ns='http://www.w3.org/2000/svg';svg.innerHTML='';
  const colors={available:'#9BA89F',critical:'#ef4444',limited:'#E8E0D5'};
  // Grid
  for(let i=0;i<=100;i+=10){const h=document.createElementNS(ns,'line');h.setAttribute('x1',0);h.setAttribute('y1',i);h.setAttribute('x2',100);h.setAttribute('y2',i);h.setAttribute('stroke','#E8E0D5');h.setAttribute('stroke-width','0.2');svg.appendChild(h);const v=document.createElementNS(ns,'line');v.setAttribute('x1',i);v.setAttribute('y1',0);v.setAttribute('x2',i);v.setAttribute('y2',100);v.setAttribute('stroke','#E8E0D5');v.setAttribute('stroke-width','0.2');svg.appendChild(v)}
  // Connections
  vData.connections.forEach(([a,b])=>{const va=vData.villages[a],vb=vData.villages[b];const l=document.createElementNS(ns,'line');l.setAttribute('x1',va.x);l.setAttribute('y1',va.y);l.setAttribute('x2',vb.x);l.setAttribute('y2',vb.y);l.setAttribute('stroke','#D4CFC7');l.setAttribute('stroke-width','0.3');l.setAttribute('stroke-dasharray','1,0.5');svg.appendChild(l)});
  // Villages
  vData.villages.forEach(v=>{const c=document.createElementNS(ns,'circle');c.setAttribute('cx',v.x);c.setAttribute('cy',v.y);c.setAttribute('r',2);c.setAttribute('fill',colors[v.status]||'#ccc');c.setAttribute('stroke','#fff');c.setAttribute('stroke-width','0.3');svg.appendChild(c);const t=document.createElementNS(ns,'text');t.setAttribute('x',v.x);t.setAttribute('y',v.y+4.5);t.setAttribute('text-anchor','middle');t.setAttribute('font-size','2');t.setAttribute('fill','#888');t.textContent=v.name;svg.appendChild(t)});
  // Camp markers (pulsing)
  camps.forEach(c=>{
    const loc=c.location.split(' ')[0];let cx=50,cy=50;
    for(const k in locMap){if(c.location.toLowerCase().includes(k.toLowerCase())){cx=locMap[k].x;cy=locMap[k].y;break}}
    // Pulse ring
    const pulse=document.createElementNS(ns,'circle');pulse.setAttribute('cx',cx);pulse.setAttribute('cy',cy);pulse.setAttribute('r','4');pulse.setAttribute('fill','none');pulse.setAttribute('stroke','#C17A4D');pulse.setAttribute('stroke-width','0.3');pulse.setAttribute('opacity','0.6');const anim=document.createElementNS(ns,'animate');anim.setAttribute('attributeName','r');anim.setAttribute('values','3;6');anim.setAttribute('dur','2s');anim.setAttribute('repeatCount','indefinite');const anim2=document.createElementNS(ns,'animate');anim2.setAttribute('attributeName','opacity');anim2.setAttribute('values','0.6;0');anim2.setAttribute('dur','2s');anim2.setAttribute('repeatCount','indefinite');pulse.appendChild(anim);pulse.appendChild(anim2);svg.appendChild(pulse);
    // Camp dot
    const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);dot.setAttribute('r','2.5');dot.setAttribute('fill','#C17A4D');dot.setAttribute('stroke','#fff');dot.setAttribute('stroke-width','0.5');svg.appendChild(dot);
    // Camp icon
    const icon=document.createElementNS(ns,'text');icon.setAttribute('x',cx);icon.setAttribute('y',cy+1);icon.setAttribute('text-anchor','middle');icon.setAttribute('font-size','2.5');icon.textContent='⛺';svg.appendChild(icon);
    // Label
    const label=document.createElementNS(ns,'text');label.setAttribute('x',cx);label.setAttribute('y',cy-4);label.setAttribute('text-anchor','middle');label.setAttribute('font-size','1.8');label.setAttribute('font-weight','600');label.setAttribute('fill','#C17A4D');label.textContent=c.name;svg.appendChild(label);
  });
}
async function regCamp(id){try{await api('/api/camps/'+id+'/register',{method:'POST'});toast('Registered!','success');loadCamps()}catch(e){toast(e.message,'error')}}

// === VILLAGE MAP ===
async function loadVillageMap(){
  try{const data=await api('/api/villages');const svg=document.getElementById('villageMap');if(!svg)return;
  const ns='http://www.w3.org/2000/svg';const colors={available:'#9BA89F',critical:'#C17A4D',limited:'#E8E0D5'};svg.innerHTML='';
  for(let i=0;i<=100;i+=10){const h=document.createElementNS(ns,'line');h.setAttribute('x1',0);h.setAttribute('y1',i);h.setAttribute('x2',100);h.setAttribute('y2',i);h.setAttribute('stroke','#E8E0D5');h.setAttribute('stroke-width','0.2');svg.appendChild(h);const v=document.createElementNS(ns,'line');v.setAttribute('x1',i);v.setAttribute('y1',0);v.setAttribute('x2',i);v.setAttribute('y2',100);v.setAttribute('stroke','#E8E0D5');v.setAttribute('stroke-width','0.2');svg.appendChild(v)}
  data.connections.forEach(([a,b])=>{const va=data.villages[a],vb=data.villages[b];const l=document.createElementNS(ns,'line');l.setAttribute('x1',va.x);l.setAttribute('y1',va.y);l.setAttribute('x2',vb.x);l.setAttribute('y2',vb.y);l.setAttribute('stroke','#D4CFC7');l.setAttribute('stroke-width','0.3');l.setAttribute('stroke-dasharray','1,0.5');svg.appendChild(l)});
  data.villages.forEach(v=>{const g=document.createElementNS(ns,'g');g.style.cursor='pointer';
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx',v.x);c.setAttribute('cy',v.y);c.setAttribute('r',v.status==='available'?3:2.5);c.setAttribute('fill',colors[v.status]);c.setAttribute('stroke','#fff');c.setAttribute('stroke-width','0.5');g.appendChild(c);
    const t=document.createElementNS(ns,'text');t.setAttribute('x',v.x);t.setAttribute('y',v.y+5.5);t.setAttribute('text-anchor','middle');t.setAttribute('font-size','2.2');t.setAttribute('font-family','Satoshi,sans-serif');t.setAttribute('font-weight','600');t.setAttribute('fill','#3D3D3D');t.textContent=v.name;g.appendChild(t);
    const fo=document.createElementNS(ns,'foreignObject');fo.setAttribute('x',v.x+4);fo.setAttribute('y',v.y-8);fo.setAttribute('width','28');fo.setAttribute('height','16');fo.style.display='none';fo.style.overflow='visible';
    fo.innerHTML=`<div xmlns="http://www.w3.org/1999/xhtml" style="background:white;padding:5px 6px;font-family:Satoshi,sans-serif;font-size:5.5px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.1);width:max-content;line-height:1.6"><div style="font-weight:700;font-size:6.5px">${v.name}</div><div style="color:#888">Pop: ${v.pop.toLocaleString()} • Docs: ${v.doctors}</div><div style="color:${colors[v.status]};font-weight:600">${v.status.toUpperCase()} (${v.risk}%)</div></div>`;
    g.appendChild(fo);g.addEventListener('mouseenter',()=>fo.style.display='block');g.addEventListener('mouseleave',()=>fo.style.display='none');svg.appendChild(g)})}catch(e){}
}

// === CALL CONTROLS ===
let callTimer=null,callStartTime=null;

function toggleMic(){
  micEnabled=!micEnabled;
  const btn=document.getElementById('btnMic');
  if(btn){
    btn.classList.toggle('active');
    btn.style.background=micEnabled?'#333':'#C17A4D';
  }
  toast(micEnabled?'Microphone on':'Microphone off','info');
}

function toggleCam(){
  camEnabled=!camEnabled;
  const btn=document.getElementById('btnCam');
  if(btn){
    btn.classList.toggle('active');
    btn.style.background=camEnabled?'#333':'#C17A4D';
  }
  toast(camEnabled?'Camera on':'Camera off','info');
}

function toggleSpeaker(){
  speakerEnabled=!speakerEnabled;
  const btn=document.getElementById('btnSpeaker');
  if(btn){
    btn.classList.toggle('active');
    btn.style.background=speakerEnabled?'#333':'#C17A4D';
  }
  toast(speakerEnabled?'Speaker on':'Speaker off','info');
}

function startCallTimer(){
  callStartTime=Date.now();
  callTimer=setInterval(()=>{
    const elapsed=Math.floor((Date.now()-callStartTime)/1000);
    const mins=Math.floor(elapsed/60);
    const secs=elapsed%60;
    const timerEl=document.querySelector('.call-header .call-timer');
    if(timerEl)timerEl.textContent=`${mins}:${secs.toString().padStart(2,'0')}`;
  },1000);
}

function stopCallTimer(){
  if(callTimer)clearInterval(callTimer);
}

// Lazy load
const sectionLoaders={medicines:()=>searchMeds(''),records:loadRecords,family:loadFamily,alerts:loadDashAlerts,camps:loadCamps,incoming:loadIncomingRequests};
const origShow=showSection;
window.showSection=function(name){origShow(name);if(sectionLoaders[name])sectionLoaders[name]()}
