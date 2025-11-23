# CoupleConnect - Deployment Checklist

Use this checklist to verify your deployment is complete and working.

---

## ✅ PRE-DEPLOYMENT

### Codebase Review
- [ ] All 30+ files are present in the project
- [ ] `package.json` has all dependencies
- [ ] Environment template (`.env.local.example`) exists
- [ ] Database schema (`supabase-schema.sql`) is ready
- [ ] All 8 page folders exist in `src/app/`

---

## ✅ SUPABASE SETUP

### Project Creation
- [ ] Created Supabase account at https://supabase.com
- [ ] Created new Supabase project
- [ ] Saved database password securely
- [ ] Project is fully provisioned (green status)

### API Credentials
- [ ] Copied **Project URL** from Settings → API
- [ ] Copied **anon/public key** from Settings → API
- [ ] Saved both values for Vercel deployment

### Database Schema
- [ ] Opened SQL Editor in Supabase
- [ ] Pasted complete `supabase-schema.sql` content
- [ ] Ran the SQL successfully (no errors)
- [ ] Verified 8 tables created in Table Editor:
  - [ ] profiles
  - [ ] relationships
  - [ ] messages
  - [ ] message_analysis
  - [ ] habits
  - [ ] events
  - [ ] journals
  - [ ] insights

### RLS Verification
- [ ] All 8 tables show "RLS enabled" in Table Editor
- [ ] Policies are visible for each table
- [ ] Admin policies exist
- [ ] Partner policies exist

---

## ✅ VERCEL DEPLOYMENT

### GitHub Setup
- [ ] Initialized git repository locally
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub successfully
- [ ] All files visible on GitHub

### Vercel Project
- [ ] Created Vercel account at https://vercel.com
- [ ] Imported GitHub repository
- [ ] Framework detected as Next.js
- [ ] Build settings are default (no changes needed)

### Environment Variables
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Values match exactly from Supabase
- [ ] No extra spaces or quotes in values

### Deployment
- [ ] Clicked "Deploy" in Vercel
- [ ] Build completed successfully (no errors)
- [ ] Received deployment URL (e.g., `*.vercel.app`)
- [ ] Site is accessible in browser

---

## ✅ FIRST USER SETUP

### Admin Account Creation
- [ ] Opened deployed site in browser
- [ ] Clicked "Sign Up"
- [ ] Entered full name, email, password
- [ ] Successfully created account
- [ ] Saw "not yet paired" message (expected)

### Admin Promotion
- [ ] Went back to Supabase → SQL Editor
- [ ] Ran SQL to promote user to admin:
  ```sql
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE email = 'your-email@example.com';
  ```
- [ ] SQL executed successfully
- [ ] Signed out of the app
- [ ] Signed back in
- [ ] Now redirected to **Admin Dashboard** (not couple dashboard)

---

## ✅ ADMIN FEATURES TEST

### Dashboard Access
- [ ] Admin Dashboard loads without errors
- [ ] Can see "All Couples (0)" section
- [ ] Can see "Unpaired Users (0)" section
- [ ] "Sign Out" button works
- [ ] "+ Pair Couple" button visible

### Create Test Couple
- [ ] Created first test user account (Partner A)
  - [ ] Full name entered
  - [ ] Email entered
  - [ ] Password entered
  - [ ] Account created
- [ ] Created second test user account (Partner B)
  - [ ] Full name entered
  - [ ] Email entered
  - [ ] Password entered
  - [ ] Account created

### Pair the Couple
- [ ] Signed in as admin
- [ ] Clicked "+ Pair Couple"
- [ ] Selected Partner A from dropdown
- [ ] Selected Partner B from dropdown
- [ ] Clicked "Create Pair"
- [ ] Couple appears in "All Couples" section
- [ ] Both users removed from "Unpaired Users"

### View Couple Data
- [ ] Clicked "View Details" for the test couple
- [ ] Can see both partner names
- [ ] Can see relationship scores (all default to 50)
- [ ] "Reset Password" buttons visible
- [ ] "Unpair" button works (test if desired)

---

## ✅ COUPLE FEATURES TEST

Sign in as one of the test couple users:

### Dashboard
- [ ] Redirected to Couple Dashboard (not admin)
- [ ] Partner name displayed correctly
- [ ] Can see 3 relationship scores:
  - [ ] Connection Score (default 50)
  - [ ] Commitment Score (default 50)
  - [ ] Communication Score (default 50)
- [ ] 5 quick action cards visible:
  - [ ] Messages
  - [ ] Weekly Habits
  - [ ] Shared Planner
  - [ ] Journal
  - [ ] Insights

### Messages Feature
- [ ] Clicked "Messages" from dashboard
- [ ] Messages page loads
- [ ] Message input box visible
- [ ] Typed test message (e.g., "I always feel ignored")
- [ ] Clicked "Analyze & Send"
- [ ] Analysis modal appeared with:
  - [ ] Original message shown
  - [ ] Calm rewrite shown (e.g., "often" instead of "always")
  - [ ] Emotional tone detected (e.g., "sad, disconnected")
  - [ ] Detected needs shown (e.g., "understanding, connection")
  - [ ] NVC rewrite shown
  - [ ] Guidance for partner shown
  - [ ] Conflict score shown (0-10)
- [ ] Chose to send (original or calm)
- [ ] Message appears in chat
- [ ] Conflict score badge visible on message

### Habits Feature
- [ ] Clicked "Weekly Habits" from dashboard
- [ ] 6 habit cards visible:
  - [ ] Intimacy/Sex (1/1)
  - [ ] Honest Talk (1/1)
  - [ ] Date Day (1/1)
  - [ ] Prayer Together (3/3)
  - [ ] Family Time (if applicable)
  - [ ] Family Prayer (if applicable)
- [ ] Clicked "+" button on a habit
- [ ] Completion count increased
- [ ] Progress bar updated
- [ ] Clicked "-" button
- [ ] Completion count decreased
- [ ] Summary shows completion percentage

### Planner Feature
- [ ] Clicked "Shared Planner" from dashboard
- [ ] "+ Add Event" button visible
- [ ] Clicked "+ Add Event"
- [ ] Form appeared with fields:
  - [ ] Title
  - [ ] Type (dropdown)
  - [ ] Start Time (datetime)
  - [ ] End Time (datetime)
  - [ ] Description
- [ ] Filled out test event (e.g., "Dinner Date")
- [ ] Clicked "Create Event"
- [ ] Event appears in "Upcoming Events"
- [ ] Event shows correct icon based on type
- [ ] Delete button (×) works

### Journal Feature
- [ ] Clicked "Journal" from dashboard
- [ ] "+ New Entry" button visible
- [ ] Clicked "+ New Entry"
- [ ] Journal form appeared
- [ ] Typed test entry (e.g., "Feeling grateful today")
- [ ] "Share with partner" checkbox visible
- [ ] Tested both private and shared entries
- [ ] Clicked "Save Entry"
- [ ] Entry appears in list
- [ ] Private entries show "Private" badge
- [ ] Shared entries show "Shared with you" badge (when viewing partner's)
- [ ] Sentiment score displayed (0-10)

### Insights Feature
- [ ] Clicked "Insights" from dashboard
- [ ] Insights page loads
- [ ] Shows week's statistics:
  - [ ] Total messages count
  - [ ] Average conflict score
  - [ ] Dominant emotions (if any detected)
  - [ ] Common needs (if any detected)
  - [ ] Habit completion percentages
- [ ] "Refresh Insights" button works
- [ ] Strengths section shows positive feedback
- [ ] Suggestions section shows growth areas

---

## ✅ SECURITY VERIFICATION

### Row Level Security
Sign in as Partner A, then sign in separately as Partner B:

- [ ] Partner A can ONLY see their own relationship data
- [ ] Partner A CANNOT see any other couple's data
- [ ] Partner B (in same relationship) sees SAME scores
- [ ] Partner B sees SAME messages
- [ ] Partner B sees SAME habits/events
- [ ] Partner A's private journals NOT visible to Partner B
- [ ] Partner A's shared journals ARE visible to Partner B

### Admin Access
- [ ] Admin can see all couples
- [ ] Admin can see all relationship scores
- [ ] Admin can view details for any couple
- [ ] Admin can pair/unpair couples
- [ ] Regular users CANNOT access `/admin` route

---

## ✅ CROSS-PARTNER TESTING

### Real-time Updates
- [ ] Partner A sends a message
- [ ] Partner B (in different browser/device) sees message appear
- [ ] Habit updates from one partner visible to other
- [ ] Events created by one partner visible to other
- [ ] Scores update for both partners

### Shared Journal
- [ ] Partner A creates shared journal entry
- [ ] Partner B can see the shared entry
- [ ] Partner A creates private journal entry
- [ ] Partner B CANNOT see the private entry
- [ ] Partner B creates their own entries
- [ ] Both can see their own + partner's shared entries

---

## ✅ PERFORMANCE & UX

### Page Load Times
- [ ] Landing page loads < 2 seconds
- [ ] Dashboard loads < 2 seconds
- [ ] Messages page loads < 2 seconds
- [ ] All other pages load quickly

### Responsive Design
- [ ] Site works on desktop (1920×1080)
- [ ] Site works on tablet (768×1024)
- [ ] Site works on mobile (375×667)
- [ ] All buttons are clickable on mobile
- [ ] Forms are usable on mobile

### Visual Quality
- [ ] Dark mode theme is consistent
- [ ] Purple/magenta gradients visible
- [ ] Cards have glassmorphism effect
- [ ] Hover effects work on interactive elements
- [ ] Animations are smooth (fade-in, slide-in)
- [ ] No broken styles or layout issues

---

## ✅ FINAL VERIFICATION

### Database Health
- [ ] All 8 tables have data
- [ ] No error logs in Supabase Dashboard → Logs
- [ ] RLS policies enforced (tested above)
- [ ] Relationships have correct foreign keys

### Application Health
- [ ] No console errors in browser DevTools
- [ ] No 404 errors when navigating
- [ ] All images/icons load correctly
- [ ] Sign out works from all pages
- [ ] Back to Dashboard works from all feature pages

### Deployment
- [ ] Vercel deployment shows "Ready" status
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables not exposed in client

---

## 🎉 SUCCESS!

If all items are checked, your CoupleConnect app is **fully deployed and functional**!

### What's Working:
✅ Complete authentication system  
✅ Admin dashboard with full control  
✅ Couple dashboard with relationship scores  
✅ Emotional message interpreter  
✅ Weekly habit tracking  
✅ Shared calendar/planner  
✅ Private/shared journaling  
✅ Weekly insights & analytics  
✅ Row Level Security enforced  
✅ Real-time updates  

### Next Steps:
1. Share the URL with your first real couple
2. Monitor usage via Admin Dashboard
3. Review insights weekly
4. Consider adding custom domain
5. Explore optional enhancements (see README.md)

---

## 🐛 Issues Found?

If any items are unchecked or failed:

1. **Check DEPLOYMENT.md** troubleshooting section
2. **Review Supabase logs**: Dashboard → Logs
3. **Review Vercel logs**: Deployments → Click deployment → Logs
4. **Check environment variables**: Vercel → Settings → Environment Variables
5. **Verify RLS policies**: Supabase → SQL Editor → Re-run schema
6. **Test in incognito mode**: Sometimes cached auth causes issues

---

**Status**: _____ / 100+ items completed

**Date**: ________________

**Deployed URL**: ________________________________

**Admin Email**: ________________________________
