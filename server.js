// server.js - AgriSmart AI Fullstack Server with native SQLite database
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'agrismart.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Initialize SQLite Database
const db = new DatabaseSync(DB_PATH);

// Setup database tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmer_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      farm_size_acres REAL NOT NULL,
      farm_size_sqm REAL NOT NULL,
      sown_date TEXT NOT NULL,
      selected_crop_id INTEGER DEFAULT 19,
      temperature_c REAL DEFAULT 28,
      weather_condition TEXT DEFAULT 'Partly Cloudy'
    );

    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      family TEXT NOT NULL,
      category TEXT NOT NULL,
      emoji TEXT NOT NULL,
      description TEXT,
      common_diseases TEXT, -- JSON array
      ideal_temp TEXT NOT NULL,
      ideal_ph TEXT NOT NULL,
      water_req TEXT NOT NULL,
      growing_season TEXT NOT NULL,
      expected_yield TEXT
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      disease_name TEXT NOT NULL,
      confidence REAL NOT NULL,
      severity TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      treatment TEXT NOT NULL,
      organic_remedy TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS land_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      field_name TEXT NOT NULL,
      acres REAL NOT NULL,
      sq_meters REAL NOT NULL,
      polygon_coords TEXT -- JSON array of [x, y] or [lat, lng]
    );

    CREATE TABLE IF NOT EXISTS voice_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      query TEXT NOT NULL,
      language TEXT NOT NULL,
      response TEXT NOT NULL
    );
  `);

  // Check if profile exists, otherwise seed
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM farmer_profile').get();
  if (profileCount.count === 0) {
    db.prepare(`
      INSERT INTO farmer_profile (name, location, farm_size_acres, farm_size_sqm, sown_date, selected_crop_id, temperature_c, weather_condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Farmer', 'Nizamabad, Telangana', 2.5, 10117, '20 Mar 2025', 19, 28, 'Partly Cloudy');
  }

  // Check if crops exist, otherwise seed all 30 crops from the image
  const cropCount = db.prepare('SELECT COUNT(*) as count FROM crops').get();
  if (cropCount.count === 0) {
    const cropsSeedData = [
      {
        id: 1, name: 'Tomato', family: 'Solanaceae', category: 'Vegetables', emoji: '🍅',
        desc: 'One of the most widely grown vegetables in Andhra & Telangana.',
        diseases: JSON.stringify(['Early Blight', 'Late Blight', 'Bacterial Wilt', 'Tomato Leaf Curl']),
        ideal_temp: '20°C - 30°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '25-30 tons/acre'
      },
      {
        id: 2, name: 'Rice', family: 'Gramineae', category: 'Cereals', emoji: '🌾',
        desc: 'Primary staple food grain crop in South India.',
        diseases: JSON.stringify(['Rice Blast', 'Bacterial Leaf Blight', 'Sheath Blight', 'Brown Spot']),
        ideal_temp: '22°C - 32°C', ideal_ph: '5.5 - 6.5', water_req: 'High (Flooded)', growing_season: 'Kharif / Rabi', yield: '2.5-3.5 tons/acre'
      },
      {
        id: 3, name: 'Chilli', family: 'Solanaceae', category: 'Spices', emoji: '🌶️',
        desc: 'Famous Guntur chillies, vital commercial spice and cash crop.',
        diseases: JSON.stringify(['Anthracnose (Fruit Rot)', 'Powdery Mildew', 'Leaf Curl Virus', 'Dieback']),
        ideal_temp: '20°C - 32°C', ideal_ph: '6.5 - 7.5', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '1.5-2.5 tons dry/acre'
      },
      {
        id: 4, name: 'Cotton', family: 'Malvaceae', category: 'Cash Crops', emoji: '☁️',
        desc: 'Major cash fiber crop grown extensively in black cotton soils.',
        diseases: JSON.stringify(['Boll Rot', 'Fusarium Wilt', 'Grey Mildew', 'Bacterial Blight']),
        ideal_temp: '21°C - 35°C', ideal_ph: '6.0 - 8.0', water_req: 'Moderate', growing_season: 'Kharif', yield: '10-15 quintals/acre'
      },
      {
        id: 5, name: 'Maize', family: 'Poaceae', category: 'Cereals', emoji: '🌽',
        desc: 'Queen of cereals, important for food, poultry feed and fodder.',
        diseases: JSON.stringify(['Fall Armyworm', 'Turcicum Leaf Blight', 'Common Rust', 'Stalk Rot']),
        ideal_temp: '18°C - 30°C', ideal_ph: '5.8 - 7.2', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '25-35 quintals/acre'
      },
      {
        id: 6, name: 'Potato', family: 'Solanaceae', category: 'Vegetables', emoji: '🥔',
        desc: 'Cool-season tuber crop highly consumed across the country.',
        diseases: JSON.stringify(['Late Blight', 'Early Blight', 'Common Scab', 'Black Scurf']),
        ideal_temp: '15°C - 24°C', ideal_ph: '5.2 - 6.4', water_req: 'Moderate', growing_season: 'Rabi (Winter)', yield: '8-12 tons/acre'
      },
      {
        id: 7, name: 'Brinjal (Eggplant)', family: 'Solanaceae', category: 'Vegetables', emoji: '🍆',
        desc: 'Popular vegetable with high local market demand.',
        diseases: JSON.stringify(['Phomopsis Blight', 'Bacterial Wilt', 'Little Leaf', 'Fruit and Shoot Borer']),
        ideal_temp: '22°C - 32°C', ideal_ph: '5.5 - 6.8', water_req: 'Moderate', growing_season: 'All Year', yield: '12-16 tons/acre'
      },
      {
        id: 8, name: 'Okra (Ladyfinger)', family: 'Malvaceae', category: 'Vegetables', emoji: '🥬',
        desc: 'Warm season crop with high culinary and nutritional value.',
        diseases: JSON.stringify(['Yellow Vein Mosaic Virus', 'Powdery Mildew', 'Cercospora Leaf Spot', 'Root Knot Nematode']),
        ideal_temp: '24°C - 35°C', ideal_ph: '6.0 - 6.8', water_req: 'Moderate', growing_season: 'Summer / Kharif', yield: '4-6 tons/acre'
      },
      {
        id: 9, name: 'Cabbage', family: 'Brassicaceae', category: 'Vegetables', emoji: '🥬',
        desc: 'Cole crop requiring cool moist climate and well drained soil.',
        diseases: JSON.stringify(['Black Rot', 'Clubroot', 'Downy Mildew', 'Alternaria Leaf Spot']),
        ideal_temp: '15°C - 22°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate to High', growing_season: 'Rabi / Winter', yield: '15-20 tons/acre'
      },
      {
        id: 10, name: 'Cauliflower', family: 'Brassicaceae', category: 'Vegetables', emoji: '🥦',
        desc: 'Prized cool season vegetable demanding careful curd management.',
        diseases: JSON.stringify(['Black Rot', 'Downy Mildew', 'Whiptail (Mo deficiency)', 'Stemphylium Leaf Spot']),
        ideal_temp: '15°C - 20°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate to High', growing_season: 'Rabi / Winter', yield: '12-18 tons/acre'
      },
      {
        id: 11, name: 'Carrot', family: 'Apiaceae', category: 'Vegetables', emoji: '🥕',
        desc: 'Root crop rich in beta-carotene; favors loose sandy-loam.',
        diseases: JSON.stringify(['Alternaria Leaf Blight', 'Powdery Mildew', 'Cavity Spot', 'Cottony Soft Rot']),
        ideal_temp: '16°C - 22°C', ideal_ph: '6.0 - 6.8', water_req: 'Moderate', growing_season: 'Rabi (Winter)', yield: '8-12 tons/acre'
      },
      {
        id: 12, name: 'Onion', family: 'Amaryllidaceae', category: 'Vegetables', emoji: '🧅',
        desc: 'Crucial cash and daily diet vegetable with dynamic market pricing.',
        diseases: JSON.stringify(['Purple Blotch', 'Stemphylium Leaf Blight', 'Basal Rot', 'Downy Mildew']),
        ideal_temp: '18°C - 28°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate', growing_season: 'Kharif / Late Kharif / Rabi', yield: '10-15 tons/acre'
      },
      {
        id: 13, name: 'Groundnut', family: 'Fabaceae', category: 'Oilseeds', emoji: '🥜',
        desc: 'Significant oilseed and protein source grown in dryland regions.',
        diseases: JSON.stringify(['Tikka Leaf Spot', 'Rust', 'Collar Rot', 'Stem Rot']),
        ideal_temp: '22°C - 30°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '8-12 quintals/acre'
      },
      {
        id: 14, name: 'Sugarcane', family: 'Poaceae', category: 'Cash Crops', emoji: '🎋',
        desc: 'Long duration industrial sugar & jaggery feedstock.',
        diseases: JSON.stringify(['Red Rot', 'Smut', 'Wilt', 'Grassy Shoot']),
        ideal_temp: '20°C - 35°C', ideal_ph: '6.5 - 7.5', water_req: 'Very High', growing_season: 'Perennial (10-12 months)', yield: '35-45 tons/acre'
      },
      {
        id: 15, name: 'Banana', family: 'Musaceae', category: 'Fruits', emoji: '🍌',
        desc: 'Major commercial fruit crop demanding high potassium and moisture.',
        diseases: JSON.stringify(['Panama Wilt (Fusarium)', 'Sigatoka Leaf Spot', 'Bunchy Top Virus', 'Erwinia Rhizome Rot']),
        ideal_temp: '24°C - 32°C', ideal_ph: '6.0 - 7.5', water_req: 'High', growing_season: 'Year-round planting', yield: '25-35 tons/acre'
      },
      {
        id: 16, name: 'Grapes', family: 'Vitaceae', category: 'Fruits', emoji: '🍇',
        desc: 'High-value fruit vine prominent around Hyderabad and Deccan plateau.',
        diseases: JSON.stringify(['Downy Mildew', 'Powdery Mildew', 'Anthracnose', 'Bacterial Leaf Spot']),
        ideal_temp: '18°C - 32°C', ideal_ph: '6.5 - 8.0', water_req: 'Moderate (Drip)', growing_season: 'Perennial vine', yield: '10-14 tons/acre'
      },
      {
        id: 17, name: 'Mango', family: 'Anacardiaceae', category: 'Fruits', emoji: '🥭',
        desc: 'King of Fruits, Banganapalli and Totapuri varieties are renowned.',
        diseases: JSON.stringify(['Powdery Mildew', 'Anthracnose', 'Mango Malformation', 'Dieback']),
        ideal_temp: '24°C - 33°C', ideal_ph: '5.5 - 7.5', water_req: 'Moderate', growing_season: 'Summer harvest', yield: '4-8 tons/acre'
      },
      {
        id: 18, name: 'Tamarind', family: 'Papilionaceae', category: 'Spices', emoji: '🌰',
        desc: 'Drought-hardy perennial tree producing sour pulp for culinary use.',
        diseases: JSON.stringify(['Sooty Mold', 'Powdery Mildew', 'Stem Canker', 'Leaf Gall']),
        ideal_temp: '25°C - 38°C', ideal_ph: '5.5 - 8.0', water_req: 'Low', growing_season: 'Dry season harvest', yield: '2-4 tons/acre'
      },
      {
        id: 19, name: 'Turmeric', family: 'Zingiberaceae', category: 'Spices', emoji: '🍠',
        desc: 'Golden spice with high curcumin, Nizamabad is world-renowned for it.',
        diseases: JSON.stringify(['Leaf spot (early blight)', 'Rhizome rot (fungal)', 'Bacterial wilt (bacterial)', 'Leaf curl virus (viral)']),
        ideal_temp: '20°C - 30°C', ideal_ph: '5.5 - 7.5', water_req: 'Moderate', growing_season: 'Rainy / Summer', yield: '8-10 tons fresh/acre'
      },
      {
        id: 20, name: 'Ginger', family: 'Zingiberaceae', category: 'Spices', emoji: '🫚',
        desc: 'Shade-loving rhizome spice valued for medicine and flavoring.',
        diseases: JSON.stringify(['Soft Rot / Rhizome Rot', 'Bacterial Wilt', 'Leaf Spot', 'Yellows (Fusarium)']),
        ideal_temp: '22°C - 30°C', ideal_ph: '5.5 - 6.5', water_req: 'Moderate to High', growing_season: 'Kharif', yield: '6-9 tons/acre'
      },
      {
        id: 21, name: 'Black Gram', family: 'Fabaceae', category: 'Pulses', emoji: '⚫',
        desc: 'Rich source of protein (Urad dal), improves soil nitrogen.',
        diseases: JSON.stringify(['Yellow Mosaic Virus', 'Powdery Mildew', 'Cercospora Leaf Spot', 'Root Rot']),
        ideal_temp: '25°C - 35°C', ideal_ph: '6.0 - 7.5', water_req: 'Low to Moderate', growing_season: 'Kharif / Rabi', yield: '4-6 quintals/acre'
      },
      {
        id: 22, name: 'Green Gram', family: 'Fabaceae', category: 'Pulses', emoji: '🟢',
        desc: 'Moong dal, short duration leguminous pulse crop.',
        diseases: JSON.stringify(['Mungbean Yellow Mosaic', 'Anthracnose', 'Powdery Mildew', 'Macrophomina Root Rot']),
        ideal_temp: '25°C - 32°C', ideal_ph: '6.2 - 7.2', water_req: 'Low to Moderate', growing_season: 'Summer / Kharif', yield: '4-5 quintals/acre'
      },
      {
        id: 23, name: 'Red Gram', family: 'Fabaceae', category: 'Pulses', emoji: '🔴',
        desc: 'Pigeon pea (Toor dal), key rainfed dryland pulse in Telangana.',
        diseases: JSON.stringify(['Fusarium Wilt', 'Sterility Mosaic Disease', 'Phytophthora Blight', 'Pod Borer']),
        ideal_temp: '22°C - 35°C', ideal_ph: '6.5 - 7.8', water_req: 'Moderate (Drought tolerant)', growing_season: 'Kharif (Long duration)', yield: '6-8 quintals/acre'
      },
      {
        id: 24, name: 'Chickpea', family: 'Fabaceae', category: 'Pulses', emoji: '🟤',
        desc: 'Bengal gram (Chana), major winter rabi legume crop.',
        diseases: JSON.stringify(['Fusarium Wilt', 'Ascochyta Blight', 'Dry Root Rot', 'Collar Rot']),
        ideal_temp: '18°C - 26°C', ideal_ph: '6.0 - 7.5', water_req: 'Low', growing_season: 'Rabi (Winter)', yield: '6-9 quintals/acre'
      },
      {
        id: 25, name: 'Coriander', family: 'Apiaceae', category: 'Spices', emoji: '🌿',
        desc: 'Aromatic herb and spice seed crop grown for both leaves and grain.',
        diseases: JSON.stringify(['Powdery Mildew', 'Stem Gall', 'Wilt', 'Alternaria Blight']),
        ideal_temp: '15°C - 25°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate', growing_season: 'Rabi', yield: '4-6 quintals seeds/acre'
      },
      {
        id: 26, name: 'Cumin', family: 'Apiaceae', category: 'Spices', emoji: '🌾',
        desc: 'Valuable spice demanding dry sunny weather during seed setting.',
        diseases: JSON.stringify(['Fusarium Wilt', 'Blight (Alternaria)', 'Powdery Mildew']),
        ideal_temp: '16°C - 25°C', ideal_ph: '6.8 - 8.0', water_req: 'Low', growing_season: 'Rabi', yield: '3-4 quintals/acre'
      },
      {
        id: 27, name: 'Fenugreek', family: 'Fabaceae', category: 'Spices', emoji: '🌱',
        desc: 'Methi, multi-purpose herb used as greens, seeds and green manure.',
        diseases: JSON.stringify(['Cercospora Leaf Spot', 'Powdery Mildew', 'Downy Mildew', 'Root Rot']),
        ideal_temp: '15°C - 24°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate', growing_season: 'Rabi', yield: '5-7 quintals seeds/acre'
      },
      {
        id: 28, name: 'Sesame', family: 'Pedaliaceae', category: 'Oilseeds', emoji: '🌰',
        desc: 'Til/Gingelly, ancient high-grade edible oil crop.',
        diseases: JSON.stringify(['Phyllody (Mycoplasma)', 'Bacterial Leaf Spot', 'Alternaria Blight', 'Root Rot']),
        ideal_temp: '25°C - 35°C', ideal_ph: '5.5 - 7.5', water_req: 'Low', growing_season: 'Summer / Kharif', yield: '2.5-3.5 quintals/acre'
      },
      {
        id: 29, name: 'Mustard', family: 'Brassicaceae', category: 'Oilseeds', emoji: '🌼',
        desc: 'Crucial rabi oilseed offering high pungent oil content.',
        diseases: JSON.stringify(['White Rust', 'Alternaria Blight', 'Downy Mildew', 'Sclerotinia Rot']),
        ideal_temp: '12°C - 25°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate', growing_season: 'Rabi', yield: '6-8 quintals/acre'
      },
      {
        id: 30, name: 'Pepper', family: 'Piperaceae', category: 'Spices', emoji: '🌿',
        desc: 'Black pepper, the king of spices, grown as an intercrop.',
        diseases: JSON.stringify(['Quick Wilt (Phytophthora)', 'Slow Wilt', 'Pollu Disease (Anthracnose)', 'Stunt Virus']),
        ideal_temp: '20°C - 32°C', ideal_ph: '5.5 - 6.5', water_req: 'High (Humid)', growing_season: 'Perennial', yield: '1.2-1.8 tons/acre'
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO crops (id, name, family, category, emoji, description, common_diseases, ideal_temp, ideal_ph, water_req, growing_season, expected_yield)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const crop of cropsSeedData) {
      insertStmt.run(
        crop.id, crop.name, crop.family, crop.category, crop.emoji,
        crop.desc, crop.diseases, crop.ideal_temp, crop.ideal_ph, crop.water_req, crop.growing_season, crop.yield
      );
    }
  }

  // Seed default land measurement if empty
  const measCount = db.prepare('SELECT COUNT(*) as count FROM land_measurements').get();
  if (measCount.count === 0) {
    db.prepare(`
      INSERT INTO land_measurements (timestamp, field_name, acres, sq_meters, polygon_coords)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      'Nizamabad North Field #1',
      2.47,
      9998,
      JSON.stringify([[18.6725, 78.0941], [18.6738, 78.0955], [18.6732, 78.0970], [18.6718, 78.0962]])
    );
  }
}

// Call db init
initDb();

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper to serve static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.join(PUBLIC_DIR, relativePath);

  // Security check to avoid path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Agricultural Knowledge Base for Voice & Diagnosis
function getAiCropAdvice(query, lang = 'english') {
  const q = query.toLowerCase();
  
  if (q.includes('నీళ్లు') || q.includes('water') || q.includes('irrigation')) {
    return {
      query: query,
      language: lang,
      telugu_answer: "ఈ రోజు వాతావరణం పాక్షికంగా మేఘావృతమై 28°C గా ఉంది. నేలలో తేమ 68% ఉన్నందున ఈ రోజు మీ పసుపు పంటకు అధిక నీరు అవసరం లేదు. రేపు ఉదయం 6:00 గంటలకు 45 నిమిషాల పాటు డ్రిప్ ఇరిగేషన్ ఇవ్వడం ఉత్తమం.",
      english_answer: "Today's weather is 28°C and partly cloudy with 68% soil moisture. No heavy watering is required today. Recommended: Give 45 mins drip irrigation tomorrow morning at 6:00 AM.",
      action: "Irrigation scheduled for tomorrow morning",
      recommendation_tag: "Optimal Soil Moisture"
    };
  }

  if (q.includes('leaf spot') || q.includes('తెగులు') || q.includes('disease') || q.includes('మచ్చ')) {
    return {
      query: query,
      language: lang,
      telugu_answer: "పసుపులో ఆకుమచ్చ తెగులు లక్షణాలు కనిపిస్తే, వెంటనే లీటరు నీటికి 2.5 గ్రాముల మాంకోజెబ్ (Mancozeb 75% WP) లేదా కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు కలిపి పిచికారీ చేయండి. సేంద్రియ నివారణకు వేప నూనె 5 మి.లీ పిచికారీ చేయవచ్చు.",
      english_answer: "For leaf spot in turmeric: Spray Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride @ 3g/L. For organic control, spray 5ml Neem oil (10,000 ppm) per liter of water.",
      action: "Fungicide Spray: Mancozeb 2.5g/L",
      recommendation_tag: "Disease Treatment Alert"
    };
  }

  if (q.includes('fertilizer') || q.includes('ఎరువు') || q.includes('పోషకాలు')) {
    return {
      query: query,
      language: lang,
      telugu_answer: "పసుపు విత్తిన 60-90 రోజుల మధ్య మూడో వాయిదా ఎరువులు ఇవ్వాలి. ఎకరానికి 30 కిలోల యూరియా, 25 కిలోల పొటాష్ వేసి మట్టిని ఎగదోయాలి.",
      english_answer: "For Turmeric at this stage (Day 80-90 after sowing): Apply the third split dose of 30 kg Urea and 25 kg MOP (Muriate of Potash) per acre followed by light earthing-up.",
      action: "NPK Top Dressing Recommended",
      recommendation_tag: "Nutrient Management"
    };
  }

  return {
    query: query,
    language: lang,
    telugu_answer: "నమస్కారం రైతు సోదరులారా! మీ పంట సంరక్షణ కోసం AgriSmart AI ఎల్లప్పుడూ సిద్ధంగా ఉంది. మీ పంటకు నీటి నిర్వహణ, ఎరువులు, తెగుళ్ళ నివారణ లేదా నేల పరీక్ష గురించి అడగండి.",
    english_answer: "Greetings Farmer! AgriSmart AI is here to help with your crop care, irrigation schedules, fertilizer calculation, and AI disease diagnosis.",
    action: "Consultation Complete",
    recommendation_tag: "General Advice"
  };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    try {
      // 1. Profile Endpoints
      if (pathname === '/api/profile' && method === 'GET') {
        const profile = db.prepare(`
          SELECT p.*, c.name as crop_name, c.family as crop_family, c.category as crop_category,
                 c.ideal_temp, c.ideal_ph, c.water_req, c.growing_season
          FROM farmer_profile p
          LEFT JOIN crops c ON p.selected_crop_id = c.id
          WHERE p.id = 1
        `).get();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: profile }));
        return;
      }

      if (pathname === '/api/profile/update' && method === 'POST') {
        const body = await parseJsonBody(req);
        const { selected_crop_id, location, farm_size_acres, sown_date } = body;
        
        let updates = [];
        let params = [];
        if (selected_crop_id) { updates.push('selected_crop_id = ?'); params.push(selected_crop_id); }
        if (location) { updates.push('location = ?'); params.push(location); }
        if (farm_size_acres) { 
          updates.push('farm_size_acres = ?'); 
          params.push(farm_size_acres);
          updates.push('farm_size_sqm = ?');
          params.push(Math.round(farm_size_acres * 4046.86));
        }
        if (sown_date) { updates.push('sown_date = ?'); params.push(sown_date); }

        if (updates.length > 0) {
          params.push(1);
          db.prepare(`UPDATE farmer_profile SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        const updated = db.prepare('SELECT * FROM farmer_profile WHERE id = 1').get();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: updated }));
        return;
      }

      // 2. Crops List & Detail
      if (pathname === '/api/crops' && method === 'GET') {
        const category = parsedUrl.searchParams.get('category');
        const search = parsedUrl.searchParams.get('search');
        
        let query = 'SELECT * FROM crops WHERE 1=1';
        let params = [];

        if (category && category !== 'All' && category !== 'All Crops') {
          query += ' AND category LIKE ?';
          params.push(`%${category}%`);
        }
        if (search) {
          query += ' AND (name LIKE ? OR family LIKE ? OR description LIKE ?)';
          const term = `%${search}%`;
          params.push(term, term, term);
        }

        query += ' ORDER BY id ASC';
        const crops = db.prepare(query).all(...params).map(c => ({
          ...c,
          common_diseases: JSON.parse(c.common_diseases || '[]')
        }));

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, count: crops.length, data: crops }));
        return;
      }

      if (pathname.startsWith('/api/crops/') && method === 'GET') {
        const cropId = parseInt(pathname.split('/')[3], 10);
        const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId);
        if (!crop) {
          res.writeHead(404);
          res.end(JSON.stringify({ success: false, error: 'Crop not found' }));
          return;
        }
        crop.common_diseases = JSON.parse(crop.common_diseases || '[]');
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: crop }));
        return;
      }

      // 3. Weather Endpoint
      if (pathname === '/api/weather' && method === 'GET') {
        const loc = parsedUrl.searchParams.get('location') || 'Nizamabad, Telangana';
        // Detailed agricultural weather data
        const weatherData = {
          location: loc,
          temperature: 28,
          feels_like: 30,
          condition: 'Partly Cloudy',
          humidity: 64,
          wind_speed_kmh: 12,
          rain_probability_pct: 15,
          soil_moisture_pct: 68,
          evapotranspiration_mm: 4.2,
          uv_index: 6,
          sun_hours: 8.5,
          updated_at: new Date().toLocaleTimeString(),
          forecast_3day: [
            { day: 'Today', temp: '28°C / 21°C', condition: 'Partly Cloudy', rain: '15%' },
            { day: 'Tomorrow', temp: '29°C / 20°C', condition: 'Sunny / Mild Clouds', rain: '10%' },
            { day: 'Friday', temp: '27°C / 22°C', condition: 'Scattered Showers', rain: '45%' }
          ]
        };
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: weatherData }));
        return;
      }

      // 4. Voice Assistant
      if (pathname === '/api/voice-assistant' && method === 'POST') {
        const body = await parseJsonBody(req);
        const userQuery = body.query || 'Should I water my crop today?';
        const language = body.language || 'telugu';

        const advice = getAiCropAdvice(userQuery, language);

        // Store in voice logs
        db.prepare(`
          INSERT INTO voice_logs (timestamp, query, language, response)
          VALUES (?, ?, ?, ?)
        `).run(
          new Date().toISOString(),
          userQuery,
          language,
          advice.telugu_answer + ' | ' + advice.english_answer
        );

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: advice }));
        return;
      }

      // 5. Land Measurement Endpoints
      if (pathname === '/api/land-measurement' && method === 'GET') {
        const latest = db.prepare('SELECT * FROM land_measurements ORDER BY id DESC LIMIT 1').get();
        if (latest && latest.polygon_coords) {
          latest.polygon_coords = JSON.parse(latest.polygon_coords);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: latest }));
        return;
      }

      if (pathname === '/api/land-measurement' && method === 'POST') {
        const body = await parseJsonBody(req);
        const { field_name, acres, sq_meters, polygon_coords } = body;
        
        const computedAcres = acres || (sq_meters ? Number((sq_meters / 4046.86).toFixed(2)) : 2.47);
        const computedSqm = sq_meters || Math.round(computedAcres * 4046.86);

        const result = db.prepare(`
          INSERT INTO land_measurements (timestamp, field_name, acres, sq_meters, polygon_coords)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          new Date().toISOString(),
          field_name || 'My Agricultural Field',
          computedAcres,
          computedSqm,
          JSON.stringify(polygon_coords || [])
        );

        // Also update farmer profile farm_size
        db.prepare('UPDATE farmer_profile SET farm_size_acres = ?, farm_size_sqm = ? WHERE id = 1')
          .run(computedAcres, computedSqm);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          id: result.lastInsertRowid,
          acres: computedAcres,
          sq_meters: computedSqm
        }));
        return;
      }

      // 6. AI Crop Scan & Diagnose Endpoint
      if (pathname === '/api/diagnose' && method === 'POST') {
        const body = await parseJsonBody(req);
        const cropName = body.crop_name || 'Turmeric';
        const symptom = body.symptom || 'brown spots with yellow halo on foliage';

        // Simulated AI Computer Vision Diagnosis Result
        const diagnosisTemplates = {
          'Turmeric': {
            disease: 'Leaf Spot (Colletotrichum capsici / Early Blight)',
            confidence: 96.4,
            severity: 'Moderate (Level 2)',
            symptoms: 'Elliptical brown necrotic patches on leaves with chlorotic yellow halo.',
            treatment: 'Spray Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1 ml/L in 500 liters water per acre.',
            organic: 'Spray 5% Neem Seed Kernel Extract (NSKE) or Trichoderma viride culture @ 10 g/L.'
          },
          'Tomato': {
            disease: 'Early Blight (Alternaria solani)',
            confidence: 94.8,
            severity: 'Mild to Moderate',
            symptoms: 'Target-like concentric rings on lower leaves, yellowing of margin.',
            treatment: 'Apply Chlorothalonil 75% WP @ 2 g/L or Difenoconazole 25% EC @ 0.5 ml/L.',
            organic: 'Bio-fungicide Pseudomonas fluorescens foliar spray @ 5 g/L.'
          },
          'Rice': {
            disease: 'Rice Blast (Magnaporthe oryzae)',
            confidence: 95.2,
            severity: 'High',
            symptoms: 'Spindle-shaped lesions with grey center and brownish border.',
            treatment: 'Tricyclazole 75% WP @ 0.6 g/L or Isoprothiolane 40% EC @ 1.5 ml/L.',
            organic: 'Spray bio-agent Bacillus subtilis formulation @ 2 g/L.'
          },
          'Chilli': {
            disease: 'Anthracnose / Fruit Rot (Colletotrichum)',
            confidence: 93.7,
            severity: 'Moderate',
            symptoms: 'Circular sunken lesions with concentric rings of acervuli.',
            treatment: 'Propiconazole 25% EC @ 1 ml/L or Copper Oxychloride 50% WP @ 3 g/L.',
            organic: 'Apply Trichoderma harzianum soil and foliar application.'
          }
        };

        const result = diagnosisTemplates[cropName] || {
          disease: 'Foliar Fungal Spot Infection',
          confidence: 91.5,
          severity: 'Moderate',
          symptoms: symptom || 'Irregular discolored patches on leaf tissue.',
          treatment: 'Apply broad-spectrum fungicide Mancozeb 75% WP @ 2.5 g/L.',
          organic: 'Spray neem oil formulation (3000 ppm) @ 5 ml/L.'
        };

        db.prepare(`
          INSERT INTO diagnoses (timestamp, crop_name, disease_name, confidence, severity, symptoms, treatment, organic_remedy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new Date().toISOString(),
          cropName,
          result.disease,
          result.confidence,
          result.severity,
          result.symptoms,
          result.treatment,
          result.organic
        );

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: result }));
        return;
      }

      // 7. Growth Comparison
      if (pathname === '/api/growth-comparison' && method === 'GET') {
        const growthData = {
          crop: 'Turmeric (Salem/Pratibha Variety)',
          sown_date: '20 Mar 2025',
          days_after_sowing: 86,
          stage: 'Rhizome Development & Vegetative Expansion',
          stages: [
            { name: 'Germination & Sprouting', days: '0-30', expected_height_cm: 15, actual_height_cm: 16, status: 'Completed' },
            { name: 'Vegetative Tillering', days: '31-75', expected_height_cm: 45, actual_height_cm: 48, status: 'Completed' },
            { name: 'Rhizome Initiation', days: '76-120', expected_height_cm: 75, actual_height_cm: 72, status: 'Active (Current)' },
            { name: 'Rhizome Bulking & Maturation', days: '121-210', expected_height_cm: 90, actual_height_cm: null, status: 'Upcoming' },
            { name: 'Harvest Stage', days: '211-240', expected_height_cm: 95, actual_height_cm: null, status: 'Upcoming' }
          ],
          health_score: 92,
          summary: 'Your crop growth is on track (96% alignment with ideal biometric curves). Slight nitrogen top dressing recommended this week.'
        };
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: growthData }));
        return;
      }

      // 8. Irrigation Planner
      if (pathname === '/api/irrigation-plan' && method === 'GET') {
        const plan = {
          crop: 'Turmeric',
          soil_type: 'Red sandy loam to clay loam',
          root_zone_depth_cm: 30,
          current_moisture_level: '68% (Adequate)',
          next_irrigation_due: 'Tomorrow, 06:00 AM',
          water_requirement_liters_day: 14200,
          seven_day_schedule: [
            { date: 'Today (Wed)', need: 'Skip (Sufficient Soil Moisture)', icon: '🟢', mm: 0 },
            { date: 'Thu', need: 'Irrigate (45 mins drip, 18 mm)', icon: '💧', mm: 18 },
            { date: 'Fri', need: 'Skip (Rain Forecast 45%)', icon: '🌧️', mm: 0 },
            { date: 'Sat', need: 'Check Moisture Sensor', icon: '🔍', mm: 0 },
            { date: 'Sun', need: 'Irrigate (35 mins drip, 15 mm)', icon: '💧', mm: 15 },
            { date: 'Mon', need: 'Skip', icon: '🟢', mm: 0 },
            { date: 'Tue', need: 'Irrigate (40 mins drip, 16 mm)', icon: '💧', mm: 16 }
          ]
        };
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: plan }));
        return;
      }

      // Fallback API route
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
      return;
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: apiErr.message }));
      return;
    }
  }

  // Serve static files
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 AgriSmart AI Platform Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: SQLite (agrismart.db) initialized`);
  console.log(`=======================================================`);
});
