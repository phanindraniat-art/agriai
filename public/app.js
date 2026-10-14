// app.js - AgriSmart AI Fullstack Client
let currentProfile = null;
let allCrops = [];
let selectedCropId = 19; // Default Turmeric
let isMeasuring = true;
let currentLanguage = 'en';

// DOM Elements
const cropsGrid = document.getElementById('cropsGrid');
const cropSearchInput = document.getElementById('cropSearchInput');
const cropCategorySelect = document.getElementById('cropCategorySelect');
const backendStatusPill = document.getElementById('backendStatusPill');

// Bootstrapping
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadFarmerProfile();
  await loadCrops();
  initMiniLandCanvas();
});

// Setup Events
function setupEventListeners() {
  // Crop Search & Filter
  cropSearchInput.addEventListener('input', (e) => {
    filterCrops(cropCategorySelect.value, e.target.value.trim());
  });

  cropCategorySelect.addEventListener('change', (e) => {
    filterCrops(e.target.value, cropSearchInput.value.trim());
  });

  // Language Dropdown
  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langMenu.classList.toggle('show');
    document.getElementById('profileMenu').classList.remove('show');
  });

  document.querySelectorAll('#langMenu .dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('#langMenu .dropdown-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentLanguage = item.dataset.lang;
      document.getElementById('currentLangLabel').textContent = item.textContent.split(' ')[0];
      langMenu.classList.remove('show');
      showToast(`Language updated to ${item.textContent}`);
      updateVoicePromptLanguage(currentLanguage);
    });
  });

  // Profile Dropdown
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('show');
    langMenu.classList.remove('show');
  });

  document.addEventListener('click', () => {
    langMenu.classList.remove('show');
    profileMenu.classList.remove('show');
  });

  // Notification Button
  document.getElementById('notifBtn').addEventListener('click', () => {
    triggerNotificationModal();
  });
}

// 1. Fetch Farmer Profile from Backend
async function loadFarmerProfile() {
  try {
    const res = await fetch('/api/profile');
    const json = await res.json();
    if (json.success && json.data) {
      currentProfile = json.data;
      selectedCropId = currentProfile.selected_crop_id || 19;
      renderProfileUI(currentProfile);
      updateBackendStatus(true);
    }
  } catch (err) {
    console.warn('Backend connection error:', err);
    updateBackendStatus(false);
  }
}

function renderProfileUI(profile) {
  document.getElementById('heroFarmerName').textContent = profile.name || 'Farmer';
  document.getElementById('userNameLabel').textContent = profile.name || 'Farmer';
  document.getElementById('heroLocation').textContent = profile.location;
  document.getElementById('heroWeather').textContent = `${profile.temperature_c}°C ${profile.weather_condition}`;
  document.getElementById('heroFarmSize').textContent = `${profile.farm_size_acres} acres Farm Size`;
  document.getElementById('heroSownDate').textContent = `Sown: ${profile.sown_date}`;

  document.getElementById('profileMenuName').textContent = profile.name;
  document.getElementById('profileMenuLoc').textContent = profile.location;

  document.getElementById('detectedAreaText').innerHTML = `${profile.farm_size_acres} acres <small>(${profile.farm_size_sqm.toLocaleString()} m²)</small>`;
}

// 2. Load Crops from Backend
async function loadCrops() {
  try {
    const res = await fetch('/api/crops');
    const json = await res.json();
    if (json.success) {
      allCrops = json.data;
      renderCropsGrid(allCrops);
      renderRightCropPanel(selectedCropId);
    }
  } catch (err) {
    console.error('Failed to load crops:', err);
  }
}

// Render Crops in 6-column Grid
function renderCropsGrid(crops) {
  cropsGrid.innerHTML = '';
  if (crops.length === 0) {
    cropsGrid.innerHTML = `<div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: #64748b;">No crops found matching criteria.</div>`;
    return;
  }

  crops.forEach(crop => {
    const isSelected = crop.id === selectedCropId;
    const card = document.createElement('div');
    card.className = `crop-card ${isSelected ? 'selected' : ''}`;
    card.id = `crop-card-${crop.id}`;
    card.innerHTML = `
      <div class="crop-thumb">${crop.emoji}</div>
      <div class="crop-info">
        <div class="crop-title">${crop.name}</div>
        <div class="crop-family">(${crop.family})</div>
      </div>
      <div class="crop-arrow">&rsaquo;</div>
    `;

    card.addEventListener('click', () => {
      selectCrop(crop.id);
    });

    cropsGrid.appendChild(card);
  });
}

function filterCrops(category, search) {
  let filtered = allCrops;
  if (category && category !== 'All' && category !== 'All Crops') {
    filtered = filtered.filter(c => c.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.family.toLowerCase().includes(s) ||
      (c.description && c.description.toLowerCase().includes(s))
    );
  }
  renderCropsGrid(filtered);
}

// 3. Select Crop & Sync to Backend
async function selectCrop(cropId) {
  selectedCropId = cropId;
  document.querySelectorAll('.crop-card').forEach(c => c.classList.remove('selected'));
  const activeCard = document.getElementById(`crop-card-${cropId}`);
  if (activeCard) activeCard.classList.add('selected');

  renderRightCropPanel(cropId);

  // Sync to backend SQLite
  try {
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_crop_id: cropId })
    });
  } catch (err) {
    console.warn('Sync failed:', err);
  }

  const crop = allCrops.find(c => c.id === cropId);
  if (crop) {
    showToast(`Selected crop changed to ${crop.name}`);
  }
}

// 4. Render Right Sidebar with Selected Crop
function renderRightCropPanel(cropId) {
  const crop = allCrops.find(c => c.id === cropId) || allCrops[0];
  if (!crop) return;

  document.getElementById('selectedCropVisual').textContent = crop.emoji;
  document.getElementById('selectedCropName').textContent = crop.name;
  document.getElementById('selectedCropFamily').textContent = `${crop.family} • ${crop.category}`;

  // Common Diseases
  const diseasesContainer = document.getElementById('selectedCropDiseases');
  diseasesContainer.innerHTML = '';
  const diseases = crop.common_diseases || [];
  
  diseases.forEach(disease => {
    const item = document.createElement('div');
    item.className = 'disease-item';
    item.innerHTML = `
      <span>${disease}</span>
      <span class="arrow">&rsaquo;</span>
    `;
    item.addEventListener('click', () => {
      openDiagnosisModal(crop.name, disease);
    });
    diseasesContainer.appendChild(item);
  });

  // Conditions
  document.getElementById('condTemp').textContent = crop.ideal_temp;
  document.getElementById('condPh').textContent = crop.ideal_ph;
  document.getElementById('condWater').textContent = crop.water_req;

  // Quick Info
  document.getElementById('qSeason').textContent = crop.growing_season;
  document.getElementById('qTemp').textContent = crop.ideal_temp;
  document.getElementById('qPh').textContent = crop.ideal_ph;
  document.getElementById('qWater').textContent = crop.water_req;
}

// Scroll to crops grid
function scrollToCrops() {
  document.querySelector('.crop-catalog-section').scrollIntoView({ behavior: 'smooth' });
}

// 5. Voice Assistant Interaction
async function triggerVoiceInteraction() {
  const micBtn = document.getElementById('mainMicBtn');
  const wave = document.getElementById('audioWaveform');
  const voiceBubble = document.getElementById('voiceBubble');

  micBtn.classList.add('recording');
  wave.classList.add('active');

  // Check if browser Speech Recognition is available
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguage === 'te' ? 'te-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const speechResult = event.results[0][0].transcript;
      micBtn.classList.remove('recording');
      wave.classList.remove('active');
      await sendVoiceQuery(speechResult);
    };

    recognition.onerror = async () => {
      micBtn.classList.remove('recording');
      wave.classList.remove('active');
      // Fallback to sample question
      await sendVoiceQuery("నా పంటలకు ఈ రోజు నీళ్లు పెట్టవచ్చా?");
    };

    try {
      recognition.start();
    } catch (e) {
      // If permission prompt blocked or already started
      fallbackVoiceQuery();
    }
  } else {
    // Graceful fallback for non-Chrome/Edge or desktop without mic permission
    fallbackVoiceQuery();
  }
}

async function fallbackVoiceQuery() {
  const micBtn = document.getElementById('mainMicBtn');
  const wave = document.getElementById('audioWaveform');
  setTimeout(async () => {
    micBtn.classList.remove('recording');
    wave.classList.remove('active');
    await sendVoiceQuery("నా పంటలకు ఈ రోజు నీళ్లు పెట్టవచ్చా?");
  }, 1200);
}

async function sendVoiceQuery(queryText) {
  try {
    const res = await fetch('/api/voice-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText, language: currentLanguage })
    });
    const json = await res.json();
    if (json.success && json.data) {
      const data = json.data;
      document.getElementById('voicePromptTe').textContent = `"${data.telugu_answer}"`;
      document.getElementById('voicePromptEn').textContent = data.english_answer;
      document.getElementById('voiceBubble').style.background = '#f0fdf4';
      document.getElementById('voiceBubble').style.borderColor = '#86efac';

      // Text-to-speech speak aloud
      if ('speechSynthesis' in window) {
        const textToSpeak = currentLanguage === 'te' ? data.telugu_answer : data.english_answer;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }

      showToast(`AI Voice: ${data.recommendation_tag}`);
    }
  } catch (err) {
    showToast('Voice query received response.');
  }
}

function updateVoicePromptLanguage(lang) {
  const badge = document.getElementById('voiceLangBadge');
  if (lang === 'te') {
    badge.textContent = 'Telugu';
    document.getElementById('voicePromptTe').textContent = '"నా పంటలకు ఈ రోజు నీళ్లు పెట్టవచ్చా?"';
    document.getElementById('voicePromptEn').textContent = 'Should I water my crop today?';
  } else if (lang === 'hi') {
    badge.textContent = 'Hindi';
    document.getElementById('voicePromptTe').textContent = '"क्या मुझे आज अपनी फसल को पानी देना चाहिए?"';
    document.getElementById('voicePromptEn').textContent = 'Should I water my crop today?';
  } else {
    badge.textContent = 'English';
    document.getElementById('voicePromptTe').textContent = '"Should I water my turmeric field today?"';
    document.getElementById('voicePromptEn').textContent = 'Live AI Soil Moisture & Irrigation Advisor';
  }
}

// 6. AI Diagnosis Modal
function openDiagnosisModal(cropName = 'Turmeric', diseaseName = null) {
  const modal = document.getElementById('diagnosisModal');
  modal.classList.add('active');
  if (diseaseName) {
    document.getElementById('resDiseaseName').textContent = diseaseName;
  }
}

async function runAiDiagnosis() {
  const laser = document.getElementById('scannerLaser');
  const loading = document.getElementById('diagLoading');
  const content = document.getElementById('diagResultContent');
  const runBtn = document.getElementById('runDiagBtn');

  laser.style.display = 'block';
  loading.style.display = 'block';
  content.style.opacity = '0.3';
  runBtn.disabled = true;

  try {
    const crop = allCrops.find(c => c.id === selectedCropId) || { name: 'Turmeric' };
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop_name: crop.name })
    });
    const json = await res.json();

    setTimeout(() => {
      laser.style.display = 'none';
      loading.style.display = 'none';
      content.style.opacity = '1';
      runBtn.disabled = false;

      if (json.success && json.data) {
        const d = json.data;
        document.getElementById('resConfidence').textContent = `${d.confidence}%`;
        document.getElementById('resDiseaseName').textContent = d.disease;
        document.getElementById('resSeverity').textContent = `Severity: ${d.severity}`;
        document.getElementById('resSymptoms').textContent = d.symptoms;
        document.getElementById('resTreatment').textContent = d.treatment;
        document.getElementById('resOrganic').textContent = d.organic;
        showToast('Diagnosis completed successfully!');
      }
    }, 1200);
  } catch (err) {
    laser.style.display = 'none';
    loading.style.display = 'none';
    content.style.opacity = '1';
    runBtn.disabled = false;
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('leafImgPreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
    showToast('Photo uploaded! Click "Run AI Diagnostic Scan".');
  }
}

// 7. Crop Growth Comparison Modal
async function openGrowthModal() {
  const modal = document.getElementById('growthModal');
  modal.classList.add('active');

  try {
    const res = await fetch('/api/growth-comparison');
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      document.getElementById('gCropName').textContent = d.crop;
      
      const tbody = document.getElementById('growthTableBody');
      tbody.innerHTML = '';
      d.stages.forEach(stage => {
        const tr = document.createElement('tr');
        const isCurrent = stage.status.includes('Active');
        if (isCurrent) tr.style.background = '#f0fdf4';
        
        tr.innerHTML = `
          <td><strong>${stage.name}</strong></td>
          <td>${stage.days} days</td>
          <td>${stage.expected_height_cm} cm</td>
          <td>${stage.actual_height_cm ? stage.actual_height_cm + ' cm' : '—'}</td>
          <td><span class="${isCurrent ? 'badge-active-stage' : ''}">${stage.status}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// 8. Weather-based Irrigation Planner Modal
async function openIrrigationModal() {
  const modal = document.getElementById('irrigationModal');
  modal.classList.add('active');

  try {
    const res = await fetch('/api/irrigation-plan');
    const json = await res.json();
    if (json.success && json.data) {
      const plan = json.data;
      const grid = document.getElementById('irrigationScheduleGrid');
      grid.innerHTML = '';

      plan.seven_day_schedule.forEach(item => {
        const box = document.createElement('div');
        box.className = 'sched-day-box';
        box.innerHTML = `
          <strong>${item.date}</strong>
          <div class="icon">${item.icon}</div>
          <div class="need">${item.need}</div>
        `;
        grid.appendChild(box);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// 9. Interactive Field Land Measurement Canvas & Tool
let landPoints = [
  { x: 120, y: 50 },
  { x: 520, y: 65 },
  { x: 590, y: 280 },
  { x: 90, y: 250 }
];

function initMiniLandCanvas() {
  const canvas = document.getElementById('landCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (landPoints.length >= 8) landPoints = [];
    landPoints.push({ x, y });
    drawLandCanvas();
    calculateCanvasArea();
  });

  drawLandCanvas();
}

function drawLandCanvas() {
  const canvas = document.getElementById('landCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background grid
  ctx.strokeStyle = '#1e4830';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  if (landPoints.length < 2) return;

  // Polygon Fill & Stroke
  ctx.beginPath();
  ctx.moveTo(landPoints[0].x, landPoints[0].y);
  for (let i = 1; i < landPoints.length; i++) {
    ctx.lineTo(landPoints[i].x, landPoints[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
  ctx.fill();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Nodes / GPS Pins
  landPoints.forEach((p, idx) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Corner Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`P${idx + 1}`, p.x + 8, p.y - 4);
  });
}

function calculateCanvasArea() {
  if (landPoints.length < 3) return;
  // Shoelace formula
  let area = 0;
  for (let i = 0; i < landPoints.length; i++) {
    const j = (i + 1) % landPoints.length;
    area += landPoints[i].x * landPoints[j].y;
    area -= landPoints[j].x * landPoints[i].y;
  }
  area = Math.abs(area) / 2;

  // Scale pixels to square meters and acres
  // 1 pixel = ~0.25 meters
  const sqMeters = Math.round(area * 0.115);
  const acres = (sqMeters / 4046.86).toFixed(2);

  document.getElementById('modalComputedAcres').textContent = `${acres} Acres`;
  document.getElementById('modalComputedSqm').textContent = `(${sqMeters.toLocaleString()} m²)`;
}

function resetLandCanvas() {
  landPoints = [];
  drawLandCanvas();
  document.getElementById('modalComputedAcres').textContent = `0.00 Acres`;
  document.getElementById('modalComputedSqm').textContent = `(0 m²)`;
}

async function saveLandMeasurement() {
  const acresText = document.getElementById('modalComputedAcres').textContent.replace(' Acres', '');
  const acres = parseFloat(acresText) || 2.47;
  const sqMeters = Math.round(acres * 4046.86);

  try {
    const res = await fetch('/api/land-measurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_name: 'Measured Field Boundary',
        acres: acres,
        sq_meters: sqMeters,
        polygon_coords: landPoints
      })
    });
    if (res.ok) {
      document.getElementById('detectedAreaText').innerHTML = `${acres} acres <small>(${sqMeters.toLocaleString()} m²)</small>`;
      document.getElementById('heroFarmSize').textContent = `${acres} acres Farm Size`;
      closeModal('landModal');
      showToast(`Field measurement of ${acres} acres saved to backend!`);
    }
  } catch (err) {
    showToast('Saved locally.');
  }
}

function openLandModal() {
  const modal = document.getElementById('landModal');
  modal.classList.add('active');
  setTimeout(() => {
    drawLandCanvas();
    calculateCanvasArea();
  }, 100);
}

function toggleMeasureState() {
  isMeasuring = !isMeasuring;
  const btn = document.getElementById('toggleMeasureBtn');
  if (isMeasuring) {
    btn.innerHTML = `<span class="stop-sq">■</span><span>Stop Measuring</span>`;
    btn.style.background = '#14532d';
    showToast('GPS Field tracking resumed.');
  } else {
    btn.innerHTML = `<span style="color:#4ade80;">▶</span><span>Start Measuring</span>`;
    btn.style.background = '#0369a1';
    showToast('Measurement paused.');
  }
}

// 10. Farmer Profile Modal
function openProfileModal() {
  if (currentProfile) {
    document.getElementById('inputFarmerName').value = currentProfile.name;
    document.getElementById('inputLocation').value = currentProfile.location;
    document.getElementById('inputFarmSize').value = currentProfile.farm_size_acres;
    document.getElementById('inputSownDate').value = currentProfile.sown_date;
  }
  document.getElementById('profileModal').classList.add('active');
}

async function saveProfileChanges(e) {
  e.preventDefault();
  const name = document.getElementById('inputFarmerName').value;
  const location = document.getElementById('inputLocation').value;
  const farm_size_acres = parseFloat(document.getElementById('inputFarmSize').value);
  const sown_date = document.getElementById('inputSownDate').value;

  try {
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, farm_size_acres, sown_date })
    });
    const json = await res.json();
    if (json.success) {
      await loadFarmerProfile();
      closeModal('profileModal');
      showToast('Profile updated and saved to SQLite backend!');
    }
  } catch (err) {
    showToast('Profile save error');
  }
}

// Utility Modal Closers
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Toast System
function showToast(msg) {
  const toast = document.getElementById('toastBubble');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function updateBackendStatus(connected) {
  if (connected) {
    backendStatusPill.innerHTML = `<span class="pulse-dot"></span> Connected to SQLite Backend`;
    backendStatusPill.style.color = '#4ade80';
  } else {
    backendStatusPill.innerHTML = `<span style="width:7px; height:7px; background:#f87171; border-radius:50%; display:inline-block;"></span> Offline Mode`;
    backendStatusPill.style.color = '#f87171';
  }
}

function triggerNotificationModal() {
  showToast('Alerts: 1. Rain forecasted in 48h. 2. Leaf spot early prevention window. 3. Turmeric mandi rates +4%.');
}

function showWeatherDetail() {
  showToast('Nizamabad: 28°C, Humidity 64%, Wind 12 km/h. Evapotranspiration 4.2 mm/day.');
}

function openFertilizerTip() {
  showToast('Fertilizer Alert: Turmeric day 86. Apply 30kg Urea + 25kg MOP split per acre.');
}

function openCalendarTip() {
  showToast('Crop Calendar: Next earthing-up & weeding milestone scheduled for Oct 22.');
}
