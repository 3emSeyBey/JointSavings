# 💰 Money Mates - Joint Savings Tracker

A beautiful React application for couples to track their joint savings together, powered by Firebase and featuring an AI coach.

## Features

- 👫 **Dual Profiles** - Each partner has their own profile with customizable themes
- 🔐 **PIN Protection** - Optional PIN security for each profile
- 📊 **Real-time Sync** - All data synced via Firebase Firestore
- 🤖 **AI Coach** - Get encouraging financial advice powered by Gemini AI
- 📱 **Responsive Design** - Works beautifully on mobile and desktop

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Backend:** Firebase (Auth + Firestore)
- **AI:** Google Gemini API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Firebase project
- (Optional) Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd JointSavings
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # App Configuration
   VITE_APP_ID=joint-savings-app

   # Gemini AI (recommended for AI coach — direct API, no Functions required)
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

## Project Structure

```
JointSavings/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AICoach.tsx
│   │   ├── Header.tsx
│   │   ├── LoginView.tsx
│   │   ├── Overview.tsx
│   │   ├── Settings.tsx
│   │   ├── TransactionModal.tsx
│   │   └── index.ts
│   ├── config/
│   │   └── firebase.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFirestore.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## AI coach (Gemini)

**Default (no Cloud Functions):** add your Gemini API key to `.env` as **`VITE_GEMINI_API_KEY`**. The app calls the [Gemini API](https://aistudio.google.com/apikey) directly from the browser. You pay only Google’s Gemini usage (free tier may apply), not Firebase Functions.

- Never commit real keys. Add `.env` to git ignore (already listed).

**Optional — server proxy:** if you omit `VITE_GEMINI_API_KEY`, the app can use the **`generateAI`** Cloud Function instead (key stored in Firebase Secret Manager, `firebase deploy --only functions`, secret `GEMINI_API_KEY`, region `us-central1`; set `VITE_FUNCTIONS_REGION` if needed). Use this if you don’t want the key in client bundles.

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Anonymous Authentication**
3. Create a **Firestore Database**
4. Set Firestore rules for your data structure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## License

MIT

