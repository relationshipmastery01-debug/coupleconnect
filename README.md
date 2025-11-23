# CoupleConnect

A private, secure relationship-strengthening platform for couples with emotional intelligence, habit tracking, and shared planning.

## 🌟 Features

### For Couples
- **💬 Emotional Interpreter**: AI-powered message analysis that translates emotional content into calm, therapeutic language using Non-Violent Communication (NVC) principles
- **❤️ Relationship Scores**: Track Connection, Commitment, and Communication scores
- **✅ Weekly Habit Tracker**: Build consistency with intimacy, dates, talks, prayer, and family time
- **📅 Shared Planner**: Schedule quality time together with reminders
- **📔 Emotion Journal**: Private or shared journal entries with sentiment analysis
- **📊 Weekly Insights**: Automated relationship analytics and growth suggestions

### For Admin
- **👥 Couple Management**: Pair and unpair couples
- **📈 Monitoring**: View all relationship scores and data
- **🔐 User Management**: Password resets and access control
- **📊 Analytics**: Export insights (future feature)

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Couples can ONLY see their own data
- **Admin Oversight**: Full admin access with optional message visibility toggle
- **Private Journals**: Private entries are never visible to partners
- **Secure Authentication**: Powered by Supabase Auth

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (React, TypeScript)
- **Styling**: Vanilla CSS with modern dark mode & glassmorphism
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **NLP Engine**: Custom rule-based interpreter (zero cost, no external APIs)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## 🚀 Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step deployment instructions.

### Prerequisites
- Supabase account (free)
- Vercel account (free)
- Node.js 18+ (for local development)

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd coupleconnect
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📚 Project Structure

```
coupleconnect/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing + Auth
│   │   ├── dashboard/         # Couple dashboard
│   │   ├── messages/          # Chat with interpreter
│   │   ├── habits/            # Weekly habit tracker
│   │   ├── planner/           # Shared calendar
│   │   ├── journal/           # Emotion journal
│   │   ├── insights/          # Weekly analytics
│   │   └── admin/             # Admin dashboard
│   └── lib/
│       ├── supabase.ts        # Supabase client & types
│       ├── interpreter.ts     # Emotional analysis engine
│       └── scores.ts          # Relationship scoring logic
├── supabase-schema.sql        # Database schema + RLS
├── DEPLOYMENT.md              # Deployment guide
└── package.json
```

## 🎨 Design Philosophy

- **Premium Aesthetics**: Dark mode, gradients, glassmorphism, smooth animations
- **Emotional Intelligence**: NVC-based message rewriting and conflict detection
- **Habit-Driven Growth**: Weekly rituals that strengthen relationships
- **Privacy-First**: RLS ensures complete data isolation between couples

## 📊 How It Works

### Emotional Interpreter
The custom NLP engine analyzes messages for:
- **Conflict triggers** (e.g., "always", "never", "hate")
- **Emotional tone** (angry, sad, anxious, etc.)
- **Underlying needs** (connection, respect, understanding, etc.)
- **Attachment patterns** (anxious, avoidant, secure)

Then generates:
- **Calm rewrite**: Softened version with extreme words replaced
- **NVC rewrite**: "I feel [X] because I need [Y]. Would you [Z]?"
- **Guidance**: Therapeutic advice for the receiving partner
- **Conflict score**: 0-10 rating of emotional intensity

### Relationship Scores
- **Connection Score**: Based on habit completion and shared journal entries
- **Commitment Score**: Measures consistency and dedication over time
- **Communication Score**: Inverse of average conflict score + message frequency

## 🗄️ Database Schema

See `supabase-schema.sql` for complete schema.

Key tables:
- `profiles` - User accounts with role (admin/partner)
- `relationships` - Couple pairings and scores
- `messages` + `message_analysis` - Chat history with emotional analysis
- `habits` - Weekly habit tracking
- `events` - Shared calendar
- `journals` - Private/shared journal entries
- `insights` - Weekly analytics summaries

## 🔐 Admin Setup

1. Sign up normally through the app
2. Run this SQL in Supabase:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```
3. Sign out and sign back in
4. You now have admin access!

## 💰 Cost

**100% FREE** for ~10-20 couples:
- Supabase Free Tier: 500MB database, 50K auth users
- Vercel Free Tier: Unlimited deployments, 100GB bandwidth
- No paid APIs (custom NLP)

## 📈 Roadmap

- [ ] Email reminders for habits
- [ ] PWA (Progressive Web App) support
- [ ] Advanced charts and visualizations
- [ ] Streak tracking and gamification
- [ ] Export relationship reports (PDF)
- [ ] Multi-language support
- [ ] Optional AI upgrade (OpenAI integration)

## 🤝 Contributing

This is a private relationship app. If you want to deploy your own instance:
1. Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Customize as needed
3. Keep data private and secure

## 📄 License

Private use only. Not for redistribution.

## ❤️ Built With Love

CoupleConnect was built to help couples communicate better, grow together, and build lasting relationships through clarity, consistency, and connection.

---

**Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete guide!
