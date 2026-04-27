import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { tier } = await req.json(); // 'pro' or 'team'
    
    // Authenticate
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Prices mapped to Stripe Price IDs
    const priceIds: Record<string, string> = {
      dev: process.env.STRIPE_PRICE_DEV || 'price_1Dev_Dummy',
      engineer: process.env.STRIPE_PRICE_ENGINEER || 'price_1Engineer_Dummy',
      professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_1Professional_Dummy'
    };

    if (!priceIds[tier]) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceIds[tier], quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${req.headers.get('origin')}/dashboard?checkout=success`,
      cancel_url: `${req.headers.get('origin')}/dashboard?checkout=canceled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { tier }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
