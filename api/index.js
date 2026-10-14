// api/index.js - Vercel Serverless Function Handler for AgriSmart AI
// Zero external dependencies; runs seamlessly on Vercel Node.js Serverless runtime

const cropsData = [
  {
    id: 1, name: 'Tomato', family: 'Solanaceae', category: 'Vegetables', emoji: '🍅',
    desc: 'One of the most widely grown vegetables in Andhra & Telangana.',
    common_diseases: ['Early Blight', 'Late Blight', 'Bacterial Wilt', 'Tomato Leaf Curl'],
    ideal_temp: '20°C - 30°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '25-30 tons/acre'
  },
  {
    id: 2, name: 'Rice', family: 'Gramineae', category: 'Cereals', emoji: '🌾',
    desc: 'Primary staple food grain crop in South India.',
    common_diseases: ['Rice Blast', 'Bacterial Leaf Blight', 'Sheath Blight', 'Brown Spot'],
    ideal_temp: '22°C - 32°C', ideal_ph: '5.5 - 6.5', water_req: 'High (Flooded)', growing_season: 'Kharif / Rabi', yield: '2.5-3.5 tons/acre'
  },
  {
    id: 3, name: 'Chilli', family: 'Solanaceae', category: 'Spices', emoji: '🌶️',
    desc: 'Famous Guntur chillies, vital commercial spice and cash crop.',
    common_diseases: ['Anthracnose (Fruit Rot)', 'Powdery Mildew', 'Leaf Curl Virus', 'Dieback'],
    ideal_temp: '20°C - 32°C', ideal_ph: '6.5 - 7.5', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '1.5-2.5 tons dry/acre'
  },
  {
    id: 4, name: 'Cotton', family: 'Malvaceae', category: 'Cash Crops', emoji: '☁️',
    desc: 'Major cash fiber crop grown extensively in black cotton soils.',
    common_diseases: ['Boll Rot', 'Fusarium Wilt', 'Grey Mildew', 'Bacterial Blight'],
    ideal_temp: '21°C - 35°C', ideal_ph: '6.0 - 8.0', water_req: 'Moderate', growing_season: 'Kharif', yield: '10-15 quintals/acre'
  },
  {
    id: 5, name: 'Maize', family: 'Poaceae', category: 'Cereals', emoji: '🌽',
    desc: 'Queen of cereals, important for food, poultry feed and fodder.',
    common_diseases: ['Fall Armyworm', 'Turcicum Leaf Blight', 'Common Rust', 'Stalk Rot'],
    ideal_temp: '18°C - 30°C', ideal_ph: '5.8 - 7.2', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '25-35 quintals/acre'
  },
  {
    id: 6, name: 'Potato', family: 'Solanaceae', category: 'Vegetables', emoji: '🥔',
    desc: 'Cool-season tuber crop highly consumed across the country.',
    common_diseases: ['Late Blight', 'Early Blight', 'Common Scab', 'Black Scurf'],
    ideal_temp: '15°C - 24°C', ideal_ph: '5.2 - 6.4', water_req: 'Moderate', growing_season: 'Rabi (Winter)', yield: '8-12 tons/acre'
  },
  {
    id: 7, name: 'Brinjal (Eggplant)', family: 'Solanaceae', category: 'Vegetables', emoji: '🍆',
    desc: 'Popular vegetable with high local market demand.',
    common_diseases: ['Phomopsis Blight', 'Bacterial Wilt', 'Little Leaf', 'Fruit and Shoot Borer'],
    ideal_temp: '22°C - 32°C', ideal_ph: '5.5 - 6.8', water_req: 'Moderate', growing_season: 'All Year', yield: '12-16 tons/acre'
  },
  {
    id: 8, name: 'Okra (Ladyfinger)', family: 'Malvaceae', category: 'Vegetables', emoji: '🥬',
    desc: 'Warm season crop with high culinary and nutritional value.',
    common_diseases: ['Yellow Vein Mosaic Virus', 'Powdery Mildew', 'Cercospora Leaf Spot', 'Root Knot Nematode'],
    ideal_temp: '24°C - 35°C', ideal_ph: '6.0 - 6.8', water_req: 'Moderate', growing_season: 'Summer / Kharif', yield: '4-6 tons/acre'
  },
  {
    id: 9, name: 'Cabbage', family: 'Brassicaceae', category: 'Vegetables', emoji: '🥬',
    desc: 'Cole crop requiring cool moist climate and well drained soil.',
    common_diseases: ['Black Rot', 'Clubroot', 'Downy Mildew', 'Alternaria Leaf Spot'],
    ideal_temp: '15°C - 22°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate to High', growing_season: 'Rabi / Winter', yield: '15-20 tons/acre'
  },
  {
    id: 10, name: 'Cauliflower', family: 'Brassicaceae', category: 'Vegetables', emoji: '🥦',
    desc: 'Prized cool season vegetable demanding careful curd management.',
    common_diseases: ['Black Rot', 'Downy Mildew', 'Whiptail (Mo deficiency)', 'Stemphylium Leaf Spot'],
    ideal_temp: '15°C - 20°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate to High', growing_season: 'Rabi / Winter', yield: '12-18 tons/acre'
  },
  {
    id: 11, name: 'Carrot', family: 'Apiaceae', category: 'Vegetables', emoji: '🥕',
    desc: 'Root crop rich in beta-carotene; favors loose sandy-loam.',
    common_diseases: ['Alternaria Leaf Blight', 'Powdery Mildew', 'Cavity Spot', 'Cottony Soft Rot'],
    ideal_temp: '16°C - 22°C', ideal_ph: '6.0 - 6.8', water_req: 'Moderate', growing_season: 'Rabi (Winter)', yield: '8-12 tons/acre'
  },
  {
    id: 12, name: 'Onion', family: 'Amaryllidaceae', category: 'Vegetables', emoji: '🧅',
    desc: 'Crucial cash and daily diet vegetable with dynamic market pricing.',
    common_diseases: ['Purple Blotch', 'Stemphylium Leaf Blight', 'Basal Rot', 'Downy Mildew'],
    ideal_temp: '18°C - 28°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate', growing_season: 'Kharif / Late Kharif / Rabi', yield: '10-15 tons/acre'
  },
  {
    id: 13, name: 'Groundnut', family: 'Fabaceae', category: 'Oilseeds', emoji: '🥜',
    desc: 'Significant oilseed and protein source grown in dryland regions.',
    common_diseases: ['Tikka Leaf Spot', 'Rust', 'Collar Rot', 'Stem Rot'],
    ideal_temp: '22°C - 30°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate', growing_season: 'Kharif / Rabi', yield: '8-12 quintals/acre'
  },
  {
    id: 14, name: 'Sugarcane', family: 'Poaceae', category: 'Cash Crops', emoji: '🎋',
    desc: 'Long duration industrial sugar & jaggery feedstock.',
    common_diseases: ['Red Rot', 'Smut', 'Wilt', 'Grassy Shoot'],
    ideal_temp: '20°C - 35°C', ideal_ph: '6.5 - 7.5', water_req: 'Very High', growing_season: 'Perennial (10-12 months)', yield: '35-45 tons/acre'
  },
  {
    id: 15, name: 'Banana', family: 'Musaceae', category: 'Fruits', emoji: '🍌',
    desc: 'Major commercial fruit crop demanding high potassium and moisture.',
    common_diseases: ['Panama Wilt (Fusarium)', 'Sigatoka Leaf Spot', 'Bunchy Top Virus', 'Erwinia Rhizome Rot'],
    ideal_temp: '24°C - 32°C', ideal_ph: '6.0 - 7.5', water_req: 'High', growing_season: 'Year-round planting', yield: '25-35 tons/acre'
  },
  {
    id: 16, name: 'Grapes', family: 'Vitaceae', category: 'Fruits', emoji: '🍇',
    desc: 'High-value fruit vine prominent around Hyderabad and Deccan plateau.',
    common_diseases: ['Downy Mildew', 'Powdery Mildew', 'Anthracnose', 'Bacterial Leaf Spot'],
    ideal_temp: '18°C - 32°C', ideal_ph: '6.5 - 8.0', water_req: 'Moderate (Drip)', growing_season: 'Perennial vine', yield: '10-14 tons/acre'
  },
  {
    id: 17, name: 'Mango', family: 'Anacardiaceae', category: 'Fruits', emoji: '🥭',
    desc: 'King of Fruits, Banganapalli and Totapuri varieties are renowned.',
    common_diseases: ['Powdery Mildew', 'Anthracnose', 'Mango Malformation', 'Dieback'],
    ideal_temp: '24°C - 33°C', ideal_ph: '5.5 - 7.5', water_req: 'Moderate', growing_season: 'Summer harvest', yield: '4-8 tons/acre'
  },
  {
    id: 18, name: 'Tamarind', family: 'Papilionaceae', category: 'Spices', emoji: '🌰',
    desc: 'Drought-hardy perennial tree producing sour pulp for culinary use.',
    common_diseases: ['Sooty Mold', 'Powdery Mildew', 'Stem Canker', 'Leaf Gall'],
    ideal_temp: '25°C - 38°C', ideal_ph: '5.5 - 8.0', water_req: 'Low', growing_season: 'Dry season harvest', yield: '2-4 tons/acre'
  },
  {
    id: 19, name: 'Turmeric', family: 'Zingiberaceae', category: 'Spices', emoji: '🍠',
    desc: 'Golden spice with high curcumin, Nizamabad is world-renowned for it.',
    common_diseases: ['Leaf spot (early blight)', 'Rhizome rot (fungal)', 'Bacterial wilt (bacterial)', 'Leaf curl virus (viral)'],
    ideal_temp: '20°C - 30°C', ideal_ph: '5.5 - 7.5', water_req: 'Moderate', growing_season: 'Rainy / Summer', yield: '8-10 tons fresh/acre'
  },
  {
    id: 20, name: 'Ginger', family: 'Zingiberaceae', category: 'Spices', emoji: '🫚',
    desc: 'Shade-loving rhizome spice valued for medicine and flavoring.',
    common_diseases: ['Soft Rot / Rhizome Rot', 'Bacterial Wilt', 'Leaf Spot', 'Yellows (Fusarium)'],
    ideal_temp: '22°C - 30°C', ideal_ph: '5.5 - 6.5', water_req: 'Moderate to High', growing_season: 'Kharif', yield: '6-9 tons/acre'
  },
  {
    id: 21, name: 'Black Gram', family: 'Fabaceae', category: 'Pulses', emoji: '⚫',
    desc: 'Rich source of protein (Urad dal), improves soil nitrogen.',
    common_diseases: ['Yellow Mosaic Virus', 'Powdery Mildew', 'Cercospora Leaf Spot', 'Root Rot'],
    ideal_temp: '25°C - 35°C', ideal_ph: '6.0 - 7.5', water_req: 'Low to Moderate', growing_season: 'Kharif / Rabi', yield: '4-6 quintals/acre'
  },
  {
    id: 22, name: 'Green Gram', family: 'Fabaceae', category: 'Pulses', emoji: '🟢',
    desc: 'Moong dal, short duration leguminous pulse crop.',
    common_diseases: ['Mungbean Yellow Mosaic', 'Anthracnose', 'Powdery Mildew', 'Macrophomina Root Rot'],
    ideal_temp: '25°C - 32°C', ideal_ph: '6.2 - 7.2', water_req: 'Low to Moderate', growing_season: 'Summer / Kharif', yield: '4-5 quintals/acre'
  },
  {
    id: 23, name: 'Red Gram', family: 'Fabaceae', category: 'Pulses', emoji: '🔴',
    desc: 'Pigeon pea (Toor dal), key rainfed dryland pulse in Telangana.',
    common_diseases: ['Fusarium Wilt', 'Sterility Mosaic Disease', 'Phytophthora Blight', 'Pod Borer'],
    ideal_temp: '22°C - 35°C', ideal_ph: '6.5 - 7.8', water_req: 'Moderate (Drought tolerant)', growing_season: 'Kharif (Long duration)', yield: '6-8 quintals/acre'
  },
  {
    id: 24, name: 'Chickpea', family: 'Fabaceae', category: 'Pulses', emoji: '🟤',
    desc: 'Bengal gram (Chana), major winter rabi legume crop.',
    common_diseases: ['Fusarium Wilt', 'Ascochyta Blight', 'Dry Root Rot', 'Collar Rot'],
    ideal_temp: '18°C - 26°C', ideal_ph: '6.0 - 7.5', water_req: 'Low', growing_season: 'Rabi (Winter)', yield: '6-9 quintals/acre'
  },
  {
    id: 25, name: 'Coriander', family: 'Apiaceae', category: 'Spices', emoji: '🌿',
    desc: 'Aromatic herb and spice seed crop grown for both leaves and grain.',
    common_diseases: ['Powdery Mildew', 'Stem Gall', 'Wilt', 'Alternaria Blight'],
    ideal_temp: '15°C - 25°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate', growing_season: 'Rabi', yield: '4-6 quintals seeds/acre'
  },
  {
    id: 26, name: 'Cumin', family: 'Apiaceae', category: 'Spices', emoji: '🌾',
    desc: 'Valuable spice demanding dry sunny weather during seed setting.',
    common_diseases: ['Fusarium Wilt', 'Blight (Alternaria)', 'Powdery Mildew'],
    ideal_temp: '16°C - 25°C', ideal_ph: '6.8 - 8.0', water_req: 'Low', growing_season: 'Rabi', yield: '3-4 quintals/acre'
  },
  {
    id: 27, name: 'Fenugreek', family: 'Fabaceae', category: 'Spices', emoji: '🌱',
    desc: 'Methi, multi-purpose herb used as greens, seeds and green manure.',
    common_diseases: ['Cercospora Leaf Spot', 'Powdery Mildew', 'Downy Mildew', 'Root Rot'],
    ideal_temp: '15°C - 24°C', ideal_ph: '6.0 - 7.0', water_req: 'Moderate', growing_season: 'Rabi', yield: '5-7 quintals seeds/acre'
  },
  {
    id: 28, name: 'Sesame', family: 'Pedaliaceae', category: 'Oilseeds', emoji: '🌰',
    desc: 'Til/Gingelly, ancient high-grade edible oil crop.',
    common_diseases: ['Phyllody (Mycoplasma)', 'Bacterial Leaf Spot', 'Alternaria Blight', 'Root Rot'],
    ideal_temp: '25°C - 35°C', ideal_ph: '5.5 - 7.5', water_req: 'Low', growing_season: 'Summer / Kharif', yield: '2.5-3.5 quintals/acre'
  },
  {
    id: 29, name: 'Mustard', family: 'Brassicaceae', category: 'Oilseeds', emoji: '🌼',
    desc: 'Crucial rabi oilseed offering high pungent oil content.',
    common_diseases: ['White Rust', 'Alternaria Blight', 'Downy Mildew', 'Sclerotinia Rot'],
    ideal_temp: '12°C - 25°C', ideal_ph: '6.0 - 7.5', water_req: 'Moderate', growing_season: 'Rabi', yield: '6-8 quintals/acre'
  },
  {
    id: 30, name: 'Pepper', family: 'Piperaceae', category: 'Spices', emoji: '🌿',
    desc: 'Black pepper, the king of spices, grown as an intercrop.',
    common_diseases: ['Quick Wilt (Phytophthora)', 'Slow Wilt', 'Pollu Disease (Anthracnose)', 'Stunt Virus'],
    ideal_temp: '20°C - 32°C', ideal_ph: '5.5 - 6.5', water_req: 'High (Humid)', growing_season: 'Perennial', yield: '1.2-1.8 tons/acre'
  }
];

// Persistent state in memory for serverless runtime
let farmerProfile = {
  id: 1,
  name: 'Farmer',
  location: 'Nizamabad, Telangana',
  farm_size_acres: 2.5,
  farm_size_sqm: 10117,
  sown_date: '20 Mar 2025',
  selected_crop_id: 19,
  temperature_c: 28,
  weather_condition: 'Partly Cloudy'
};

let latestLandMeasurement = {
  id: 1,
  timestamp: new Date().toISOString(),
  field_name: 'Nizamabad North Field #1',
  acres: 2.47,
  sq_meters: 9998,
  polygon_coords: [[18.6725, 78.0941], [18.6738, 78.0955], [18.6732, 78.0970], [18.6718, 78.0962]]
};

// Helper for parsing body in serverless environment
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (req.body && typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

// Agricultural Knowledge Base
function getAiAdvice(query, lang = 'english') {
  const q = (query || '').toLowerCase();
  if (q.includes('నీళ్లు') || q.includes('water') || q.includes('irrigation')) {
    return {
      query, language: lang,
      telugu_answer: "ఈ రోజు వాతావరణం పాక్షికంగా మేఘావృతమై 28°C గా ఉంది. నేలలో తేమ 68% ఉన్నందున ఈ రోజు మీ పసుపు పంటకు అధిక నీరు అవసరం లేదు. రేపు ఉదయం 6:00 గంటలకు 45 నిమిషాల పాటు డ్రిప్ ఇరిగేషన్ ఇవ్వడం ఉత్తమం.",
      english_answer: "Today's weather is 28°C and partly cloudy with 68% soil moisture. No heavy watering is required today. Recommended: Give 45 mins drip irrigation tomorrow morning at 6:00 AM.",
      action: "Irrigation scheduled for tomorrow morning",
      recommendation_tag: "Optimal Soil Moisture"
    };
  }
  if (q.includes('leaf spot') || q.includes('తెగులు') || q.includes('disease') || q.includes('మచ్చ')) {
    return {
      query, language: lang,
      telugu_answer: "పసుపులో ఆకుమచ్చ తెగులు లక్షణాలు కనిపిస్తే, వెంటనే లీటరు నీటికి 2.5 గ్రాముల మాంకోజెబ్ (Mancozeb 75% WP) లేదా కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు కలిపి పిచికారీ చేయండి. సేంద్రియ నివారణకు వేప నూనె 5 మి.లీ పిచికారీ చేయవచ్చు.",
      english_answer: "For leaf spot in turmeric: Spray Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride @ 3g/L. For organic control, spray 5ml Neem oil (10,000 ppm) per liter of water.",
      action: "Fungicide Spray: Mancozeb 2.5g/L",
      recommendation_tag: "Disease Treatment Alert"
    };
  }
  if (q.includes('fertilizer') || q.includes('ఎరువు') || q.includes('పోషకాలు')) {
    return {
      query, language: lang,
      telugu_answer: "పసుపు విత్తిన 60-90 రోజుల మధ్య మూడో వాయిదా ఎరువులు ఇవ్వాలి. ఎకరానికి 30 కిలోల యూరియా, 25 కిలోల పొటాష్ వేసి మట్టిని ఎగదోయాలి.",
      english_answer: "For Turmeric at this stage (Day 80-90 after sowing): Apply the third split dose of 30 kg Urea and 25 kg MOP (Muriate of Potash) per acre followed by light earthing-up.",
      action: "NPK Top Dressing Recommended",
      recommendation_tag: "Nutrient Management"
    };
  }
  return {
    query, language: lang,
    telugu_answer: "నమస్కారం రైతు సోదరులారా! మీ పంట సంరక్షణ కోసం AgriSmart AI ఎల్లప్పుడూ సిద్ధంగా ఉంది. మీ పంటకు నీటి నిర్వహణ, ఎరువులు, తెగుళ్ళ నివారణ లేదా నేల పరీక్ష గురించి అడగండి.",
    english_answer: "Greetings Farmer! AgriSmart AI is here to help with your crop care, irrigation schedules, fertilizer calculation, and AI disease diagnosis.",
    action: "Consultation Complete",
    recommendation_tag: "General Advice"
  };
}

module.exports = async (req, res) => {
  // CORS
  if (typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    if (typeof res.writeHead === 'function') res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;

  // Normalize path if /api/ prefix stripped or included
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + pathname;
  }

  try {
    // 1. Profile Endpoints
    if (pathname === '/api/profile' && req.method === 'GET') {
      const activeCrop = cropsData.find(c => c.id === farmerProfile.selected_crop_id) || cropsData[18];
      const fullProfile = {
        ...farmerProfile,
        crop_name: activeCrop.name,
        crop_family: activeCrop.family,
        crop_category: activeCrop.category,
        ideal_temp: activeCrop.ideal_temp,
        ideal_ph: activeCrop.ideal_ph,
        water_req: activeCrop.water_req,
        growing_season: activeCrop.growing_season
      };
      return sendJson(res, 200, { success: true, data: fullProfile });
    }

    if (pathname === '/api/profile/update' && req.method === 'POST') {
      const body = await parseBody(req);
      if (body.selected_crop_id) farmerProfile.selected_crop_id = Number(body.selected_crop_id);
      if (body.location) farmerProfile.location = body.location;
      if (body.farm_size_acres) {
        farmerProfile.farm_size_acres = Number(body.farm_size_acres);
        farmerProfile.farm_size_sqm = Math.round(Number(body.farm_size_acres) * 4046.86);
      }
      if (body.sown_date) farmerProfile.sown_date = body.sown_date;
      if (body.name) farmerProfile.name = body.name;

      return sendJson(res, 200, { success: true, data: farmerProfile });
    }

    // 2. Crops Endpoints
    if (pathname === '/api/crops' && req.method === 'GET') {
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      let filtered = cropsData;

      if (category && category !== 'All' && category !== 'All Crops') {
        filtered = filtered.filter(c => c.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(s) ||
          c.family.toLowerCase().includes(s) ||
          (c.desc && c.desc.toLowerCase().includes(s))
        );
      }
      return sendJson(res, 200, { success: true, count: filtered.length, data: filtered });
    }

    if (pathname.startsWith('/api/crops/') && req.method === 'GET') {
      const id = parseInt(pathname.split('/')[3], 10);
      const crop = cropsData.find(c => c.id === id);
      if (!crop) return sendJson(res, 404, { success: false, error: 'Crop not found' });
      return sendJson(res, 200, { success: true, data: crop });
    }

    // 3. Weather Endpoint
    if (pathname === '/api/weather' && req.method === 'GET') {
      const loc = url.searchParams.get('location') || 'Nizamabad, Telangana';
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
      return sendJson(res, 200, { success: true, data: weatherData });
    }

    // 4. Voice Assistant
    if (pathname === '/api/voice-assistant' && req.method === 'POST') {
      const body = await parseBody(req);
      const userQuery = body.query || 'Should I water my crop today?';
      const language = body.language || 'telugu';
      const advice = getAiAdvice(userQuery, language);
      return sendJson(res, 200, { success: true, data: advice });
    }

    // 5. Land Measurement
    if (pathname === '/api/land-measurement' && req.method === 'GET') {
      return sendJson(res, 200, { success: true, data: latestLandMeasurement });
    }

    if (pathname === '/api/land-measurement' && req.method === 'POST') {
      const body = await parseBody(req);
      const acres = body.acres || 2.47;
      const sq_meters = body.sq_meters || Math.round(acres * 4046.86);

      latestLandMeasurement = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        field_name: body.field_name || 'My Agricultural Field',
        acres: Number(acres),
        sq_meters: Number(sq_meters),
        polygon_coords: body.polygon_coords || []
      };

      farmerProfile.farm_size_acres = Number(acres);
      farmerProfile.farm_size_sqm = Number(sq_meters);

      return sendJson(res, 201, { success: true, acres, sq_meters });
    }

    // 6. AI Diagnosis
    if (pathname === '/api/diagnose' && req.method === 'POST') {
      const body = await parseBody(req);
      const cropName = body.crop_name || 'Turmeric';

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
        symptoms: 'Irregular discolored patches on leaf tissue.',
        treatment: 'Apply broad-spectrum fungicide Mancozeb 75% WP @ 2.5 g/L.',
        organic: 'Spray neem oil formulation (3000 ppm) @ 5 ml/L.'
      };

      return sendJson(res, 200, { success: true, data: result });
    }

    // 7. Growth Comparison
    if (pathname === '/api/growth-comparison' && req.method === 'GET') {
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
        summary: 'Your crop growth is on track (96% alignment with ideal biometric curves).'
      };
      return sendJson(res, 200, { success: true, data: growthData });
    }

    // 8. Irrigation Plan
    if (pathname === '/api/irrigation-plan' && req.method === 'GET') {
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
      return sendJson(res, 200, { success: true, data: plan });
    }

    return sendJson(res, 404, { success: false, error: 'Endpoint not found' });
  } catch (err) {
    return sendJson(res, 500, { success: false, error: err.message });
  }
};
