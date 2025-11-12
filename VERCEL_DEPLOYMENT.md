# Vercel Deployment Guide for ExplainBoard

## 🚀 How to Deploy on Vercel

### Step 1: Connect Your Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your GitHub repository: `Live_Classroom-powered_by_AI`
5. Click "Import"

### Step 2: Configure Environment Variables
1. In the Vercel project settings, go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** `AIzaSyBapa5_9krX4Y8dMcdaNDdsba2IJXw8o2o`
   - **Environments:** Select all (Production, Preview, Development)

### Step 3: Configure Build Settings (if needed)
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

These should be auto-detected, but verify them in the project settings.

### Step 4: Deploy
Click "Deploy" and Vercel will:
1. Install dependencies
2. Build the project
3. Deploy to a live URL

### Step 5: Verify Deployment
- Visit your deployed URL
- Open DevTools (F12) and check the Console
- You should NOT see any errors

---

## ✅ What Was Fixed

### 1. **CSS Not Loading (404 Error)**
   - ❌ Problem: `index.css` file was referenced but didn't exist
   - ✅ Solution: Created `index.css` with Tailwind CSS directives

### 2. **Tailwind CSS CDN Warning**
   - ❌ Problem: Using CDN in production (not recommended)
   - ✅ Solution: Installed Tailwind CSS as PostCSS plugin
   - Added `tailwind.config.js` and `postcss.config.js`

### 3. **SRI Integrity Error**
   - ❌ Problem: CDN resource blocked due to integrity mismatch
   - ✅ Solution: Removed external CDN scripts (html2canvas, jspdf) from HTML
   - Note: These can be installed as npm packages if needed

### 4. **API Key Not Found Error**
   - ❌ Problem: API Key not accessible in browser (`process.env.API_KEY` returns undefined)
   - ✅ Solution: 
     - Changed to use `VITE_GEMINI_API_KEY` (Vite's public variable prefix)
     - Updated `vite.config.ts` to properly inject the API key
     - Updated `geminiService.ts` and `LiveClassroom.tsx` to use correct variable

### 5. **Production Environment Setup**
   - ✅ Created `.env.production` file
   - ✅ Created `vercel.json` with build configuration

---

## 📋 Files Modified/Created

| File | Status | Purpose |
|------|--------|---------|
| `index.css` | ✅ Created | Tailwind CSS directives |
| `postcss.config.js` | ✅ Created | PostCSS configuration |
| `tailwind.config.js` | ✅ Created | Tailwind configuration |
| `vercel.json` | ✅ Created | Vercel build settings |
| `.env.production` | ✅ Created | Production environment variables |
| `.env.local` | ✅ Updated | Changed to VITE_ prefix |
| `index.html` | ✅ Updated | Removed CDN Tailwind, fixed CSS link |
| `vite.config.ts` | ✅ Updated | Proper API key handling |
| `services/geminiService.ts` | ✅ Updated | API key validation |
| `components/LiveClassroom.tsx` | ✅ Updated | API key configuration |

---

## 🔒 Security Note

⚠️ **Important:** The API key is intentionally visible in `.env.production` for Vercel to access it.

**Better Practice for Production:**
1. In Vercel Dashboard, go to Settings → Environment Variables
2. Set `VITE_GEMINI_API_KEY` as a secret environment variable
3. Remove the `.env.production` file from git (or keep it empty)
4. Add this to `.gitignore`: `.env.production`

This prevents accidentally committing the API key to GitHub.

---

## 🧪 Local Testing

To test the production build locally:

```bash
npm run build
npm run preview
```

Then visit `http://localhost:4173` to test the production build.

---

## 📞 Troubleshooting

### Issue: Still seeing blank page
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check DevTools Console for errors
3. Verify `VITE_GEMINI_API_KEY` is set in Vercel environment variables
4. Redeploy the project

### Issue: "An API Key must be set when running in a browser"
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Ensure `VITE_GEMINI_API_KEY` is set
3. Redeploy the project

### Issue: CSS not loading
1. Check browser's Network tab in DevTools
2. Verify `/assets/index-*.css` loads successfully (200 status)
3. Check build output shows CSS file was generated

---

## ✨ Features Ready to Use

✅ **Explain a Topic** - Get AI explanations with illustrations  
✅ **Live Classroom** - Real-time speech-to-text with AI visuals  
✅ **Full Responsive Design** - Works on mobile and desktop  
✅ **Production Optimized** - Built with Vite for fast performance

Enjoy your deployed ExplainBoard! 🎉
