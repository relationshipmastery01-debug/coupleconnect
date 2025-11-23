# CoupleConnect - Complete Deployment Guide

## 📋 Prerequisites
- A Supabase account (free tier works perfectly)
- A Vercel account (free tier works perfectly)
- Node.js installed (for local testing - optional)

---

## 🚀 STEP 1: Create Supabase Project

### 1.1 Create New Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Choose an organization (or create one)
4. Fill in:
   - **Project name**: `coupleconnect` (or your choice)
   - **Database Password**: Create a strong password and SAVE IT
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### 1.2 Get Your Supabase Credentials
1. Once created, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public** key (long string starting with `eyJ...`)

---

## 🗄️ STEP 2: Set Up Database

### 2.1 Run Database Schema
1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the `supabase-schema.sql` file from this project
4. Copy **all** the SQL content
5. Paste into the Supabase SQL editor
6. Click **RUN** (bottom right)
7. Wait for success confirmation (should say "Success. No rows returned")

### 2.2 Verify Tables Created
1. Click **Table Editor** (left sidebar)
2. You should see these tables:
   - profiles
   - relationships
   - messages
   - message_analysis
   - habits
   - events
   - journals
   - insights

---

## 🔑 STEP 3: Create Your Admin Account

### 3.1 Create Admin User
**IMPORTANT: Do this BEFORE deploying to Vercel**

1. In Supabase, go to **SQL Editor**
2. Create a new query with this SQL:
```sql
-- Replace with YOUR email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```
3. Click **RUN**

**Note**: You'll first need to sign up through the app, THEN run this SQL to promote yourself to admin.

---

## 📦 STEP 4: Deploy to Vercel

### 4.1 Push Code to GitHub
1. Initialize git in your project folder:
```bash
git init
git add .
git commit -m "Initial commit - CoupleConnect"
```

2. Create a new repository on GitHub:
   - Go to [https://github.com/new](https://github.com/new)
   - Name it `coupleconnect`
   - Don't initialize with README
   - Click "Create repository"

3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/coupleconnect.git
git branch -M main
git push -u origin main
```

### 4.2 Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository (`coupleconnect`)
4. Configure:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 4.3 Add Environment Variables
In the "Environment Variables" section, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1.2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1.2 |

5. Click **Deploy**
6. Wait 2-3 minutes for deployment to complete

---

## ✅ STEP 5: First Time Setup

### 5.1 Sign Up as Admin
1. Open your deployed Vercel URL (e.g., `https://coupleconnect.vercel.app`)
2. Click "Sign Up"
3. Enter:
   - Full Name: Your name
   - Email: YOUR admin email
   - Password: Strong password
4. Click "Sign Up"

### 5.2 Promote to Admin
1. Go back to Supabase → **SQL Editor**
2. Run this query (replace with YOUR email):
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```
3. Sign out and sign back in
4. You should now see the **Admin Dashboard**

---

## 👥 STEP 6: Add Your First Couple

### 6.1 Create Partner Accounts
1. Have each partner sign up through the app
2. They'll get a message saying "Not yet paired"

### 6.2 Pair the Couple (Admin)
1. Sign in as admin
2. Go to Admin Dashboard
3. Click "**+ Pair Couple**"
4. Select both partners from dropdowns
5. Click "**Create Pair**"
6. The couple can now sign in and see their dashboard!

---

## 🔧 STEP 7: Testing All Features

### Test as a Couple:
1. **Dashboard**: Check that scores show (default 50)
2. **Messages**: 
   - Send a test message
   - Use the emotional interpreter
   - Try sending both original and calm version
3. **Habits**:
   - Click + to complete a habit
   - Verify weekly progress shows
4. **Planner**:
   - Create a test event (e.g., "Date Night")
   - Verify it appears in the list
5. **Journal**:
   - Write a private entry
   - Write a shared entry
   - Verify partner can only see shared entries
6. **Insights**:
   - Click "Refresh Insights"
   - Verify weekly summary generates

### Test as Admin:
1. View all couples
2. View couple details
3. Pair/unpair couples
4. View relationship scores

---

## 🎉 FINAL CHECKLIST

- [ ] Supabase project created
- [ ] Database schema applied successfully
- [ ] Admin account created and promoted
- [ ] App deployed to Vercel
- [ ] Environment variables set correctly
- [ ] Admin can sign in and see Admin Dashboard
- [ ] Created test couple accounts
- [ ] Paired test couple successfully
- [ ] Tested all 7 main features (Dashboard, Messages, Habits, Planner, Journal, Insights)
- [ ] Verified RLS is working (couples can't see other couples' data)

---

## 🐛 Troubleshooting

### "Auth session missing" error
- Check that environment variables are set correctly in Vercel
- Redeploy after adding environment variables

### Tables not showing in Supabase
- Re-run the SQL schema
- Check for SQL errors in the editor

### Can't sign in
- Verify email/password are correct
- Check Supabase **Authentication** → **Users** to see if account exists

### Admin features not showing
- Run the SQL to update role to 'admin'
- Sign out and sign back in

### Couples can see each other's data
- RLS policies may not be applied
- Re-run the RLS section of the schema SQL

---

## 📱 Using the App

### For Couples:
1. Sign in daily to check dashboard
2. Use messages with emotional interpreter for better communication
3. Track weekly habits together
4. Plan quality time in the shared planner
5. Journal your feelings (private or shared)
6. Review weekly insights every Sunday

### For Admin:
1. Pair new couples as they sign up
2. Monitor relationship health scores
3. Export insights for research (feature can be added)
4. Reset passwords if needed

---

## 🔒 Security Notes

- All data is protected by Supabase Row Level Security (RLS)
- Couples can ONLY access their own relationship data
- Admins have full access to all data
- Messages are stored securely in the database
- Journal privacy is enforced by RLS policies

---

## 💰 Cost Breakdown

**This entire stack is FREE:**
- ✅ Supabase Free Tier: 500MB database, 2GB bandwidth, 50,000 auth users
- ✅ Vercel Free Tier: Unlimited deployments, 100GB bandwidth
- ✅ No paid APIs (custom NLP interpreter)

**You can run this for up to ~10-20 couples completely free!**

---

## 🎯 Next Steps (Optional Enhancements)

1. **Email Notifications**: Add Supabase Email templates for reminders
2. **Mobile App**: Convert to React Native or PWA
3. **Advanced Analytics**: Add charts using Chart.js
4. **Gamification**: Add streaks and achievements
5. **AI Integration**: Replace rule-based NLP with OpenAI (paid)
6. **Custom Domain**: Add your own domain in Vercel settings

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs: Dashboard → Logs → All logs
3. Review Vercel deployment logs: Deployments → Click deployment → View logs

---

**Congratulations! Your CoupleConnect app is now live! 🎉**
