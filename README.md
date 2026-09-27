# 🧭 WanderWave — Travel Journal & Destination Explorer

A full-stack, responsive travel blogging and expedition platform engineered for college project presentations, course evaluations, and web engineering portfolios. Built using **Node.js**, **Express 5**, native **SQLite (`node:sqlite`)**, and modern **HTML5 / CSS3 / ES6+ JavaScript**.

---

## 🌟 Key Highlights & Features

### 1. 📖 Destination Guides & Editorial Stories
- **Rich Story Articles**: Immersive travel journals featuring high-resolution photography, geographic tags, travel styles, and country badges.
- **Estimated Reading Time**: Computed automatically on the server and client (`~200 words/minute`).
- **Best Season & Budget Indicators**: Quick snapshot widgets displaying optimal travel months and daily budget estimates.
- **Day-by-Day Interactive Itinerary**: Detailed step-by-step route breakdowns with timeline visuals.
- **Interactive Photo Gallery**: Multi-image destination snapshots with full-resolution lightbox viewing.

### 2. 🔍 Advanced Real-Time Search & Multi-Faceted Filters
- **Live Search**: Instant keyword filtering across titles, locations, summaries, and narrative bodies.
- **Category Quick Pills**: One-click filtering by *Cultural Heritage*, *Adventure & Treks*, *Island & Coastal*, *Scenic Nature*, and *Budget Backpacking*.
- **Dropdown Filters**:
  - **Region / Continent**: Filter by Asia, Europe, Americas, Africa, Middle East, Oceania.
  - **Travel Style**: Solo Backpacking, Cultural, Nature & Wildlife, Romantic, Adventure.
  - **Budget Tier**: `$` (&lt;$50/day), `$$` ($50–$150/day), `$$$` ($150+/day).
  - **Sorting**: Newest First, Most Liked & Popular, Shortest Read, Highest Rated.
- **Active Filter Chips**: Visual tags showing active criteria with individual removal and one-click reset.

### 3. 💬 Interactive Community & Reader Feedback
- **Live Like Counter**: Atomic SQLite counter increment with instantaneous UI updates and localStorage persistence.
- **Discussion Feed**: Readers can submit comments with their names and custom avatar generation.
- **Saved Bookmarks Drawer**: Save favorite guides for offline reference stored locally in browser `localStorage`.

### 4. 🧮 Interactive Travel Tools
- **Trip Budget Estimator**: Dynamic travel calculator tailored to number of travelers, trip days, lodging class (Backpacker, Comfort, Luxury), flights, and travel insurance.
- **Destinations Atlas**: Interactive country directory with story counters and instant filter activation.

### 5. ✍️ Full CRUD Publishing Portal (Evaluation Ready)
- Native accessible `<dialog>` modal with validation to submit new travel stories directly into SQLite.
- Includes preset cover photo buttons (*Ancient Temples*, *Alpine Mountains*, *Tropical Beach*, *Desert Dunes*) so evaluators can test publishing without searching for image links.

### 6. 🎨 Visual Experience & Accessibility
- **Dual Themes**: Complete Dark & Light mode toggle with smooth CSS variable transitions.
- **Reading Progress Bar**: Dynamic top bar indicating scroll progress through the page.
- **Responsive Layout**: Fluid CSS Grid and Flexbox adapting seamlessly from mobile phones to 4K displays.

---

## 🏗️ Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Browser)                      │
│   • Semantic HTML5  • Modern CSS Variables & Grid          │
│   • Asynchronous Fetch API  • Native <dialog> Modals       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                 Application Server (Node.js)                │
│   • Express 5.x REST API Engine                             │
│   • Static Asset Pipeline & SPA Fallback Routing            │
│   • Parameter Sanitization & Automatic Slug Generation      │
└──────────────────────────────┬──────────────────────────────┘
                               │ DatabaseSync
┌──────────────────────────────▼──────────────────────────────┐
│                 Database Layer (SQLite)                     │
│   • Native node:sqlite engine (Zero compilation hassles)    │
│   • Relational Schema with Foreign Key Cascade Constraints  │
│   • Pre-seeded with 8+ diverse continental travel stories   │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ / v22+ / v24+) | JavaScript runtime execution |
| **Backend Framework** | Express 5.x | RESTful API routes, middleware, and static serving |
| **Database** | SQLite (`node:sqlite`) | Zero-dependency, single-file relational database |
| **Frontend UI** | HTML5, Modern CSS3 | Semantic markup, glassmorphism, responsive grid |
| **Icons & Typography** | FontAwesome 6, Google Fonts | Plus Jakarta Sans & Playfair Display |

---

## 🗄️ Database Schema (SQLite)

### Table: `posts`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Unique post ID |
| `title` | TEXT NOT NULL | Story title |
| `slug` | TEXT UNIQUE NOT NULL | SEO-friendly URL slug |
| `summary` | TEXT NOT NULL | Short teaser summary |
| `content` | TEXT NOT NULL | Full editorial narrative |
| `highlights` | TEXT NOT NULL | JSON array of key attractions |
| `itinerary` | TEXT NOT NULL | JSON array of day-by-day steps |
| `category` | TEXT NOT NULL | Category name |
| `country` | TEXT NOT NULL | Destination country |
| `continent` | TEXT NOT NULL | Geographic continent |
| `location` | TEXT NOT NULL | Specific city/region |
| `hero_image` | TEXT NOT NULL | High-resolution cover photo URL |
| `gallery` | TEXT NOT NULL | JSON array of gallery images |
| `author_name` | TEXT NOT NULL | Author's display name |
| `author_avatar` | TEXT NOT NULL | Author profile picture URL |
| `author_role` | TEXT NOT NULL | Author title / credentials |
| `reading_time` | INTEGER NOT NULL | Estimated reading duration in minutes |
| `budget_tier` | TEXT NOT NULL | `$` / `$$` / `$$$` |
| `budget_estimate`| TEXT NOT NULL | Daily cost range estimate |
| `travel_style` | TEXT NOT NULL | Solo, Cultural, Adventure, etc. |
| `best_season` | TEXT NOT NULL | Recommended travel months |
| `rating` | REAL DEFAULT 4.8 | Reader review score |
| `likes` | INTEGER DEFAULT 0 | Like counter |
| `views` | INTEGER DEFAULT 0 | Story page view counter |
| `featured` | INTEGER DEFAULT 0 | Spotlight story flag (1 = yes) |
| `created_at` | TEXT NOT NULL | Date string (`YYYY-MM-DD`) |

### Table: `comments`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Unique comment identifier |
| `post_id` | INTEGER NOT NULL | Foreign Key referencing `posts(id)` ON DELETE CASCADE |
| `author_name` | TEXT NOT NULL | Commenter name |
| `author_avatar`| TEXT | Avatar icon URL |
| `comment` | TEXT NOT NULL | Comment content |
| `created_at` | TEXT NOT NULL | Timestamp |

---

## 📡 REST API Reference

| Method | Endpoint | Query Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | `?search=`, `?category=`, `?continent=`, `?travel_style=`, `?budget_tier=`, `?sort=` | Fetch travel stories matching filters |
| `GET` | `/api/posts/featured` | — | Fetch editor's spotlight story |
| `GET` | `/api/posts/:id` | `id` or `slug` in path | Fetch single story with comments; increments views |
| `POST` | `/api/posts` | `{ title, country, continent, category, content, ... }` | Publish new travel story |
| `POST` | `/api/posts/:id/like` | — | Increment story like counter |
| `POST` | `/api/posts/:id/comments` | `{ author_name, comment }` | Add reader comment to story |
| `GET` | `/api/categories` | — | Get aggregated categories with counts |
| `GET` | `/api/destinations` | — | Get countries directory with story counts |
| `GET` | `/api/stats` | — | Total stories, countries, likes & views |

---

## 🚀 How to Run the Project

### 1. Open Terminal in the Project Directory
```powershell
cd C:\Users\PREMIUM\.gemini\antigravity\scratch\travel-blog
```

### 2. Start the Server
```powershell
node server.js
```
*The server will automatically create `wanderlust.sqlite` and seed it with 8 rich international travel stories on first launch!*

### 3. Open in Browser
Visit:
👉 **[http://localhost:3000](http://localhost:3000)**

### 4. Run Automated Test Suite
To verify all REST endpoints and SQLite database operations:
```powershell
npm test
```

---

## 🎓 College Viva & Defense Questions (Exam Guide)

**Q1: Why did you choose SQLite over MySQL or MongoDB for this project?**  
> *Answer:* SQLite requires zero external server daemon setup, stores all relational data in a single ACID-compliant portable file (`wanderlust.sqlite`), and in Node.js 22+, `node:sqlite` provides native synchronous prepared statements without requiring third-party C++ build tools.

**Q2: How does the application handle asynchronous operations?**  
> *Answer:* The frontend uses `async/await` with the native browser `fetch` API. Debounced event listeners ensure that typing in the search bar doesn't flood the server with requests.

**Q3: How is data integrity maintained in the database?**  
> *Answer:* We enforce foreign key constraints (`PRAGMA foreign_keys = ON;`) so that comments are linked directly to `post_id` with `ON DELETE CASCADE`. All database queries use prepared statements (`db.prepare(...)`) with parameterized values to prevent SQL injection vulnerabilities.

**Q4: How does the budget calculator work?**  
> *Answer:* It computes lodging, meals, and local transit costs as a function of `days × dailyRate × travelers`, factoring in optional add-ons (flights, medical insurance) and dynamically updates totals, per-person costs, and daily averages.

---

*WanderWave — Built with modern web engineering best practices.*
