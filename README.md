# 🌾 AgriSmart AI — Smart Farming Web Platform & AI Backend

**AgriSmart AI** is a full-stack, AI-powered agricultural advisory platform designed to assist farmers with crop health diagnosis, real-time weather analytics, land parcel acreage measurement, irrigation scheduling, and multilingual voice assistance (Telugu & English).

The user interface matches the reference dashboard layout, complete with responsive layouts, interactive modals, and dynamic data binding connected to an embedded high-performance **SQLite** backend.

---

## 🚀 Quick Start (Running Backend & Frontend)

### Option 1: Double-click launcher
Simply double-click `start.bat` in this folder:
```
C:\Users\test2\.gemini\antigravity\scratch\agrismart-ai\start.bat
```
This automatically launches the server and opens your browser to **`http://localhost:3000`**.

### Option 2: PowerShell / Command Line
```powershell
cd C:\Users\test2\.gemini\antigravity\scratch\agrismart-ai
& "$env:USERPROFILE\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
```
*(Or if standard `node` is in your PATH: `node server.js`)*

---

## 🗄️ Architecture & SQLite Database Schema

The backend uses Node's native `node:sqlite` engine (`agrismart.db`) requiring **zero external npm package dependencies**. All tables and sample data are auto-seeded on initial launch:

1. **`farmer_profile`**:
   - `id`, `name`, `location`, `farm_size_acres`, `farm_size_sqm`, `sown_date`, `selected_crop_id`, `temperature_c`, `weather_condition`
2. **`crops`** (Pre-seeded with 30 key crops from Andhra Pradesh & Telangana):
   - `id`, `name`, `family`, `category`, `emoji`, `description`, `common_diseases`, `ideal_temp`, `ideal_ph`, `water_req`, `growing_season`, `expected_yield`
3. **`diagnoses`**:
   - `id`, `timestamp`, `crop_name`, `disease_name`, `confidence`, `severity`, `symptoms`, `treatment`, `organic_remedy`
4. **`land_measurements`**:
   - `id`, `timestamp`, `field_name`, `acres`, `sq_meters`, `polygon_coords`
5. **`voice_logs`**:
   - `id`, `timestamp`, `query`, `language`, `response`

---

## 📡 Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Fetches active farmer profile, location, weather, and farm size |
| `POST` | `/api/profile/update` | Updates farmer credentials, active crop, or field dimensions |
| `GET` | `/api/crops` | Retrieves crops with optional `?category=` and `?search=` filters |
| `GET` | `/api/crops/:id` | Returns complete botanical profile, diseases, and growth parameters |
| `GET` | `/api/weather` | Returns Nizamabad live agricultural weather parameters & 3-day forecast |
| `POST` | `/api/diagnose` | AI Computer Vision leaf pathology simulation returning treatment options |
| `GET` | `/api/land-measurement` | Retrieves the latest GPS field survey polygon |
| `POST` | `/api/land-measurement` | Saves user-drawn canvas polygon, auto-computes acres and m² |
| `POST` | `/api/voice-assistant` | Multilingual NLP assistant supporting Telugu (`"నా పంటలకు ఈ రోజు నీళ్లు పెట్టవచ్చా?"`) & English |
| `GET` | `/api/growth-comparison` | Phenological stage progress comparison (expected vs actual height) |
| `GET` | `/api/irrigation-plan` | Evapotranspiration index and 7-day smart watering plan |

---

## 🎨 Interactive Features in the Dashboard

- **Crop Catalog Grid**: 6-column grid featuring 30 crops (Tomato, Rice, Chilli, Cotton, Maize, Potato, Brinjal, Okra, Cabbage, Cauliflower, Carrot, Onion, Groundnut, Sugarcane, Banana, Grapes, Mango, Tamarind, Turmeric, Ginger, Black Gram, Green Gram, Red Gram, Chickpea, Coriander, Cumin, Fenugreek, Sesame, Mustard, Pepper).
- **Interactive Crop Details**: Clicking any crop updates the right inspector panel in real-time and persists the choice to SQLite.
- **AI Leaf Scanner & Diagnoser Modal**: Upload or preview leaf foliage, trigger the laser scanner, and inspect AI confidence percentage, chemical treatments, and organic remedies.
- **Land Measurement Canvas**: Plot field boundary pins on an interactive canvas, with real-time Shoelace geometric area calculation (acres & m²), and 1-click sync to your profile.
- **Multilingual Voice Assistant**: Live microphone recorder, animated audio waveform, Telugu & English query answering, and speech synthesis voice readout.
- **Quick Action Modals**: Crop Growth timeline and 7-Day weather-based irrigation schedule.
