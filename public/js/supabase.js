const SUPABASE_URL = "https://soekckmghgqrotkjttmf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZWtja21naGdxcm90a2p0dG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjQ5NDgsImV4cCI6MjEwNjkwMDk0OH0.QfUQjQzHvCr1PMPqzACGh_gctssW9mVM8rp_HchaiUI";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase siap:", db);