import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { 
  apiVersion: '2023-10-16' 
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Uses the Service Role Key to bypass RLS for webhook updates
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    
    if (userId) {
      const tier = session.metadata?.tier || 'engineer'; 

      await supabase.from('profiles').update({
        tier: tier,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string
      }).eq('id', userId);

      // Auto-create a team for Professional tier subscribers
      if (tier === 'professional') {
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', userId)
          .single();

        if (!existingTeam) {
          const { data: team } = await supabase
            .from('teams')
            .insert({ name: `${session.customer_email || 'My'}'s Team`, owner_id: userId, max_seats: 5 })
            .select()
            .single();

          if (team) {
            await supabase.from('team_members').insert({
              team_id: team.id,
              user_id: userId,
              email: session.customer_email || '',
              role: 'owner',
              status: 'active',
              accepted_at: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
     const subscription = event.data.object as Stripe.Subscription;
     
     await supabase.from('profiles').update({ 
       tier: 'starter' 
     }).eq('stripe_subscription_id', subscription.id);
  }

  return new NextResponse('OK', { status: 200 });
}
