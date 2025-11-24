-- CoupleConnect Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'partner')),
  relationship_id UUID,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  connection_score INTEGER DEFAULT 50 CHECK (connection_score >= 0 AND connection_score <= 100),
  commitment_score INTEGER DEFAULT 50 CHECK (commitment_score >= 0 AND commitment_score <= 100),
  communication_score INTEGER DEFAULT 50 CHECK (communication_score >= 0 AND communication_score <= 100)
);

-- Add foreign key to profiles
-- Add foreign key to profiles (safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_relationship') THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT fk_relationship
        FOREIGN KEY (relationship_id) REFERENCES public.relationships(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create message_analysis table
CREATE TABLE IF NOT EXISTS public.message_analysis (
  message_id UUID PRIMARY KEY REFERENCES public.messages(id) ON DELETE CASCADE,
  calm_rewrite TEXT NOT NULL,
  emotional_tone TEXT NOT NULL,
  detected_needs TEXT[] NOT NULL,
  nvc_rewrite TEXT NOT NULL,
  guidance TEXT NOT NULL,
  conflict_score INTEGER NOT NULL CHECK (conflict_score >= 0 AND conflict_score <= 10),
  attachment_hints TEXT NOT NULL
);

-- Create habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sex', 'talk', 'date', 'prayer', 'family_time', 'family_prayer')),
  frequency_goal INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  completions INTEGER DEFAULT 0,
  UNIQUE(relationship_id, type, week_start_date)
);

-- Create events table (planner)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('date', 'intimacy', 'talk', 'visit', 'prayer', 'family', 'goal')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create journals table
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create insights table
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  summary_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(relationship_id, week_start_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_relationship_id ON public.profiles(relationship_id);
CREATE INDEX IF NOT EXISTS idx_messages_relationship_id ON public.messages(relationship_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_habits_relationship_id ON public.habits(relationship_id);
CREATE INDEX IF NOT EXISTS idx_events_relationship_id ON public.events(relationship_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_journals_relationship_id ON public.journals(relationship_id);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_relationship_id ON public.insights(relationship_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow insert for new users (during signup)
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;
CREATE POLICY "Allow insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RELATIONSHIPS POLICIES
-- ============================================

-- Partners can view their own relationship
DROP POLICY IF EXISTS "Partners can view own relationship" ON public.relationships;
CREATE POLICY "Partners can view own relationship" ON public.relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = relationships.id
    )
  );

-- Partners can update their own relationship
DROP POLICY IF EXISTS "Partners can update own relationship" ON public.relationships;
CREATE POLICY "Partners can update own relationship" ON public.relationships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = relationships.id
    )
  );

-- Admins can do everything with relationships
DROP POLICY IF EXISTS "Admins have full access to relationships" ON public.relationships;
CREATE POLICY "Admins have full access to relationships" ON public.relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- MESSAGES & MESSAGE_ANALYSIS POLICIES
-- ============================================

-- Partners can view messages in their relationship
DROP POLICY IF EXISTS "Partners can view own relationship messages" ON public.messages;
CREATE POLICY "Partners can view own relationship messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = messages.relationship_id
    )
  );

-- Partners can insert messages in their relationship
DROP POLICY IF EXISTS "Partners can insert messages" ON public.messages;
CREATE POLICY "Partners can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = messages.relationship_id
    )
  );

-- Admins can view all messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Message analysis policies (same as messages)
DROP POLICY IF EXISTS "Partners can view message analysis" ON public.message_analysis;
CREATE POLICY "Partners can view message analysis" ON public.message_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.profiles ON profiles.relationship_id = messages.relationship_id
      WHERE messages.id = message_analysis.message_id
      AND profiles.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partners can insert message analysis" ON public.message_analysis;
CREATE POLICY "Partners can insert message analysis" ON public.message_analysis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.profiles ON profiles.relationship_id = messages.relationship_id
      WHERE messages.id = message_analysis.message_id
      AND profiles.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all message analysis" ON public.message_analysis;
CREATE POLICY "Admins can view all message analysis" ON public.message_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- HABITS, EVENTS, INSIGHTS POLICIES
-- ============================================

-- Partners can view/modify habits in their relationship
DROP POLICY IF EXISTS "Partners can view own habits" ON public.habits;
CREATE POLICY "Partners can view own habits" ON public.habits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = habits.relationship_id
    )
  );

DROP POLICY IF EXISTS "Partners can modify own habits" ON public.habits;
CREATE POLICY "Partners can modify own habits" ON public.habits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = habits.relationship_id
    )
  );

-- Admins have full access to habits
DROP POLICY IF EXISTS "Admins have full access to habits" ON public.habits;
CREATE POLICY "Admins have full access to habits" ON public.habits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Events policies (same pattern)
DROP POLICY IF EXISTS "Partners can view own events" ON public.events;
CREATE POLICY "Partners can view own events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = events.relationship_id
    )
  );

DROP POLICY IF EXISTS "Partners can modify own events" ON public.events;
CREATE POLICY "Partners can modify own events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = events.relationship_id
    )
  );

DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
CREATE POLICY "Admins have full access to events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insights policies
DROP POLICY IF EXISTS "Partners can view own insights" ON public.insights;
CREATE POLICY "Partners can view own insights" ON public.insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = insights.relationship_id
    )
  );

DROP POLICY IF EXISTS "Partners can insert own insights" ON public.insights;
CREATE POLICY "Partners can insert own insights" ON public.insights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.relationship_id = insights.relationship_id
    )
  );

DROP POLICY IF EXISTS "Admins have full access to insights" ON public.insights;
CREATE POLICY "Admins have full access to insights" ON public.insights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- JOURNALS POLICIES (with privacy logic)
-- ============================================

-- Users can view their own journals
DROP POLICY IF EXISTS "Users can view own journals" ON public.journals;
CREATE POLICY "Users can view own journals" ON public.journals
  FOR SELECT USING (user_id = auth.uid());

-- Users can view shared journals from their partner
DROP POLICY IF EXISTS "Users can view partner shared journals" ON public.journals;
CREATE POLICY "Users can view partner shared journals" ON public.journals
  FOR SELECT USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.relationship_id = p2.relationship_id
      WHERE p1.id = auth.uid()
      AND p2.id = journals.user_id
      AND p1.relationship_id IS NOT NULL
    )
  );

-- Users can insert their own journals
DROP POLICY IF EXISTS "Users can insert own journals" ON public.journals;
CREATE POLICY "Users can insert own journals" ON public.journals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own journals
DROP POLICY IF EXISTS "Users can update own journals" ON public.journals;
CREATE POLICY "Users can update own journals" ON public.journals
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own journals
DROP POLICY IF EXISTS "Users can delete own journals" ON public.journals;
CREATE POLICY "Users can delete own journals" ON public.journals
  FOR DELETE USING (user_id = auth.uid());

-- Admins can view all journals
DROP POLICY IF EXISTS "Admins can view all journals" ON public.journals;
CREATE POLICY "Admins can view all journals" ON public.journals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTION TO CREATE ADMIN USER
-- ============================================

-- After running this schema, create your admin account:
-- 1. Sign up normally through the app
-- 2. Run this SQL to make yourself admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
