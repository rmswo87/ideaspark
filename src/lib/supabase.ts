// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://djxiousdavdwwznufpzs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeGlvdXNkYXZkd3d6bnVmcHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTY3NjEsImV4cCI6MjA3OTczMjc2MX0.i2V-FZddBMUbUht8GuVMrMpWL1iNahSyHijsP_rAGSo'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using default values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

