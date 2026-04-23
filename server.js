const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === IN-MEMORY DATABASE (persists to db.json) ===
const DB_PATH = path.join(__dirname, 'db.json');

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }
  return getDefaultDB();
}

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getDefaultDB() {
  return {
    doctors: [
      { id: "DOC-001", name: "Dr. Harpreet Kaur", specialty: "General Medicine", village: "Nabha", available: true, slots: ["09:00","10:00","11:00","14:00","15:00"], photo: "👩‍⚕️", rating: 4.8, experience: 12 },
      { id: "DOC-002", name: "Dr. Rajinder Singh", specialty: "Pediatrics", village: "Amloh", available: true, slots: ["10:00","11:00","12:00","16:00"], photo: "👨‍⚕️", rating: 4.6, experience: 8 },
      { id: "DOC-003", name: "Dr. Manpreet Gill", specialty: "Orthopedics", village: "Patiala", available: false, slots: [], photo: "👨‍⚕️", rating: 4.9, experience: 15 },
      { id: "DOC-004", name: "Dr. Sukhdev Sharma", specialty: "Dermatology", village: "Nabha", available: true, slots: ["09:00","13:00","14:00"], photo: "👨‍⚕️", rating: 4.5, experience: 6 },
      { id: "DOC-005", name: "Dr. Amandeep Sidhu", specialty: "Gynecology", village: "Samana", available: true, slots: ["10:00","11:00","15:00","16:00"], photo: "👩‍⚕️", rating: 4.7, experience: 10 },
      { id: "DOC-006", name: "Dr. Kulwant Brar", specialty: "Cardiology", village: "Patiala", available: true, slots: ["09:00","10:00","14:00","15:00"], photo: "👨‍⚕️", rating: 4.9, experience: 20 }
    ],
    medicines: [
      { id: "MED-001", name: "Paracetamol 500mg", generic: "Acetaminophen", pharmacy: "Nabha PHC", stock: 120, price: 5, category: "Pain Relief" },
      { id: "MED-002", name: "Amoxicillin 250mg", generic: "Amoxicillin", pharmacy: "Amloh Pharmacy", stock: 45, price: 12, category: "Antibiotic" },
      { id: "MED-003", name: "ORS Packets", generic: "Oral Rehydration Salts", pharmacy: "Nabha PHC", stock: 200, price: 3, category: "Rehydration" },
      { id: "MED-004", name: "Metformin 500mg", generic: "Metformin HCl", pharmacy: "Samana Health Store", stock: 0, price: 8, category: "Diabetes" },
      { id: "MED-005", name: "Cetirizine 10mg", generic: "Cetirizine", pharmacy: "Nabha PHC", stock: 80, price: 4, category: "Antihistamine" },
      { id: "MED-006", name: "Ibuprofen 400mg", generic: "Ibuprofen", pharmacy: "Patiala Medical", stock: 60, price: 7, category: "Pain Relief" },
      { id: "MED-007", name: "Azithromycin 500mg", generic: "Azithromycin", pharmacy: "Amloh Pharmacy", stock: 15, price: 18, category: "Antibiotic" },
      { id: "MED-008", name: "Pantoprazole 40mg", generic: "Pantoprazole", pharmacy: "Nabha PHC", stock: 90, price: 6, category: "Gastric" },
      { id: "MED-009", name: "Insulin Glargine", generic: "Insulin", pharmacy: "Patiala Medical", stock: 5, price: 450, category: "Diabetes" },
      { id: "MED-010", name: "Salbutamol Inhaler", generic: "Salbutamol", pharmacy: "Samana Health Store", stock: 10, price: 120, category: "Respiratory" }
    ],
    patients: [
      { id: "PAT-2847", name: "Gurpreet Kaur", village: "Nabha", lastCheckup: "2026-03-15", risk: "LOW", age: 34, gender: "F", phone: "98xxx-xxxxx", conditions: [], vitals: { bp: "120/80", pulse: 72, temp: 98.4 } },
      { id: "PAT-1923", name: "Balwinder Singh", village: "Amloh", lastCheckup: "2026-01-08", risk: "HIGH", age: 67, gender: "M", phone: "97xxx-xxxxx", conditions: ["Diabetes","Hypertension"], vitals: { bp: "150/95", pulse: 88, temp: 98.6 } },
      { id: "PAT-3156", name: "Simran Dhillon", village: "Samana", lastCheckup: "2026-04-01", risk: "MEDIUM", age: 28, gender: "F", phone: "96xxx-xxxxx", conditions: ["Anemia"], vitals: { bp: "110/70", pulse: 76, temp: 98.2 } },
      { id: "PAT-0847", name: "Harbhajan Grewal", village: "Bhawanigarh", lastCheckup: "2025-11-20", risk: "CRITICAL", age: 72, gender: "M", phone: "95xxx-xxxxx", conditions: ["Heart Disease","Diabetes"], vitals: { bp: "165/100", pulse: 92, temp: 99.1 } }
    ],
    appointments: [],
    records: [],
    profiles: [],
    sosAlerts: [],
    users: [
      { id: "USR-001", name: "Gurpreet Kaur", email: "gurpreet@gramcare.in", phone: "98xxx-xxxxx", password: "password123", role: "patient", village: "Nabha", age: 34, createdAt: "2026-01-01" },
      { id: "USR-002", name: "Dr. Harpreet Kaur", email: "harpreet@gramcare.in", phone: "97xxx-xxxxx", password: "doctor123", role: "doctor", doctorId: "DOC-001", createdAt: "2026-01-01" },
      { id: "USR-003", name: "Dr. Rajinder Singh", email: "rajinder@gramcare.in", phone: "96xxx-xxxxx", password: "doctor123", role: "doctor", doctorId: "DOC-002", createdAt: "2026-01-01" }
    ],
    consultations: [],
    villages: [
      { name: "Nabha", pop: 75000, doctors: 3, risk: 18, x: 50, y: 45, status: "available" },
      { name: "Amloh", pop: 32000, doctors: 1, risk: 42, x: 25, y: 30, status: "limited" },
      { name: "Samana", pop: 28000, doctors: 1, risk: 38, x: 75, y: 25, status: "limited" },
      { name: "Patiala", pop: 410000, doctors: 45, risk: 8, x: 40, y: 70, status: "available" },
      { name: "Bhawanigarh", pop: 18000, doctors: 0, risk: 72, x: 80, y: 60, status: "critical" },
      { name: "Bhadson", pop: 12000, doctors: 0, risk: 65, x: 15, y: 65, status: "critical" },
      { name: "Dirba", pop: 22000, doctors: 1, risk: 35, x: 60, y: 80, status: "limited" }
    ],
    connections: [[0,1],[0,2],[0,3],[1,5],[2,4],[3,6],[4,6],[1,3]],
    camps: [
      { id: "CMP-001", name: "Eye Check Camp", date: "2026-05-10", location: "Nabha PHC", org: "NPCB", slots: 50, registered: 12, description: "Free eye screening and spectacle distribution" },
      { id: "CMP-002", name: "Maternal Health Camp", date: "2026-05-18", location: "Amloh CHC", org: "NHM Punjab", slots: 30, registered: 8, description: "Prenatal checkups, nutrition counseling" },
      { id: "CMP-003", name: "Diabetes Screening", date: "2026-06-01", location: "Samana PHC", org: "WHO India", slots: 80, registered: 23, description: "Free blood sugar testing and diet consultation" },
      { id: "CMP-004", name: "Vaccination Drive", date: "2026-05-25", location: "Bhawanigarh Village", org: "Govt. of Punjab", slots: 200, registered: 67, description: "COVID-19 booster + routine immunization" }
    ],
    alerts: [
      { id: "ALT-001", type: "WARNING", title: "Dengue Outbreak Alert", region: "Patiala District", date: "2026-04-20", detail: "12 confirmed cases in last 7 days. Use mosquito nets and remove stagnant water." },
      { id: "ALT-002", type: "INFO", title: "COVID Booster Available", region: "All PHCs", date: "2026-04-18", detail: "Free booster doses available at all Primary Health Centers for 18+ age group." },
      { id: "ALT-003", type: "CRITICAL", title: "Water Contamination", region: "Bhadson", date: "2026-04-21", detail: "E.coli detected in village water supply. Boil water advisory in effect." },
      { id: "ALT-004", type: "WARNING", title: "Heatwave Advisory", region: "Punjab State", date: "2026-04-19", detail: "Temperatures expected 45°C+. Stay hydrated, avoid outdoor work 11AM-4PM." }
    ],
    symptoms: {
      fever: { suggest: "Paracetamol 500mg", doctor: "General Medicine", urgency: "MEDIUM", advice: "Rest, stay hydrated, and monitor temperature. If fever persists >3 days or exceeds 103°F, consult a doctor immediately." },
      headache: { suggest: "Ibuprofen 400mg", doctor: "General Medicine", urgency: "LOW", advice: "Rest in a dark, quiet room. Stay hydrated. If headaches are severe or recurring, consult a doctor." },
      cough: { suggest: "Cough Syrup", doctor: "General Medicine", urgency: "LOW", advice: "Warm fluids and steam inhalation can help. If cough persists >2 weeks, get TB screening done." },
      "chest pain": { suggest: null, doctor: "Cardiology", urgency: "CRITICAL", advice: "⚠ EMERGENCY: This could be a heart attack. Go to the nearest hospital IMMEDIATELY. Call 108 for ambulance." },
      diarrhea: { suggest: "ORS Packets", doctor: "General Medicine", urgency: "HIGH", advice: "Start ORS immediately. Avoid solid food for a few hours. If blood in stool or dehydration signs, visit hospital." },
      "skin rash": { suggest: "Cetirizine 10mg", doctor: "Dermatology", urgency: "LOW", advice: "Avoid scratching. Apply calamine lotion. If rash spreads or causes fever, see a dermatologist." },
      "joint pain": { suggest: "Ibuprofen 400mg", doctor: "Orthopedics", urgency: "MEDIUM", advice: "Rest the affected joint. Apply warm compress. If pain is severe or following injury, see an orthopedic specialist." },
      breathing: { suggest: "Salbutamol Inhaler", doctor: "Pulmonology", urgency: "HIGH", advice: "Sit upright to ease breathing. If you have an inhaler, use it. If difficulty is severe, seek emergency care immediately." },
      vomiting: { suggest: "ORS Packets", doctor: "General Medicine", urgency: "MEDIUM", advice: "Sip fluids slowly. Avoid solid food for 6 hours. If vomiting persists >24hrs, seek medical attention." },
      "stomach pain": { suggest: "Pantoprazole 40mg", doctor: "General Medicine", urgency: "MEDIUM", advice: "Avoid spicy and oily food. If pain is severe, localized, or accompanied by fever, consult a doctor." },
      cold: { suggest: "Cetirizine 10mg", doctor: "General Medicine", urgency: "LOW", advice: "Rest, warm fluids, steam inhalation. Common cold resolves in 7-10 days. See doctor if symptoms worsen." },
      diabetes: { suggest: "Metformin 500mg", doctor: "Endocrinology", urgency: "MEDIUM", advice: "Monitor blood sugar regularly. Follow prescribed diet. Never skip medication without consulting your doctor." }
    }
  };
}

let db = loadDB();

// === STATS ===
let patientsToday = Math.floor(Math.random() * 40) + 60;
const startTime = Date.now();

// === API ROUTES ===

// System status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ACTIVE',
    version: '1.0.0',
    patientsToday: patientsToday,
    doctorsOnline: db.doctors.filter(d => d.available).length,
    totalDoctors: db.doctors.length,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    lastSync: new Date().toISOString(),
    networkNodes: db.villages.length
  });
});

// Doctors
app.get('/api/doctors', (req, res) => {
  const { specialty, available } = req.query;
  let docs = db.doctors;
  if (specialty) docs = docs.filter(d => d.specialty.toLowerCase().includes(specialty.toLowerCase()));
  if (available === 'true') docs = docs.filter(d => d.available);
  res.json(docs);
});

app.get('/api/doctors/:id', (req, res) => {
  const doc = db.doctors.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Doctor not found' });
  res.json(doc);
});

// Appointments
app.get('/api/appointments', (req, res) => res.json(db.appointments));

app.post('/api/appointments', (req, res) => {
  const { doctorId, patientName, slot, reason, village, phone, patientId } = req.body;
  if (!doctorId || !patientName || !slot) return res.status(400).json({ error: 'Missing required fields' });
  const doctor = db.doctors.find(d => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  // Try to find patient by name or ID
  let patient = null;
  if (patientId) {
    patient = db.users.find(u => u.id === patientId && u.role === 'patient');
  } else {
    patient = db.users.find(u => u.name === patientName && u.role === 'patient');
  }

  const appointment = {
    id: 'APT-' + Math.floor(Math.random() * 9000 + 1000),
    patientId: patient ? patient.id : null,
    doctorId, doctorName: doctor.name, specialty: doctor.specialty,
    patientName, slot, reason: reason || 'General Checkup',
    village: village || patient?.village || '', phone: phone || patient?.phone || '',
    status: 'CONFIRMED', 
    bookedAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    notes: '',
    vitals: {},
    duration: null,
    completedAt: null
  };
  db.appointments.unshift(appointment);
  patientsToday++;
  saveDB();
  res.status(201).json(appointment);
});

app.delete('/api/appointments/:id', (req, res) => {
  const idx = db.appointments.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.appointments.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});

// Update appointment details (notes, vitals, status)
app.put('/api/appointments/:id', (req, res) => {
  const apt = db.appointments.find(a => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  const { status, notes, vitals, duration } = req.body;
  if (status) apt.status = status;
  if (notes) apt.notes = notes;
  if (vitals) apt.vitals = { ...apt.vitals, ...vitals };
  if (duration) apt.duration = duration;
  
  if (status === 'COMPLETED') {
    apt.completedAt = new Date().toISOString();
  }

  saveDB();
  res.json(apt);
});

// Get appointment history for a patient
app.get('/api/patients/:patientId/appointments', (req, res) => {
  const { patientId } = req.params;
  const history = db.appointments.filter(a => a.patientId === patientId);
  res.json(history);
});

// Medicines
app.get('/api/medicines', (req, res) => {
  const { q } = req.query;
  let meds = db.medicines;
  if (q) meds = meds.filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.generic.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase()));
  res.json(meds);
});

// Records
app.get('/api/records', (req, res) => res.json(db.records));

app.post('/api/records', (req, res) => {
  const { patientId, patientName, date, type, notes, vitals, appointmentId } = req.body;
  if (!patientName || !date || !notes) return res.status(400).json({ error: 'Missing fields' });
  const record = {
    id: 'REC-' + Math.floor(Math.random() * 9000 + 1000),
    patientId: patientId || null,
    appointmentId: appointmentId || null,
    patientName, date, type: type || 'Checkup', notes,
    vitals: vitals || null,
    synced: true, createdAt: new Date().toISOString()
  };
  db.records.unshift(record);
  saveDB();
  res.status(201).json(record);
});

app.get('/api/patients/:patientId/records', (req, res) => {
  const { patientId } = req.params;
  const records = db.records.filter(r => r.patientId === patientId);
  res.json(records);
});

app.delete('/api/records/:id', (req, res) => {
  const idx = db.records.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.records.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});

// Family profiles
app.get('/api/profiles', (req, res) => res.json(db.profiles));

app.post('/api/profiles', (req, res) => {
  const { name, age, relation, gender, conditions } = req.body;
  if (!name || !age) return res.status(400).json({ error: 'Missing fields' });
  const profile = {
    id: 'FAM-' + Math.floor(Math.random() * 9000 + 1000),
    name, age: parseInt(age), relation: relation || 'Self',
    gender: gender || '', conditions: conditions || [],
    createdAt: new Date().toISOString()
  };
  db.profiles.push(profile);
  saveDB();
  res.status(201).json(profile);
});

app.delete('/api/profiles/:id', (req, res) => {
  const idx = db.profiles.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.profiles.splice(idx, 1);
  saveDB();
  res.json({ success: true });
});

// Symptom checker
app.post('/api/symptoms', (req, res) => {
  const { symptom } = req.body;
  if (!symptom) return res.status(400).json({ error: 'No symptom provided' });
  const s = symptom.toLowerCase();
  let matched = null;
  for (const key in db.symptoms) {
    if (s.includes(key)) { matched = { keyword: key, ...db.symptoms[key] }; break; }
  }
  if (matched) return res.json({ found: true, ...matched });
  res.json({ found: false, advice: 'Could not identify a specific condition. Please describe symptoms like: fever, headache, cough, chest pain, diarrhea, skin rash, joint pain, breathing difficulty, vomiting, stomach pain, cold, or diabetes.' });
});

// SOS
app.post('/api/sos', (req, res) => {
  const { patientName, location, description } = req.body;
  const sos = {
    id: 'SOS-' + Math.floor(Math.random() * 9000 + 1000),
    patientName: patientName || 'Unknown',
    location: location || 'GPS Not Available',
    description: description || 'Emergency',
    status: 'DISPATCHED',
    ambulanceETA: Math.floor(Math.random() * 15) + 10,
    hospital: 'Nabha Civil Hospital',
    triggeredAt: new Date().toISOString()
  };
  db.sosAlerts.unshift(sos);
  saveDB();
  res.status(201).json(sos);
});

// Alerts
app.get('/api/alerts', (req, res) => res.json(db.alerts));

// Camps
app.get('/api/camps', (req, res) => res.json(db.camps));

// Get camp with live seat availability
app.get('/api/camps/:id', (req, res) => {
  const camp = db.camps.find(c => c.id === req.params.id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });
  
  const availability = camp.slots - camp.registered;
  res.json({
    ...camp,
    availability,
    percentFull: Math.round((camp.registered / camp.slots) * 100)
  });
});

// Get camps map data (for map visualization)
app.get('/api/camps/map/data', (req, res) => {
  const mapData = db.camps.map(camp => ({
    id: camp.id,
    name: camp.name,
    lat: camp.lat,
    lng: camp.lng,
    location: camp.location,
    date: camp.date,
    status: camp.status,
    registered: camp.registered,
    slots: camp.slots,
    availability: camp.slots - camp.registered,
    percentFull: Math.round((camp.registered / camp.slots) * 100)
  }));
  res.json(mapData);
});

app.post('/api/camps/:id/register', (req, res) => {
  const camp = db.camps.find(c => c.id === req.params.id);
  if (!camp) return res.status(404).json({ error: 'Camp not found' });
  if (camp.registered >= camp.slots) return res.status(400).json({ error: 'Camp is full' });
  camp.registered++;
  saveDB();
  res.json({ success: true, camp });
});

// Villages/Map
app.get('/api/villages', (req, res) => {
  res.json({ villages: db.villages, connections: db.connections });
});

// Patients
app.get('/api/patients', (req, res) => res.json(db.patients));

// === AUTH ===
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role, village, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
  if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = {
    id: 'USR-' + Math.floor(Math.random() * 9000 + 1000),
    name, email, password, phone: phone || '',
    role: role || 'patient', village: village || '',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  saveDB();
  const { password: _, ...safe } = user;
  res.status(201).json(safe);
});

// === CONSULTATIONS ===
app.post('/api/consultations', (req, res) => {
  const { patientId, patientName, doctorId, mode, reason } = req.body;
  if (!patientName || !doctorId || !mode) return res.status(400).json({ error: 'Missing fields' });
  const doctor = db.doctors.find(d => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  const consultation = {
    id: 'CON-' + Math.floor(Math.random() * 9000 + 1000),
    patientId: patientId || 'unknown', patientName,
    doctorId, doctorName: doctor.name, specialty: doctor.specialty,
    mode, reason: reason || 'General consultation',
    status: 'PENDING', messages: [],
    createdAt: new Date().toISOString()
  };
  db.consultations.unshift(consultation);
  saveDB();
  res.status(201).json(consultation);
});

app.get('/api/consultations', (req, res) => {
  const { doctorId, patientId, status } = req.query;
  let cons = db.consultations;
  if (doctorId) cons = cons.filter(c => c.doctorId === doctorId);
  if (patientId) cons = cons.filter(c => c.patientId === patientId);
  if (status) cons = cons.filter(c => c.status === status);
  res.json(cons);
});

app.put('/api/consultations/:id/accept', (req, res) => {
  const con = db.consultations.find(c => c.id === req.params.id);
  if (!con) return res.status(404).json({ error: 'Not found' });
  con.status = 'ACTIVE';
  con.acceptedAt = new Date().toISOString();
  saveDB();
  res.json(con);
});

app.put('/api/consultations/:id/end', (req, res) => {
  const con = db.consultations.find(c => c.id === req.params.id);
  if (!con) return res.status(404).json({ error: 'Not found' });
  con.status = 'ENDED';
  con.endedAt = new Date().toISOString();
  saveDB();
  res.json(con);
});

app.post('/api/consultations/:id/message', (req, res) => {
  const con = db.consultations.find(c => c.id === req.params.id);
  if (!con) return res.status(404).json({ error: 'Not found' });
  const { sender, senderName, text } = req.body;
  const msg = { id: Date.now().toString(), sender, senderName, text, timestamp: new Date().toISOString() };
  con.messages.push(msg);
  saveDB();
  res.json(msg);
});

app.get('/api/consultations/:id/messages', (req, res) => {
  const con = db.consultations.find(c => c.id === req.params.id);
  if (!con) return res.status(404).json({ error: 'Not found' });
  const after = parseInt(req.query.after || '0');
  const msgs = con.messages.filter(m => parseInt(m.id) > after);
  res.json({ messages: msgs, status: con.status });
});

// WebRTC Signaling - Handle SDP offer/answer and ICE candidates
app.post('/api/consultations/:id/signal', (req, res) => {
  const con = db.consultations.find(c => c.id === req.params.id);
  if (!con) return res.status(404).json({ error: 'Consultation not found' });
  
  const { type, data, from } = req.body;
  
  if (!con.signaling) con.signaling = [];
  
  con.signaling.push({
    type,
    data,
    from,
    timestamp: new Date().toISOString()
  });
  
  saveDB();
  res.json({ success: true, signaling: con.signaling });
});

// Get signaling messages (for polling-based approach)
app.get('/api/consultations/:id/signal', (req, res) => {
  const con = db.consultations.find(c => c.id === req.params.id);
  if (!con) return res.status(404).json({ error: 'Consultation not found' });
  
  const since = parseInt(req.query.since || '0');
  const signals = (con.signaling || []).filter((_, i) => i > since);
  
  res.json({ 
    signals,
    count: signals.length,
    status: con.status
  });
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   GRAMCARE SYSTEM TERMINAL v1.0      ║`);
  console.log(`  ║   Server running on port ${PORT}         ║`);
  console.log(`  ║   http://localhost:${PORT}              ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
});
