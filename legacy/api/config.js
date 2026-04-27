export default function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(`window.ENV = { SUPABASE_URL: "${url}", SUPABASE_ANON_KEY: "${key}" };`);
}
