import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://opvethjxczahowhdtckl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdmV0aGp4Y3phaG93aGR0Y2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjUxMDUsImV4cCI6MjA5NzkwMTEwNX0.jdMDAi7CiV1pgq-qJWv3v7YFbtAbyXXV9ekPVN4MopM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);