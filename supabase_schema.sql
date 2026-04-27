-- 1. Profiles Table (Tracks user tier and Stripe info)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tier TEXT DEFAULT 'starter' CHECK (tier IN ('starter', 'dev', 'engineer', 'professional')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, tier)
  VALUES (new.id, 'starter');
  return new;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- (api_usage table has been removed since transitioning to BYOK model)


-- 2. Teams Infrastructure
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  max_seats INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can manage their team"
  ON teams FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Members can view their team"
  ON teams FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );
CREATE POLICY "Members can view their own membership"
  ON team_members FOR SELECT USING (user_id = auth.uid());

-- Enforce max 5 seats per team
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

-- Helper: resolve a user's effective tier (own tier OR inherited from team owner)
CREATE OR REPLACE FUNCTION get_effective_tier(uid UUID)
RETURNS TEXT AS $$
DECLARE
  own_tier TEXT;
  team_tier TEXT;
BEGIN
  SELECT tier INTO own_tier FROM profiles WHERE id = uid;

  -- Check if user is an active member of any team
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

  -- Return the higher of own tier vs inherited team tier
  IF team_tier = 'professional' THEN RETURN 'professional'; END IF;
  IF own_tier = 'professional' THEN RETURN 'professional'; END IF;
  IF team_tier = 'engineer' THEN RETURN 'engineer'; END IF;
  IF own_tier = 'engineer' THEN RETURN 'engineer'; END IF;
  IF team_tier = 'dev' THEN RETURN 'dev'; END IF;
  IF own_tier = 'dev' THEN RETURN 'dev'; END IF;
  RETURN 'starter';
END;
$$ language plpgsql security definer;


-- 3. Database Persistence Tables (History and Memory)
CREATE TABLE context_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE context_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own history" ON context_history FOR ALL USING (auth.uid() = user_id);
-- Team members can read each other's history
CREATE POLICY "Team members can read shared history"
  ON context_history FOR SELECT USING (
    user_id IN (
      SELECT tm2.user_id FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() AND tm1.status = 'active' AND tm2.status = 'active'
    )
  );

CREATE TABLE memory_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, filename)
);

ALTER TABLE memory_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memory files" ON memory_files FOR ALL USING (auth.uid() = user_id);
-- Team members can read each other's memory (Shared Workspace Memory)
CREATE POLICY "Team members can read shared memory"
  ON memory_files FOR SELECT USING (
    user_id IN (
      SELECT tm2.user_id FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() AND tm1.status = 'active' AND tm2.status = 'active'
    )
  );
