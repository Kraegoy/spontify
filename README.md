# 🎵 Spotify Insights Studio

> A full-stack web application that transforms your Spotify listening data into beautiful dashboards, AI-powered playlists, and personalized music insights.

---

## STILL IN DEVELOPMENT MODE! NOT YET COMPLETE
## 📖 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Explained](#2-tech-stack-explained)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Spotify Developer Setup](#5-spotify-developer-setup)
6. [Environment Variables](#6-environment-variables)
7. [Project Structure](#7-project-structure)
8. [API Endpoints](#8-api-endpoints)
9. [React Components](#9-react-components)
10. [Running the App](#10-running-the-app)
11. [Common Errors & Fixes](#11-common-errors--fixes)
12. [Security Notes](#12-security-notes)

---

## 1. Project Overview

### What Does This App Do?

**Spotify Insights Studio** connects to your Spotify account and does incredible things with your music data. Think of it like a super-powered version of Spotify Wrapped — but available all year round, and with AI features built in.

Here's what you can do inside the app:

- **📊 Analytics Dashboard** — See your top artists, tracks, genres, and listening patterns visualized in charts.
- **🏋️ AI Gym Playlist Builder** — Describe your workout vibe and the app builds the perfect playlist for you automatically.
- **🧠 Music Personality Analyzer** — Based on what you listen to, the app figures out your music personality type.
- **🎁 Spotify Wrapped Clone** — Get your personal Wrapped summary any time of year, not just in December.
- **☕ Café Mood Scheduler** — A tool for café owners to automatically schedule music based on the mood and time of day.
- **🎚️ Playlist BPM Optimizer** — Reorders your playlists so the tempo (beats per minute) flows naturally, like a DJ set.

### What Spotify Data Do We Use?

The app uses data that Spotify makes available through their official API (we'll explain what an API is shortly). This includes:

- Your top tracks and artists (short, medium, and long term)
- Your recently played songs
- Audio features of songs — things like BPM, energy, danceability, and mood
- Your playlists and the tracks inside them
- Your listening history

### What Is OAuth? (The "Permission Slip" Idea)

Imagine you want to borrow your friend's bicycle. You don't just take it — you ask them first, and they say "yes, you can use it for one hour." That's basically what **OAuth** does, but digitally.

When you click **"Login with Spotify"**, the app sends you to Spotify's website and says: *"Hey Spotify, this user wants to share their music data with us. Is that okay?"* Spotify shows you a list of exactly what data will be shared. If you say yes, Spotify gives the app a special temporary pass (called a **token**) to access your data.

The app never sees your Spotify password. It only gets what you specifically approved.

### Privacy Clarification

This app **only** accesses data for the user who is currently logged in. It does not collect, store, or share your Spotify data with anyone else. Your data is used only to generate your personal insights within the app.

---

## 2. Tech Stack Explained

Before you set anything up, let's understand the tools we're using. Don't worry — we'll keep it simple.

### 🐍 What Is Django?

Django is a web framework built in Python. A **framework** is like a toolkit — instead of building everything from scratch, Django gives you pre-built tools to handle common tasks like connecting to a database, handling logins, and responding to web requests.

Think of Django as the **kitchen** of a restaurant. The user never sees the kitchen, but it's where all the real work happens.

### 🔌 What Is Django REST Framework (DRF)?

Django REST Framework is a plugin that sits on top of Django and makes it really easy to build **APIs**. Without it, building an API would take a lot more code.

### 🛜 What Is an API?

**API** stands for *Application Programming Interface*. That's a mouthful, but here's the simple version:

An API is like a **waiter** in a restaurant. You (the frontend) tell the waiter what you want. The waiter goes to the kitchen (the backend/Django), picks up your order, and brings it back to you. You never go into the kitchen yourself.

When the React frontend needs your Spotify data, it doesn't go fetch it directly — it asks the Django API, which does the work and sends the data back.

### ⚛️ What Is React?

React is a JavaScript library for building user interfaces — basically, what you see and click on in your browser. It was created by Facebook and is used by thousands of companies.

Think of React as the **face** of the restaurant — the dining room, the menu, the décor. It's everything the user interacts with.

### 🧩 What Is a Component?

In React, a **component** is a reusable piece of the interface. Think of components like LEGO bricks. Each brick (component) does one specific thing, and you snap them together to build the whole page.

For example, a `LoginButton` component is just the login button. A `Dashboard` component is the whole analytics page. You can reuse and combine them however you like.

### 🔐 What Is OAuth?

We mentioned this above, but quickly: **OAuth** is a secure way for users to give an app limited access to their account on another service (like Spotify) without sharing their password.

### 🛡️ Why Does the Backend Handle Secrets, Not the Frontend?

This is really important. Your **Spotify Client Secret** is like a master password for your app. If you put it in the React frontend, anyone who opens the browser's developer tools could see it and steal it.

The Django backend runs on a server that users can't directly inspect. So we keep all secrets there, safely hidden. The frontend only ever talks to our own Django API — it never talks to Spotify directly.

---

## 3. Backend Setup

> **Assumption:** Your virtual environment (venv) is already created and activated. You should see `(venv)` at the start of your terminal prompt.

### Step 1 — Install Dependencies

```bash
pip install -r requirements.txt
```

**What does this do?**
This reads the `requirements.txt` file, which is like a shopping list of all the Python packages the backend needs. Pip (Python's package installer) downloads and installs all of them automatically.

**Why are we doing this?**
The project depends on many external libraries — Django, Django REST Framework, a Spotify API helper library, and more. Without installing them, the backend won't run at all.

---

### Step 2 — Create Your `.env` File

In the `backend/` folder, create a new file called `.env`:

```bash
touch backend/.env
```

Then open it and add the following content:

```env
# Django Settings
DJANGO_SECRET_KEY=your-very-long-random-secret-key-here
DEBUG=True

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/spotify/callback

# Frontend
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Important:** Never share this file with anyone or upload it to GitHub. It contains sensitive credentials. We'll explain more in the [Security Notes](#12-security-notes) section.

**Why are we doing this?**
Environment variables let us store sensitive settings (like passwords and API keys) outside of our code. If we put them directly in the code, they'd be visible to anyone who reads the source files.

---

### Step 3 — Run Database Migrations

```bash
cd backend
python manage.py migrate
```

**What does this do?**
Django uses a database to store information (like user sessions and tokens). Migrations are instructions that tell the database what tables and columns to create. Running this command sets up your database structure for the first time.

**Why are we doing this?**
Without this step, the app won't have anywhere to store user data and will crash immediately.

---

### Step 4 — Start the Django Development Server

```bash
python manage.py runserver
```

**What does this do?**
This starts a local web server on your computer. You'll see output like:

```
Starting development server at http://127.0.0.1:8000/
```

Your Django API is now running and ready to receive requests.

**Why are we doing this?**
The backend needs to be running so the React frontend can send requests to it and get data back.

---

## 4. Frontend Setup

Open a **new terminal window** (keep your Django server running in the first one).

### Step 1 — Navigate to the Frontend Folder

```bash
cd frontend
```

### Step 2 — Install Dependencies

```bash
npm install
```

**What does this do?**
Just like `pip install` for Python, `npm install` reads the `package.json` file (the JavaScript version of a shopping list) and downloads all the JavaScript packages the React app needs.

**Why are we doing this?**
React projects rely on dozens of external packages — things like routing libraries, chart tools, and styling frameworks. This one command installs all of them into a `node_modules/` folder.

---

### Step 3 — Start the React Development Server

```bash
npm start
```

**What does this do?**
This starts a local development server for your React app. Your browser will automatically open to:

```
http://localhost:3000
```

You'll see the app running live! Any changes you make to the code will instantly refresh in the browser — no need to restart anything.

**Why are we doing this?**
The React app needs its own server to run during development. It serves your JavaScript, HTML, and CSS to the browser.

---

## 5. Spotify Developer Setup

This is one of the most important steps. Take your time here.

### Step 1 — Create a Spotify Developer Account

1. Go to [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in with your regular Spotify account
3. Accept the Terms of Service if prompted

---

### Step 2 — Create a New App

1. Click **"Create App"**
2. Fill in the form:
   - **App Name:** `Spotify Insights Studio` (or anything you like)
   - **App Description:** A brief description of your project
   - **Redirect URI:** `http://localhost:8000/api/auth/spotify/callback`
   - **APIs used:** Select *Web API*
3. Click **Save**

> **What is a Redirect URI?** After the user logs in with Spotify and grants permission, Spotify needs to know where to send them back. The Redirect URI is that "return address." It must match **exactly** what you put in your `.env` file — even a tiny difference will cause an error.

---

### Step 3 — Find Your Client ID and Secret

1. After creating the app, you'll see your **App Dashboard**
2. Click **"Settings"**
3. You'll see:
   - **Client ID** — a long string of letters and numbers (safe to share, but treat it carefully)
   - **Client Secret** — click "View Client Secret" to reveal it (**never share this with anyone**)

Copy both values and paste them into your `.env` file.

---

### Step 4 — The OAuth Flow, Step by Step

Here's exactly what happens when a user clicks "Login with Spotify":

```
1. USER CLICKS LOGIN
   └─ The React frontend sends the user to Django's /api/auth/spotify/login endpoint

2. DJANGO BUILDS THE PERMISSION URL
   └─ Django creates a special Spotify URL that includes your Client ID
      and a list of "scopes" (permissions you're requesting)

3. USER IS REDIRECTED TO SPOTIFY
   └─ The user sees Spotify's official login + permission page
   └─ Spotify asks: "Allow Spotify Insights Studio to access your data?"

4. USER APPROVES
   └─ Spotify redirects the user back to your Redirect URI:
      http://localhost:8000/api/auth/spotify/callback?code=XXXX
   └─ It includes a one-time "authorization code" in the URL

5. DJANGO EXCHANGES THE CODE FOR A TOKEN
   └─ Django takes that code and sends it to Spotify's server
      along with the Client ID and Client Secret
   └─ Spotify verifies everything and returns an "access token"
      (and a "refresh token" for later)

6. DJANGO STORES THE TOKEN & LOGS THE USER IN
   └─ Django saves the token securely in the database
   └─ The user is now logged in and Django redirects them to the React frontend

7. REACT FRONTEND MAKES API REQUESTS
   └─ Now whenever the frontend needs Spotify data, it asks Django
   └─ Django uses the stored token to call Spotify's API on the user's behalf
```

**Why does Django handle all of this instead of React?**
Because step 5 requires the **Client Secret**, which must never be exposed in a browser. Django runs on a server that users can't inspect.

---

## 6. Environment Variables

Here's a clear reference table for every variable in your `.env` file:

| Variable | Example Value | What It Means |
|---|---|---|
| `DJANGO_SECRET_KEY` | `s3cr3t-k3y-abc123...` | A long random string Django uses to encrypt sessions and cookies. Generate a new one for every project. Never reuse it. |
| `DEBUG` | `True` | When `True`, Django shows detailed error pages (helpful for development). Set to `False` in production. |
| `SPOTIFY_CLIENT_ID` | `a1b2c3d4e5f6...` | Your app's public identifier on Spotify's platform. Obtained from your Spotify Developer Dashboard. |
| `SPOTIFY_CLIENT_SECRET` | `z9y8x7w6v5u4...` | Your app's private password for Spotify. **Never share this. Never put it in frontend code.** |
| `SPOTIFY_REDIRECT_URI` | `http://localhost:8000/api/auth/spotify/callback` | The URL Spotify will send users back to after they log in. Must match exactly what's set in your Spotify Developer Dashboard. |
| `FRONTEND_URL` | `http://localhost:3000` | The URL of your React app. Django uses this to know where to redirect users after login, and to configure CORS (explained later). |

> **Tip:** To generate a strong `DJANGO_SECRET_KEY`, run this in your terminal:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

---

## 7. Project Structure

Here's how the project is organized:

```
spotify-insights-studio/
│
├── backend/                    # 🧠 The Brain — Django REST API
│   ├── manage.py               # Django's command-line tool
│   ├── requirements.txt        # Python package list
│   ├── .env                    # Secret credentials (NOT in git)
│   │
│   ├── core/                   # Django project settings
│   │   ├── settings.py         # Main configuration file
│   │   ├── urls.py             # URL routing (like a switchboard)
│   │   └── wsgi.py             # Entry point for production servers
│   │
│   ├── auth_spotify/           # Handles Spotify login & tokens
│   │   ├── views.py            # Login, callback, token logic
│   │   └── urls.py             # Auth-related URL routes
│   │
│   ├── insights/               # Analytics & data processing
│   │   ├── views.py            # Endpoint logic for dashboards
│   │   └── spotify_client.py   # Helper functions for Spotify API calls
│   │
│   ├── playlists/              # Gym, BPM optimizer, café scheduler
│   │   └── views.py
│   │
│   └── wrapped/                # Spotify Wrapped clone logic
│       └── views.py
│
├── frontend/                   # 🎨 The Face — React Application
│   ├── package.json            # JavaScript package list
│   ├── public/                 # Static files (HTML template, favicon)
│   │
│   └── src/
│       ├── App.jsx             # Root component — ties everything together
│       ├── index.js            # Entry point for React
│       │
│       ├── components/         # Reusable UI building blocks
│       │   ├── LoginButton.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Wrapped.jsx
│       │   ├── GymPlaylistBuilder.jsx
│       │   ├── CafeScheduler.jsx
│       │   ├── PlaylistOptimizer.jsx
│       │   └── PersonalityAnalyzer.jsx
│       │
│       ├── api/                # Functions that call the Django API
│       │   └── spotifyApi.js
│       │
│       └── styles/             # CSS and styling files
│
└── README.md                   # You are here 📍
```

**The Simple Version:**
- **`backend/`** = The kitchen. Users never see it, but it does all the cooking (data processing, API calls, database).
- **`frontend/`** = The dining room. This is what users see and interact with.
- **`.env`** = The safe. Keeps all the secret credentials locked away.

---

## 8. API Endpoints

### What Is an Endpoint?

An **endpoint** is a specific URL that your API responds to. Think of it like a phone extension at a company. Calling the main number gets you to reception, but dialing extension 204 connects you directly to the accounting department.

When the React frontend needs something specific, it "calls" the right endpoint.

### Endpoint Reference

| Endpoint | Method | What It Does |
|---|---|---|
| `/api/auth/spotify/login` | `GET` | Redirects the user to Spotify's login page to begin the OAuth flow |
| `/api/auth/spotify/callback` | `GET` | Receives the authorization code from Spotify after the user approves access |
| `/api/me` | `GET` | Returns the currently logged-in user's Spotify profile information |
| `/api/insights/summary` | `GET` | Returns top tracks, artists, genres, and listening stats for the dashboard |
| `/api/wrapped` | `GET` | Generates a full Spotify Wrapped summary for the logged-in user |
| `/api/playlists/gym` | `POST` | Accepts workout preferences and returns an AI-built gym playlist |
| `/api/playlists/optimize` | `POST` | Takes a playlist ID and returns a BPM-optimized track order |
| `/api/cafe/schedule` | `GET` | Returns a mood-based music schedule for cafés based on time of day |

> All endpoints require the user to be authenticated (logged in). Unauthenticated requests will receive a `401 Unauthorized` response.

---

## 9. React Components

### Key Concepts First

Before we list the components, let's understand a few React ideas:

**🧩 What Is a Component?**
A component is a reusable piece of UI. It's like a custom HTML tag you define yourself. `<Dashboard />` renders the whole analytics page. `<LoginButton />` renders just the button.

**📦 What Are Props?**
Props (short for "properties") are how you pass information *into* a component. Like giving instructions to someone. For example: `<LoginButton label="Connect with Spotify" />`. The component receives `label` as a prop.

**🧠 What Is State?**
State is a component's internal memory. If the user clicks a button and the page changes, that change is tracked in "state." When state updates, React automatically re-renders the component with the new information.

**⏰ What Is `useEffect`?**
`useEffect` is a React tool (called a "hook") that lets you run code at specific moments — like when a component first appears on screen. It's commonly used to fetch data from the API when a page loads.

---

### Component Reference

| Component | What It Does |
|---|---|
| `App.jsx` | The root component. Controls routing (which page to show) and wraps everything else. |
| `LoginButton.jsx` | Renders the "Login with Spotify" button. When clicked, redirects to `/api/auth/spotify/login`. |
| `Dashboard.jsx` | The main analytics page. Uses `useEffect` to fetch data when it loads, then displays charts and stats. |
| `Wrapped.jsx` | Shows the personalized Spotify Wrapped summary with animations and your year-in-review stats. |
| `GymPlaylistBuilder.jsx` | A form where users describe their workout. Sends preferences to the backend and displays the AI-generated playlist. |
| `CafeScheduler.jsx` | Shows a visual timeline of mood-based music for different times of day. Useful for café owners. |
| `PlaylistOptimizer.jsx` | Lets users pick one of their playlists and get back a BPM-optimized version with smooth energy flow. |
| `PersonalityAnalyzer.jsx` | Displays the user's music personality type based on their listening data, with a fun visual breakdown. |

---

## 10. Running the App

You need **two terminal windows** open at the same time — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend

```bash
cd backend
python manage.py runserver
```

The Django API will be available at: `http://localhost:8000`

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm start
```

The React app will be available at: `http://localhost:3000`

Your browser should open automatically. If not, manually navigate to `http://localhost:3000`.

---

### 🌐 What Ports Are These?

A **port** is like a door on your computer. Different programs use different doors so they don't get in each other's way.

- Port `8000` → Django (the backend API)
- Port `3000` → React (the frontend)

---

### 🔗 What Is CORS and Why Do We Need It?

**CORS** stands for *Cross-Origin Resource Sharing*. Here's the problem it solves:

By default, browsers block JavaScript on one website from fetching data from a *different* website. Your React app runs on `localhost:3000` and tries to fetch from `localhost:8000` — that's two different "origins."

Without CORS configuration, the browser would block these requests with an error.

The Django backend uses a package called `django-cors-headers` to explicitly say: *"It's okay for requests coming from `localhost:3000` to access this API."* This is configured in `settings.py` using the `FRONTEND_URL` environment variable.

**Why are we doing this?**
Because browser security policies exist to protect users. CORS lets us selectively allow our own frontend to talk to our own backend, without opening it up to the entire internet.

---

## 11. Common Errors & Fixes

### ❌ CORS Error

**What you see in the browser console:**
```
Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS policy
```

**What it means:** The browser is blocking the request because Django hasn't allowed requests from `localhost:3000`.

**How to fix it:**
1. Make sure `django-cors-headers` is installed (`pip install django-cors-headers`)
2. Check that `corsheaders` is in `INSTALLED_APPS` in `settings.py`
3. Check that `FRONTEND_URL=http://localhost:3000` is correctly set in your `.env`
4. Restart the Django server after making changes

---

### ❌ Redirect URI Mismatch

**What you see:**
```
INVALID_CLIENT: Invalid redirect URI
```

**What it means:** The redirect URI in your code doesn't exactly match the one you registered in the Spotify Developer Dashboard.

**How to fix it:**
1. Go to your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Open your app → Settings
3. Make sure the Redirect URI listed there is **exactly**:
   ```
   http://localhost:8000/api/auth/spotify/callback
   ```
4. Make sure your `.env` has the exact same value for `SPOTIFY_REDIRECT_URI`
5. Even a trailing slash difference will cause this error — be precise

---

### ❌ 401 Unauthorized

**What you see:**
```
{"detail": "Authentication credentials were not provided."}
```

**What it means:** The request is hitting an endpoint that requires login, but the user isn't logged in (or the session has expired).

**How to fix it:**
1. Make sure the user has completed the Spotify login flow
2. Check that your session cookies are being sent with requests (look for `credentials: 'include'` in your fetch calls)
3. Try logging out and logging back in

---

### ❌ Token Expired

**What you see:**
A `401` error from Spotify, or a response like:
```
{"error": {"status": 401, "message": "The access token expired"}}
```

**What it means:** Spotify access tokens only last for 1 hour. After that, the backend needs to use the **refresh token** to get a new one.

**How to fix it:**
1. Make sure your backend has refresh token logic implemented in `auth_spotify/views.py`
2. If you're testing and don't have refresh logic yet, simply log out and log back in to get a fresh token

---

### ❌ Invalid Client

**What you see:**
```
{"error": "invalid_client"}
```

**What it means:** Your Client ID or Client Secret is wrong or missing.

**How to fix it:**
1. Double-check your `.env` file — make sure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
2. Go back to your Spotify Developer Dashboard and copy-paste them again (no extra spaces!)
3. Make sure your `.env` file is in the `backend/` folder
4. Restart the Django server after updating `.env`

---

## 12. Security Notes

These aren't optional — they're essential for keeping your app and your users safe.

### 🔒 Never Expose Your Client Secret in the Frontend

Your `SPOTIFY_CLIENT_SECRET` lives in `backend/.env` and never leaves the server. It should never appear in:
- Any React component or JavaScript file
- Any frontend API call
- Any URL in the browser

If someone finds your Client Secret, they can impersonate your app and abuse Spotify's API with your credentials.

### 🔒 Always Handle OAuth in the Backend

The full OAuth flow — including the code-for-token exchange — must happen in Django. The React frontend only initiates the login by redirecting the user. It never directly communicates with Spotify's OAuth endpoints.

### 🔒 Keep `.env` Out of Git

Your `.gitignore` file should include `.env` so it's never accidentally committed to GitHub. Verify this before your first commit:

```
# This should already be in your .gitignore:
.env
*.env
```

If you ever accidentally commit a secret to GitHub, treat it as compromised immediately — go to your Spotify Developer Dashboard and regenerate your Client Secret.

### 🔒 Use Refresh Tokens Properly

Spotify access tokens expire after 1 hour. When that happens, your backend should automatically use the stored **refresh token** to get a new access token — without asking the user to log in again. Refresh tokens should be stored securely in the database (not in localStorage or cookies accessible to JavaScript).

### 🔒 Set DEBUG=False in Production

When you deploy this app to a real server (not your local machine), always set `DEBUG=False` in your `.env`. In debug mode, Django can accidentally expose sensitive settings and full error tracebacks to anyone who triggers an error.

---

## 🎉 You're All Set!

If you've followed every step, your Spotify Insights Studio should be running locally with:

- Django API at `http://localhost:8000`
- React app at `http://localhost:3000`
- Full Spotify OAuth working end-to-end

Click **"Login with Spotify"** in the browser, approve the permissions, and start exploring your music data!

---

*Built with ❤️ using Django REST Framework, React, and the Spotify Web API.*