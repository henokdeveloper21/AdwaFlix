# 🚀 Deployment Guide for AdwaFlix

Complete guide to deploy your premium streaming platform to production.

## Best Free Deployment Options

### 1. **VERCEL** ⭐ (Recommended - Made for Next.js)

**Pros:**
- Free tier with unlimited bandwidth
- Automatic deployments from Git
- Built-in CI/CD
- Global CDN
- Serverless functions ready
- Perfect for Next.js apps

**Setup:**

```bash
# 1. Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Go to vercel.com
# 3. Sign up with GitHub
# 4. Click "Import Project"
# 5. Select your repository
# 6. Add environment variables:
#    - NEXT_PUBLIC_TMDB_API_KEY
#    - NEXT_PUBLIC_TMDB_BASE_URL
#    - NEXT_PUBLIC_TMDB_IMAGE_BASE_URL
#    - TMDB_READ_ACCESS_TOKEN
# 7. Click Deploy

# Or use CLI:
npm install -g vercel
vercel login
vercel
```

**Custom Domain:**
- In Vercel dashboard
- Go to Settings > Domains
- Add your custom domain
- Update DNS records (provided by Vercel)

---

### 2. **NETLIFY** (Free & Easy)

**Pros:**
- Free hosting with generous bandwidth
- Automatic deployments
- One-click rollbacks
- Free SSL certificate
- Form handling built-in

**Setup:**

```bash
# 1. Push to GitHub/GitLab/Bitbucket
# 2. Go to netlify.com
# 3. Click "New site from Git"
# 4. Select repository
# 5. Build settings:
#    - Build command: npm run build
#    - Publish directory: .next
# 6. Add environment variables
# 7. Deploy

# Or using CLI:
npm install -g netlify-cli
netlify deploy
```

**Important:** Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
```

---

### 3. **RAILWAY.APP** (Modern & Free)

**Pros:**
- $5 monthly free credit
- Easy deployment
- Environment variables UI
- Real-time logs
- Automatic HTTPS

**Setup:**

```bash
# 1. Go to railway.app
# 2. Sign up with GitHub
# 3. Click "New Project"
# 4. Select "Deploy from GitHub repo"
# 5. Select your repository
# 6. Add variables in Dashboard
# 7. Auto-deploys on push

# Via CLI:
npm install -g @railway/cli
railway login
railway init
railway deploy
```

---

### 4. **RENDER** (Generous Free Tier)

**Pros:**
- 100 hours/month free
- Auto-deploys from Git
- PostgreSQL database ready
- Good for full-stack apps

**Setup:**

```bash
# 1. Go to render.com
# 2. Connect GitHub account
# 3. Create "New Web Service"
# 4. Select repository
# 5. Settings:
#    - Build command: npm install && npm run build
#    - Start command: npm start
# 6. Add environment variables
# 7. Deploy
```

---

### 5. **REPLIT** (Educational, Quick Setup)

**Pros:**
- Instant deployment
- Online IDE included
- Collaborative coding
- Good for learning

**Setup:**

```bash
# 1. Go to replit.com
# 2. Click "Import from GitHub"
# 3. Paste your GitHub URL
# 4. Click "Import"
# 5. Set environment variables in Secrets
# 6. Click "Run"
```

---

## Recommended Setup: Vercel + GitHub + Custom Domain

### Step-by-Step:

#### 1. **Prepare GitHub Repository**
```bash
# Initialize git (if not done)
git init

# Add all files
git add .
git commit -m "Initial commit: AdwaFlix streaming platform"

# Create repository on GitHub
# Then:
git remote add origin https://github.com/YOUR_USERNAME/adwaflix.git
git branch -M main
git push -u origin main
```

#### 2. **Deploy to Vercel**
```bash
# Option A: Using Website
# 1. Visit vercel.com
# 2. Click "Log In" > "GitHub"
# 3. Click "Import Project"
# 4. Paste GitHub URL
# 5. Click "Import"

# Option B: Using CLI
npm install -g vercel
vercel
# Follow prompts
```

#### 3. **Configure Environment Variables**
```bash
# In Vercel Dashboard:
# Settings > Environment Variables > Add

# Add these:
NEXT_PUBLIC_TMDB_API_KEY=b7a234077500483b67bcdc90b0de89dc
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
TMDB_READ_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...
NEXT_PUBLIC_APP_NAME=AdwaFlix
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### 4. **Add Custom Domain**
```bash
# Option 1: Free vercel.app domain (automatic)
# Option 2: Custom domain:
# 1. Go to Settings > Domains
# 2. Add your domain (e.g., adwaflix.com)
# 3. Update DNS records:
#    - Type: A Record
#    - Name: @
#    - Value: 76.76.19.165

# Or use CNAME for subdomain:
#    - Type: CNAME
#    - Name: www
#    - Value: cname.vercel-dns.com
```

#### 5. **Enable Analytics (Optional)**
```bash
# In package.json, add:
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "analyze": "ANALYZE=true next build"
}
```

---

## Performance Optimization for Production

### 1. **Build Optimization**
```bash
# Create .vercelignore
node_modules
.env
.env.local
.git
.gitignore
README.md
```

### 2. **Image Optimization**
Already configured in `next.config.js`:
- AVIF format support
- WebP fallback
- Automatic compression

### 3. **Caching Strategy**
```javascript
// next.config.js - Already included
headers: async () => {
  return [
    {
      source: '/images/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### 4. **Compression**
```javascript
// next.config.js
compress: true, // Already enabled
```

---

## Monitoring & Debugging

### Enable Vercel Analytics:
```bash
npm install @vercel/analytics @vercel/web-vitals
```

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout() {
  return (
    <html>
      <body>
        <Analytics />
      </body>
    </html>
  )
}
```

### Check Deployment Status:
- Vercel Dashboard > Deployments
- View logs in real-time
- Roll back to previous version
- Monitor performance metrics

---

## Environment Variables (Production)

**Never commit these to Git!**

```env
# These are ALREADY in .env.local
NEXT_PUBLIC_TMDB_API_KEY=b7a234077500483b67bcdc90b0de89dc
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
TMDB_READ_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Troubleshooting Deployment

### Build Fails
```bash
# Check Node version (must be 16+)
node --version

# Clear cache and rebuild
rm -rf .next
npm run build
```

### Images Not Loading
- Check TMDB API key validity
- Verify image URLs in API responses
- Check Next.js image optimization settings

### Slow Performance
- Check image optimization
- Monitor API calls
- Use Lighthouse for analysis
  - Vercel > Analytics > Web Vitals

### CORS Issues
- TMDB API handles CORS
- Ensure headers are correct in next.config.js

---

## Cost Analysis (Monthly)

| Service | Free Tier | Paid | Best For |
|---------|-----------|------|----------|
| Vercel | Unlimited | $20+ | Production apps |
| Netlify | 100GB/mo | $20+ | Static/Jamstack |
| Railway | $5 credit | Pay-as-you-go | Flexible usage |
| Render | 100 hrs/mo | $0.0005/hour | Learning |

**For AdwaFlix**: Vercel is perfect and 100% free! ✅

---

## Going Further

### Add Your Own Domain
1. Buy domain from Namecheap, GoDaddy, or Google Domains
2. Point to Vercel nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
3. Done! (propagation takes 24-48 hours)

### Enable HTTPS
- Automatic with Vercel ✅
- Free SSL certificate ✅

### Setup CI/CD
- Automatic on every push ✅
- Preview deployments ✅
- Production deployment on main branch ✅

---

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables added
- [ ] Build successful
- [ ] App accessible at vercel URL
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)
- [ ] Tested all pages in production
- [ ] Shared with friends! 🎉

---

## Need Help?

- **Vercel**: vercel.com/support
- **TMDB API**: themoviedb.org/settings/api
- **Next.js**: nextjs.org/docs

Your premium streaming platform is now live! 🚀

