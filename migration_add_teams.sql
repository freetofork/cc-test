-- ============================================================
-- MIGRATION: Add Teams Infrastructure
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Update the profiles tier CHECK constraint to accept new tier names
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check 
  CHECK (tier IN ('starter', 'dev', 'engineer', 'professional', 'pro', 'team'));

-- 2. Create tables FIRST (no policies yet)
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  max_seats INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Enable RLS and add policies AFTER both tables exist
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage their team"
  ON teams FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members can view their team"
  ON teams FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

CREATE POLICY "Members can view their own membership"
  ON team_members FOR SELECT USING (user_id = auth.uid());

-- 4. Enforce max 5 seats per team (database trigger)
CREATE OR REPLACE FUNCTION check_team_seat_limit()
RETURNS trigger AS $$
DECLARE
  current_count INTEGER;
  seat_limit INTEGER;
BEGIN
  SELECT count(*) INTO current_count
    FROM team_members
    WHERE team_id = NEW.team_id AND status IN ('pending', 'active');

  SELECT max_seats INTO seat_limit
    FROM teams
    WHERE id = NEW.team_id;

  IF current_count >= seat_limit THEN
    RAISE EXCEPTION 'Team has reached the maximum of % seats', seat_limit;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER enforce_seat_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW EXECUTE PROCEDURE check_team_seat_limit();

-- 5. Helper function: resolve effective tier (own tier OR inherited from team)
CREATE OR REPLACE FUNCTION get_effective_tier(uid UUID)
RETURNS TEXT AS $$
DECLARE
  own_tier TEXT;
  team_tier TEXT;
BEGIN
  SELECT tier INTO own_tier FROM profiles WHERE id = uid;

  SELECT p.tier INTO team_tier
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN profiles p ON t.owner_id = p.id
    WHERE tm.user_id = uid AND tm.status = 'active'
    ORDER BY
      CASE p.tier
        WHEN 'professional' THEN 4
        WHEN 'engineer' THEN 3
        WHEN 'dev' THEN 2
        ELSE 1
      END DESC
    LIMIT 1;

  IF team_tier = 'professional' THEN RETURN 'professional'; END IF;
  IF own_tier = 'professional' THEN RETURN 'professional'; END IF;
  IF team_tier = 'engineer' THEN RETURN 'engineer'; END IF;
  IF own_tier = 'engineer' THEN RETURN 'engineer'; END IF;
  IF team_tier = 'dev' THEN RETURN 'dev'; END IF;
  IF own_tier = 'dev' THEN RETURN 'dev'; END IF;
  RETURN 'starter';
END;
$$ language plpgsql security definer;

-- 6. Add shared workspace RLS policies for team members
CREATE POLICY "Team members can read shared history"
  ON context_history FOR SELECT USING (
    user_id IN (
      SELECT tm2.user_id FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() AND tm1.status = 'active' AND tm2.status = 'active'
    )
  );

CREATE POLICY "Team members can read shared memory"
  ON memory_files FOR SELECT USING (
    user_id IN (
      SELECT tm2.user_id FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() AND tm1.status = 'active' AND tm2.status = 'active'
    )
  );
