<div align="center">
  <h1>💥 COMIC VIBE 💥</h1>
  <p><strong>An infinite, real-time AI comic book generator.</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)](https://supabase.com/)
  [![Pusher](https://img.shields.io/badge/Pusher-Realtime-blue)](https://pusher.com/)
</div>

<br />

## 📖 What is ComicVibe?

**ComicVibe** is a full-stack, multiplayer AI application. It allows anyone in the world to type a cinematic prompt and instantly generate a high-quality comic book panel using AI.

Once generated, users can choose to **Publish** their panel, instantly saving it to a global database and broadcasting it to every other connected user's screen in real-time. It features a bright, retro "Pop-Art" aesthetic, complete with halftone dotted backgrounds, thick black borders, and massive drop shadows.

## ✨ Key Features

- **🎨 Instant AI Generation:** Powered by lightning-fast AI to turn text prompts into stunning comic art in seconds.
- **⚡ Real-Time Multiplayer Sync:** Uses Pusher WebSockets to instantly broadcast newly published or deleted comics to all active users without refreshing the page.
- **💾 Global Database Vault:** A persistent, infinite-scrolling gallery of community-generated art stored securely in Supabase.
- **📱 PWA & Mobile Ready:** Fully responsive, installable Progressive Web App (PWA) with iOS safe-area configurations and touch-friendly controls.
- **🔍 Full-Screen Lightbox:** High-resolution preview modals for inspecting comic art up close.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js Serverless API Routes
- **Database:** Supabase (PostgreSQL)
- **Real-Time Engine:** Pusher Channels
- **AI Generation:** Pollinations AI 

## 🚀 Getting Started

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sandept/Comic_vibe.git
   cd Comic_vibe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_key
   PUSHER_APP_ID=your_pusher_id
   PUSHER_SECRET=your_pusher_secret
   NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

<div align="center">
  <i>Dream it. Generate it. Publish it.</i>
</div>
