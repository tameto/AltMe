import { supabaseAuthHandlers } from './supabase-auth';
import { supabaseDbHandlers } from './supabase-db';
import { openclawWsHandlers } from './openclaw-ws';
import { revenuecatHandlers } from './revenuecat';
import { stripeHandlers } from './stripe';

export const handlers = [
  ...supabaseAuthHandlers,
  ...supabaseDbHandlers,
  ...openclawWsHandlers,
  ...revenuecatHandlers,
  ...stripeHandlers,
];

export {
  supabaseAuthHandlers,
  supabaseDbHandlers,
  openclawWsHandlers,
  revenuecatHandlers,
  stripeHandlers,
};
