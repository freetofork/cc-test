import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET — Fetch user's team (as owner or member)
export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();

  // Check if user owns a team
  const { data: ownedTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (ownedTeam) {
    // Fetch members of this team
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', ownedTeam.id)
      .in('status', ['pending', 'active'])
      .order('invited_at', { ascending: true });

    return NextResponse.json({
      role: 'owner',
      team: ownedTeam,
      members: members || [],
    });
  }

  // Check if user is a member of someone else's team
  const { data: membership } = await supabase
    .from('team_members')
    .select('*, teams(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (membership) {
    return NextResponse.json({
      role: 'member',
      team: membership.teams,
      membership,
    });
  }

  return NextResponse.json({ role: 'none', team: null });
}

// POST — Create team or invite member
export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  const body = await req.json();

  // Check user is on Professional tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.tier !== 'professional') {
    return NextResponse.json(
      { error: 'Teams require the Professional tier ($99/mo).' },
      { status: 403 }
    );
  }

  // Action: create team
  if (body.action === 'create') {
    // Check if user already owns a team
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already own a team.' }, { status: 400 });
    }

    const teamName = body.name || `${user.email}'s Team`;
    const { data: team, error } = await supabase
      .from('teams')
      .insert({ name: teamName, owner_id: user.id, max_seats: 5 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add owner as a member too
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: user.id,
      email: user.email!,
      role: 'owner',
      status: 'active',
      accepted_at: new Date().toISOString(),
    });

    return NextResponse.json({ team });
  }

  // Action: invite member
  if (body.action === 'invite') {
    const email = body.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    // Get user's team
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (!team) return NextResponse.json({ error: 'Create a team first.' }, { status: 400 });

    // Check for duplicate invite
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('email', email)
      .in('status', ['pending', 'active'])
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'This email is already on the team.' }, { status: 400 });
    }

    // Insert — the DB trigger will enforce the 5-seat limit
    const { error } = await supabase.from('team_members').insert({
      team_id: team.id,
      email,
      role: 'member',
      status: 'pending',
    });

    if (error) {
      if (error.message.includes('maximum')) {
        return NextResponse.json({ error: 'Team has reached the maximum of 5 seats.' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Invitation sent to ${email}` });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// DELETE — Remove a member (owner only)
export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  const { memberId } = await req.json();

  // Verify user owns the team this member belongs to
  const { data: member } = await supabase
    .from('team_members')
    .select('*, teams!inner(*)')
    .eq('id', memberId)
    .single();

  if (!member || (member.teams as any).owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (member.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove the team owner.' }, { status: 400 });
  }

  await supabase
    .from('team_members')
    .update({ status: 'removed' })
    .eq('id', memberId);

  return NextResponse.json({ success: true });
}
