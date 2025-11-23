# CoupleConnect - Architecture & Tech Stack Proposal

## 1. Tech Stack
*   **Frontend Framework**: Next.js 14+ (App Router)
*   **Language**: TypeScript
*   **Styling**: Vanilla CSS (CSS Modules for component-level scoping) with a focus on modern, glassmorphism aesthetics.
*   **Backend / Database**: Supabase
    *   **Database**: PostgreSQL
    *   **Auth**: Supabase Auth (Email/Password)
    *   **Security**: Row Level Security (RLS)
*   **Deployment**: Vercel
*   **NLP Engine**: Custom Rule-Based Logic (JavaScript)
    *   Uses keyword mapping, sentiment dictionaries (e.g., AFINN-165 based), and heuristic patterns to generate "therapeutic" rewrites without external AI APIs.

## 2. Database Schema (Supabase)

### Tables
1.  **`profiles`** (Extends Supabase Auth)
    *   `id` (UUID, PK, references auth.users)
    *   `email` (Text)
    *   `role` (Enum: 'admin', 'partner')
    *   `relationship_id` (UUID, FK -> relationships.id, nullable for admin)
    *   `full_name` (Text)

2.  **`relationships`**
    *   `id` (UUID, PK)
    *   `created_at` (Timestamp)
    *   `connection_score` (Int)
    *   `commitment_score` (Int)
    *   `communication_score` (Int)

3.  **`messages`**
    *   `id` (UUID, PK)
    *   `relationship_id` (UUID, FK)
    *   `sender_id` (UUID, FK)
    *   `content` (Text)
    *   `created_at` (Timestamp)

4.  **`message_analysis`** (One-to-One with messages)
    *   `message_id` (UUID, PK, FK)
    *   `calm_rewrite` (Text)
    *   `emotional_tone` (Text)
    *   `detected_needs` (Array of Text)
    *   `nvc_rewrite` (Text)
    *   `guidance` (Text)
    *   `conflict_score` (Int, 0-10)
    *   `attachment_hints` (Text)

5.  **`habits`**
    *   `id` (UUID, PK)
    *   `relationship_id` (UUID, FK)
    *   `type` (Enum: 'sex', 'talk', 'date', 'prayer', 'family_time', 'family_prayer')
    *   `frequency_goal` (Int)
    *   `week_start_date` (Date)
    *   `completions` (Int, current count)

6.  **`events`** (Shared Planner)
    *   `id` (UUID, PK)
    *   `relationship_id` (UUID, FK)
    *   `title` (Text)
    *   `type` (Enum: 'date', 'intimacy', 'talk', 'visit', 'prayer', 'family', 'goal')
    *   `start_time` (Timestamp)
    *   `end_time` (Timestamp)
    *   `description` (Text)

7.  **`journals`**
    *   `id` (UUID, PK)
    *   `user_id` (UUID, FK)
    *   `relationship_id` (UUID, FK)
    *   `content` (Text)
    *   `is_shared` (Boolean)
    *   `sentiment_score` (Int)
    *   `created_at` (Timestamp)

8.  **`insights`**
    *   `id` (UUID, PK)
    *   `relationship_id` (UUID, FK)
    *   `week_start_date` (Date)
    *   `summary_json` (JSONB - stores patterns, trends, suggestions)

## 3. Security & RLS Strategy
*   **Default Deny**: All tables will have RLS enabled.
*   **Partner Policy**: Users can `SELECT`, `INSERT`, `UPDATE` rows where `relationship_id` matches their own `profile.relationship_id`.
*   **Admin Policy**: Users with `role = 'admin'` can bypass all checks and access all data.
*   **Journal Privacy**: Shared journals are visible to the partner; private journals are only visible to the author (unless Admin toggle overrides, but strictly speaking, RLS will enforce author-only for private unless specific admin override logic is applied).

## 4. Application Structure (Next.js)
*   `app/`
    *   `layout.tsx` (Root layout, providers)
    *   `page.tsx` (Landing / Login)
    *   `auth/` (Signup/Login flows)
    *   `dashboard/` (Main Couple Dashboard)
        *   `page.tsx` (Overview, Scores, Quick Actions)
    *   `messages/` (Chat interface with Realtime & Interpreter)
    *   `habits/` (Weekly tracker)
    *   `planner/` (Calendar view)
    *   `journal/` (Entry & History)
    *   `admin/` (Admin Dashboard - protected route)
*   `lib/`
    *   `supabase.ts` (Client)
    *   `interpreter.ts` (The Rule-Based NLP Logic)
    *   `utils.ts`

## 5. Emotional Interpreter Logic (Rule-Based)
We will implement a `analyzeMessage(text)` function that:
1.  **Tokenizes** input.
2.  **Matches** against a dictionary of "trigger words" (e.g., "always", "never", "hate") to increase `conflict_score`.
3.  **Identifies** underlying feelings using a "Feelings & Needs" database.
4.  **Constructs** an NVC (Non-Violent Communication) rewrite using the template: "I feel [feeling] because I need [need]. Would you be willing to [request]?"
5.  **Assigns** an attachment style hint based on keywords (e.g., "clingy" words -> Anxious, "distant" words -> Avoidant).

---

**Please confirm if this architecture and stack meet your requirements so I can proceed to generating the code.**
