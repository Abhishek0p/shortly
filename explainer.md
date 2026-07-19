# Shortly - Advanced URL Shortener & Analytics Platform

Welcome to the **Shortly** project repository! This is a production-grade URL shortening service equipped with comprehensive click analytics, user authentication, and high-performance caching. 

This README provides a detailed breakdown of the project architecture, flow, technology stack, and a file-by-file analysis. It is designed to help you thoroughly understand the system and confidently explain it in an interview setting.

---

## 🏗️ Architecture & Technology Stack

The project is divided into two main parts: a **Frontend** built with React and a **Backend** built with FastAPI.

### Why these technologies?

*   **Frontend: React (Vite)**
    *   *Why?* React provides a component-based architecture for building interactive UIs. Vite is used as the build tool because it is blazingly fast compared to Create React App, offering instant server start and hot module replacement (HMR).
*   **Backend: FastAPI (Python)**
    *   *Why?* FastAPI is a modern, high-performance web framework for Python. It is built on standard Python type hints, offering automatic validation and auto-generated API documentation (Swagger/ReDoc). It fully supports asynchronous programming (`async`/`await`), which is crucial for handling multiple concurrent I/O operations (like database queries and Redis calls) without blocking.
*   **Database: MongoDB (Motor AsyncIO)**
    *   *Why?* MongoDB is a NoSQL database, making it highly flexible for storing unstructured or schema-less data (like varying user-agent headers in click analytics). The `motor` library provides asynchronous driver support, perfectly aligning with FastAPI's async nature.
*   **Caching & Rate Limiting: Redis**
    *   *Why?* Redis is an in-memory data structure store. It is extremely fast. We use it for two critical purposes:
        1.  **Caching:** Storing the mapping of `short_code -> original_url` to serve redirects instantly without hitting the database every time.
        2.  **Rate Limiting:** Tracking the number of requests per IP address to prevent abuse and DDoS attacks.
*   **Authentication: Supabase**
    *   *Why?* Supabase acts as a Backend-as-a-Service (BaaS) providing instant, secure authentication. It handles user sign-ups, logins, and issues JSON Web Tokens (JWTs) that our FastAPI backend can verify, saving us from writing complex auth logic from scratch.

---

## 🔄 System Flow: How it Works

Here is the step-by-step flow of the main functionalities:

### 1. User Authentication (Login)
1.  The user visits the frontend and enters their credentials.
2.  The React app authenticates directly with **Supabase**.
3.  Upon success, Supabase returns a session containing a **JWT (JSON Web Token)**.
4.  The frontend stores this token and attaches it to the `Authorization: Bearer <token>` header for all subsequent protected API requests.

### 2. Shortening a URL
1.  The authenticated user submits a long URL (and optionally a custom alias/expiry) via the frontend dashboard.
2.  The frontend sends a `POST /api/shorten` request to the FastAPI backend.
3.  **Backend Interception:**
    *   **Auth Check:** The `get_current_user` dependency verifies the JWT with Supabase. If invalid, it rejects the request (401 Unauthorized).
    *   **Rate Limiting:** Checks Redis to see if the user's IP has exceeded the allowed requests per minute. If so, it rejects the request (429 Too Many Requests).
4.  **Processing:**
    *   If a custom code is provided, it checks MongoDB to ensure it's unique.
    *   If no custom code is provided, it generates a random 6-character alphanumeric string and ensures it doesn't already exist.
5.  **Storage:** The link details (original URL, short code, user ID, creation date, expiry) are saved to the **MongoDB `links` collection**.
6.  **Caching:** The `short_code -> original_url` mapping is immediately stored in **Redis** (e.g., TTL of 24 hours) for fast access later.
7.  The backend returns the newly created short URL to the frontend.

### 3. Redirection & Click Tracking (The Core Function)
1.  A user clicks on a shortened link (e.g., `http://localhost:8000/xyz123`).
2.  The browser sends a `GET /xyz123` request to the backend.
3.  **Cache Lookup:** The backend first checks **Redis** for the key `url:xyz123`.
    *   *Cache Hit:* If found, it immediately redirects (302) to the original URL.
    *   *Cache Miss:* If not in Redis, it queries **MongoDB**. If found, it checks if the link has expired. If valid, it saves it back to Redis and redirects. If not found, it returns a 404.
4.  **Analytics Tracking (Asynchronous):** *Crucially, before or right after the redirect happens, the backend triggers an asynchronous background task to record the click.*
    *   It parses the `User-Agent` header to determine the device (Mobile/Desktop), browser, and OS.
    *   It grabs the IP address and Referrer.
    *   It inserts this data into the **MongoDB `clicks` collection**.
    *   It increments the `total_clicks` counter on the original link document.
    *   It invalidates any cached analytics data for this specific link in Redis.

### 4. Viewing Analytics
1.  The user visits the analytics page for a specific link on the frontend.
2.  Frontend sends a `GET /api/analytics/{code}` request.
3.  **Backend Processing:**
    *   Checks **Redis** for cached analytics data (`analytics:{code}`). If found, returns it instantly.
    *   If not cached, it queries the **MongoDB `clicks` collection** for all clicks related to that code.
    *   It aggregates the data (e.g., grouping clicks by day, device type, browser) using Python's `collections.defaultdict`.
    *   It stores the heavy aggregated result in **Redis** (e.g., TTL of 5 minutes) so subsequent views are fast.
    *   Returns the data to the frontend, which uses `recharts` to render beautiful graphs.

---

## 📁 File-by-File Detailed Analysis

### Backend (`/backend`)

*   **`backend/.env` & `backend/app/config.py`**
    *   *Purpose:* Configuration management.
    *   *Detail:* `config.py` uses `pydantic-settings` to load environment variables from the `.env` file. It validates the types (ensuring URLs are strings, rate limits are integers) and provides a central `settings` object used throughout the app. This is a best practice for managing secrets (MongoDB URI, Redis URI, Supabase keys) outside of the source code.

*   **`backend/app/main.py`**
    *   *Purpose:* The entry point of the FastAPI application.
    *   *Detail:* 
        *   Initializes the `FastAPI` app instance.
        *   Configures **CORS (Cross-Origin Resource Sharing)** via `CORSMiddleware` to allow the frontend (localhost or deployed domains like Vercel/Render) to communicate with the backend.
        *   Uses an `@asynccontextmanager` called `lifespan` to handle startup and shutdown events (connecting to/disconnecting from MongoDB and Redis) gracefully.
        *   Includes the routers (`analytics_router`, `shorten_router`) to register the API endpoints.

*   **`backend/app/database.py`**
    *   *Purpose:* MongoDB connection manager.
    *   *Detail:* Uses `AsyncIOMotorClient` to connect to MongoDB. It defines `connect_db` and `close_db` functions. Crucially, it creates **database indexes** on startup (e.g., unique index on `code`, indexes on `created_at` and `clicked_at`) to ensure queries remain fast as the database grows.

*   **`backend/app/cache.py`**
    *   *Purpose:* Redis connection and caching/rate-limiting utilities.
    *   *Detail:* 
        *   Manages the async Redis connection pool (`aioredis`).
        *   Provides helper functions: `cache_get`, `cache_set`, `cache_delete` to easily interact with Redis.
        *   Implements a `check_rate_limit` function using Redis to track request counts per IP within a specific time window, protecting the API from spam.

*   **`backend/app/auth.py`**
    *   *Purpose:* Authentication dependency.
    *   *Detail:* Integrates with Supabase. It exposes a `get_current_user` dependency that uses `fastapi.security.HTTPBearer` to extract the JWT from the incoming request header. It then verifies this token against the Supabase client. If valid, it returns the `user_id`; otherwise, it raises a 401 HTTPException.

*   **`backend/app/models.py`**
    *   *Purpose:* Pydantic schemas for data validation.
    *   *Detail:* Defines the structure of expected requests (e.g., `ShortenRequest` expecting a `url` string) and responses. Pydantic automatically validates incoming JSON against these schemas, throwing 422 Unprocessable Entity errors if the data is malformed, ensuring only clean data reaches our route logic.

*   **`backend/app/routes/shorten.py`**
    *   *Purpose:* Endpoints for creating and managing links, and the redirect logic.
    *   *Detail:*
        *   `POST /api/shorten`: Applies rate limiting, verifies auth, generates a unique code, saves to MongoDB, and caches in Redis.
        *   `GET /api/links`: Fetches paginated links for the logged-in user dashboard.
        *   `GET /{code}`: The critical redirect endpoint. Checks Redis first, then MongoDB. If found, triggers the async `record_click` function and returns a `RedirectResponse`.

*   **`backend/app/routes/analytics.py`**
    *   *Purpose:* Endpoints for tracking and retrieving analytics.
    *   *Detail:*
        *   `record_click()`: Parses the User-Agent using the `user_agents` library to extract device/OS/browser info. Inserts the click into MongoDB and increments counters.
        *   `GET /api/analytics/{code}`: Fetches click data for a specific link, aggregates it into time-series and categorical data for charts, and utilizes Redis to cache these expensive aggregation results.
        *   `GET /api/stats`: Provides global stats (total links, total clicks, clicks today) for the main dashboard.

### Frontend (`/frontend`)

*   **`frontend/package.json` & `vite.config.js`**
    *   *Purpose:* Project configuration and dependencies.
    *   *Detail:* Lists dependencies like `react`, `react-router-dom` (routing), `recharts` (charting library), `lucide-react` (icons), and `@supabase/supabase-js` (Supabase client). Configures Vite as the build tool.

*   **`frontend/src/main.jsx` & `frontend/src/App.jsx`**
    *   *Purpose:* Application bootstrapping and routing.
    *   *Detail:* `main.jsx` mounts the React app to the DOM. `App.jsx` sets up the `BrowserRouter`. It includes a `PrivateRoute` component that checks the authentication state (from `AuthContext`) and redirects unauthorized users to the `/login` page. It defines the layout with the `Sidebar` and main content routes (`/`, `/links`, `/analytics/:code`).

*   **`frontend/src/context/AuthContext.jsx`** *(Implicit based on usage)*
    *   *Purpose:* Global state management for authentication.
    *   *Detail:* Uses React Context to wrap the application, providing the current `user` object and authentication methods (login, logout) to any component that needs it, avoiding prop drilling. It listens to Supabase auth state changes.

*   **`frontend/src/api.js`**
    *   *Purpose:* Centralized Axios instance for API calls.
    *   *Detail:* Configures Axios with the backend base URL. It likely includes an interceptor to automatically attach the Supabase JWT token to the `Authorization` header for every outgoing request.

*   **`frontend/src/index.css` & `frontend/src/App.css`**
    *   *Purpose:* Styling.
    *   *Detail:* Contains global CSS variables (CSS Custom Properties) for themes (dark/light mode colors) and general utility classes.

*   **`frontend/src/pages/` (Login.jsx, Home.jsx, Links.jsx, Analytics.jsx)**
    *   *Purpose:* Main view components.
    *   *Detail:*
        *   `Login.jsx`: Handles Supabase authentication UI.
        *   `Home.jsx`: The dashboard showing global stats and the URL shortening form.
        *   `Links.jsx`: A paginated table or list of all links created by the user.
        *   `Analytics.jsx`: The detailed view for a specific link, fetching data from `/api/analytics/{code}` and rendering it using `recharts` components (LineChart, PieChart, etc.).

*   **`frontend/src/components/Sidebar.jsx`**
    *   *Purpose:* Navigation menu.
    *   *Detail:* Contains navigation links using `react-router-dom`'s `<Link>` or `<NavLink>` components to switch between pages without reloading the browser.

---

## 🎯 Summary for Interviews

If asked to summarize this project, you can say:

> "I built a full-stack URL shortening service similar to Bitly. The backend is built with **FastAPI** for high performance and async capabilities. I used **MongoDB** for flexible data storage, especially for the high-volume click analytics data. To ensure the redirect service is blazingly fast and to protect the API with rate limiting, I integrated **Redis**. The frontend is a Single Page Application built with **React** and **Vite**, featuring interactive data visualization using Recharts. Authentication is securely handled via **Supabase**."
