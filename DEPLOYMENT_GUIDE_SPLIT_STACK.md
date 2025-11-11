# ?? LENDA KAHLE - COMPLETE DEPLOYMENT GUIDE

> **One guide for everything** - From development to production in 30 minutes

---

## ?? TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [What You're Deploying](#what-youre-deploying)
3. [Deployment Architecture](#deployment-architecture)
4. [Step-by-Step Deployment](#deployment-steps)
5. [Environment Variables](#environment-variables)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment](#post-deployment)

---

## ? QUICK START

```bash
# 1. Prepare deployment
.\prepare-deployment.ps1

# 2. Deploy (follow sections below):
#    - Database: Supabase (5 min)
#    - Backend: Render.com (10 min)  
#    - Frontend: Vercel (5 min)

# 3. Test
curl https://lendakahle-api.onrender.com/health
```

**Total Time: ~25 minutes**

---

## ?? WHAT YOU'RE DEPLOYING

### Complete Features ?
- **User Management**: Registration, login, JWT auth
- **Loan Calculator**: NCA-compliant, SA validation
- **Loan Applications**: Full workflow with documents
- **Document Upload**: PDF/images up to 30MB
- **Admin Panel**: Approvals, user management, settings
- **Repayments**: Track and process payments
- **Notifications**: Real-time + email
- **Audit Logging**: Complete trail
- **AI Chatbot**: 24/7 support assistant
- **Reports**: PDF/CSV export

### Technology Stack
```
Frontend:  React 18 + TypeScript + Vite + Material-UI
Backend:   .NET 8 + ASP.NET Core + Entity Framework
Database:  PostgreSQL (Supabase)
Deploy:    Vercel + Render.com + Supabase
```

---

## ??? DEPLOYMENT ARCHITECTURE

```
???????????????????????????????????????????????
?            User's Browser                    ?
???????????????????????????????????????????????
                   ? HTTPS
                   ?
???????????????????????????????????????????????
?         Vercel (Frontend - CDN)             ?
?   React App + AI Chatbot                    ?
?   FREE - Global deployment                  ?
???????????????????????????????????????????????
                   ? API Calls
                   ?
???????????????????????????????????????????????
?       Render.com (Backend - Docker)         ?
?   .NET 8 API + Authentication               ?
?   FREE - Sleeps after 15min                 ?
???????????????????????????????????????????????
                   ? PostgreSQL
                   ?
???????????????????????????????????????????????
?        Supabase (Database)                  ?
?   PostgreSQL 15 + Auto-backups              ?
?   FREE - 500MB storage                      ?
???????????????????????????????????????????????
```

**Cost: $0/month** (Perfect for testing/MVP)

---

## ?? DEPLOYMENT STEPS

### STEP 1: Database (Supabase) - 5 minutes

#### 1.1 Create Account
```
1. Visit: https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub
```

#### 1.2 Create Project
```
Project Name: lendakahle
Database Password: [Create strong password - SAVE IT!]
Region: Singapore or Frankfurt (closest to SA)
Pricing: Free tier
```

#### 1.3 Get Connection String
```
1. Go to: Project Settings > Database
2. Find: Connection Pooling
3. Mode: Transaction
4. Copy URI - looks like:
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

#### 1.4 Run Migrations
```bash
# Option A: Via Supabase SQL Editor
1. Go to SQL Editor in Supabase
2. Run your migration scripts

# Option B: Local connection
cd LendaKahleApp.Server
# Update appsettings.json temporarily with Supabase connection
dotnet ef database update
```

? **Database Ready!**

---

### STEP 2: Backend (Render.com) - 10 minutes

#### 2.1 Create Account
```
1. Visit: https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repos
```

#### 2.2 Create Web Service
```
1. Click: New + > Web Service
2. Connect: Your GitHub repository
3. Select: LendaKahleApp repository
```

#### 2.3 Configure Service
```yaml
Name: lendakahle-api
Region: Oregon (US West) - Free tier
Branch: main
Root Directory: (leave empty)
Environment: Docker
Dockerfile Path: ./Dockerfile
Instance Type: Free
```

#### 2.4 Add Environment Variables

Click "Advanced" then add these:

```bash
# Core Settings
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# Database (from Supabase)
ConnectionStrings__DefaultConnection=postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres

# JWT Settings
Jwt__Key=[GENERATE-64-CHAR-STRING]
Jwt__Issuer=https://lendakahle-api.onrender.com
Jwt__Audience=https://lendakahle.vercel.app

# CORS
CORS__AllowedOrigins=https://lendakahle.vercel.app,http://localhost:5173
```

**Generate JWT Key:**
```powershell
# Run in PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

#### 2.5 Deploy
```
1. Click "Create Web Service"
2. Wait ~5-10 minutes for build
3. Watch logs for "Application started"
```

#### 2.6 Test Backend
```bash
# Health check
curl https://lendakahle-api.onrender.com/health

# Expected response:
{
  "status": "Healthy",
  "timestamp": "2024-...",
  "service": "Lenda Kahle API"
}
```

? **Backend Deployed!**

---

### STEP 3: Frontend (Vercel) - 5 minutes

#### 3.1 Create Account
```
1. Visit: https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel
```

#### 3.2 Import Project
```
1. Click: Add New... > Project
2. Import: Your GitHub repository
3. Select: LendaKahleApp
```

#### 3.3 Configure Build
```yaml
Framework Preset: Vite
Root Directory: lendakahleapp.client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 3.4 Add Environment Variable
```bash
Name: VITE_API_URL
Value: https://lendakahle-api.onrender.com
```

#### 3.5 Deploy
```
1. Click "Deploy"
2. Wait ~3 minutes
3. Get your URL: https://lendakahle.vercel.app
```

#### 3.6 Update Backend CORS
```
Go back to Render.com:
1. Your service > Environment
2. Update: CORS__AllowedOrigins
3. Value: https://lendakahle.vercel.app,http://localhost:5173
4. Update: Jwt__Audience  
5. Value: https://lendakahle.vercel.app
6. Save Changes (triggers redeploy)
```

? **Frontend Deployed!**

---

## ?? ENVIRONMENT VARIABLES REFERENCE

### Backend (Render.com)
```bash
# Required
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=[SUPABASE_URI]
Jwt__Key=[64_CHAR_SECRET]
Jwt__Issuer=https://lendakahle-api.onrender.com
Jwt__Audience=https://lendakahle.vercel.app
CORS__AllowedOrigins=https://lendakahle.vercel.app

# Optional (for email notifications)
Email__SmtpHost=smtp.gmail.com
Email__SmtpPort=587
Email__Username=[YOUR_EMAIL]
Email__Password=[APP_PASSWORD]
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://lendakahle-api.onrender.com
```

---

## ?? TESTING

### 1. Health Check
```bash
curl https://lendakahle-api.onrender.com/health
# Should return: {"status":"Healthy"}
```

### 2. Frontend Load Test
```
Visit: https://lendakahle.vercel.app
- Homepage loads ?
- Calculator works ?
- Chatbot opens ?
```

### 3. Full Integration Test
```
1. Register new user ?
2. Login ?
3. Use calculator ?
4. Apply for loan ?
5. Upload documents ?
6. Chat with AI bot ?
7. Admin login:
   Email: admin@lendakahle.co.za
   Password: Admin123!
8. Approve loan ?
9. Make repayment ?
```

### 4. Performance Test
```
First request (cold start): 20-30 seconds
Subsequent requests: 200-500ms
After 15min idle: Sleeps (normal on free tier)
```

---

## ?? TROUBLESHOOTING

### Backend won't start
```bash
Problem: Service fails to start
Solutions:
1. Check Render logs: Dashboard > Logs
2. Verify all env variables set
3. Check database connection string
4. Ensure Dockerfile exists
5. Redeploy: Manual Deploy > Deploy latest
```

### Frontend can't connect
```bash
Problem: "Failed to fetch" errors
Solutions:
1. Check browser console for errors
2. Verify VITE_API_URL in Vercel settings
3. Check CORS__AllowedOrigins in Render
4. Hard refresh: Ctrl+Shift+R
5. Clear browser cache
```

### Database connection failed
```bash
Problem: "Could not connect to database"
Solutions:
1. Check Supabase is active
2. Verify connection string format
3. Use Transaction pooling mode
4. Check IP allowlist (should be 0.0.0.0/0 for Render)
5. Test connection in Supabase SQL editor
```

### CORS errors
```bash
Problem: Cross-origin errors in console
Solutions:
1. Backend CORS must include frontend URL
2. No trailing slashes in URLs
3. Must include http://localhost:5173 for dev
4. Redeploy backend after CORS changes
```

### Slow first request
```bash
This is NORMAL on free tier:
- Render sleeps after 15min inactivity
- First request wakes it (~30 sec)
- Then fast until next sleep

Solutions:
1. Keep-alive ping service (free tools)
2. Upgrade to paid tier ($7/mo = no sleep)
3. Accept for testing/demo phase
```

---

## ?? POST-DEPLOYMENT

### Monitor Your App

#### Render (Backend)
```
Dashboard > Your Service:
- Logs: Real-time request logs
- Metrics: CPU, memory usage
- Events: Deploy history
```

#### Vercel (Frontend)
```
Dashboard > Your Project:
- Deployments: Build history
- Analytics: Traffic stats
- Logs: Function logs
```

#### Supabase (Database)
```
Dashboard > Your Project:
- Table Editor: View/edit data
- SQL Editor: Run queries
- Database: Usage stats
```

### Regular Maintenance

**Daily:**
- Check health endpoint
- Review error logs
- Monitor uptime

**Weekly:**
- Review analytics
- Check database size
- Update dependencies

**Monthly:**
- Backup database (auto on Supabase)
- Review performance
- Plan feature updates

### When to Upgrade

**Render ($7/month):**
- > 100 active users
- Need instant response
- Professional use case

**Supabase ($25/month):**
- > 500MB database
- Need more backups
- > 1000 active users

**Vercel:**
- Free tier is usually enough
- Upgrade only if > 100GB bandwidth

---

## ?? SUCCESS!

### Your Live URLs
```
Frontend:  https://lendakahle.vercel.app
Backend:   https://lendakahle-api.onrender.com  
Health:    https://lendakahle-api.onrender.com/health
Database:  [Supabase Dashboard]

Admin Login:
Email:     admin@lendakahle.co.za
Password:  Admin123!
```

### What You Achieved
? Full-stack app deployed
? $0/month hosting cost
? Professional architecture
? NCA-compliant system
? AI-powered support
? Production-ready platform

---

## ?? SUPPORT

### Documentation
- **This Guide**: Complete reference
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs

### Status Pages
- **Render**: https://status.render.com
- **Vercel**: https://www.vercelstatus.com
- **Supabase**: https://status.supabase.com

### Community
- **Render Discord**: https://render.com/community
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://supabase.com/discord

---

## ?? NEXT STEPS

### Immediate (Now)
1. ? Share app URL with users
2. ? Test all features thoroughly
3. ? Monitor logs first 24 hours

### Short-term (This Week)
1. Gather user feedback
2. Fix any issues
3. Add custom domain (optional)
4. Set up monitoring alerts

### Long-term (This Month)
1. Analyze usage patterns
2. Plan feature additions
3. Consider paid upgrades if needed
4. Marketing and user acquisition

---

## ???? SIYABONGA!

**Congratulations!** You've successfully deployed **Lenda Kahle** - a complete, professional, NCA-compliant micro-lending platform for South Africa!

### What You Built:
- ? User authentication & management
- ? Loan calculator & applications  
- ? Document upload system
- ? Admin approval workflow
- ? Repayment tracking
- ? Real-time notifications
- ? Audit logging
- ? AI chatbot support
- ? Professional Zulu design
- ? $0/month hosting

**Your app is live and ready to help South Africans access fair lending!** ??

---

**End of Guide** | Last Updated: 2024 | Lenda Kahle v1.0
