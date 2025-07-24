import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify('https://xirbkztlbixvacekhzyv.supabase.co'),
      'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcmJrenRsYml4dmFjZWtoenl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDQyODAsImV4cCI6MjA2NTIyMDI4MH0.rRiE4SggfVEWvJattoTdXhs5mWIK4Ulfw6OV7INvDtg'),
      'import.meta.env.SUPABASE_FUNCTIONS_URL': JSON.stringify('https://xirbkztlbixvacekhzyv.functions.supabase.co'),
      'import.meta.env.SUPABASE_WS_URL': JSON.stringify('wss://xirbkztlbixvacekhzyv.functions.supabase.co'),
    },
  };
});
