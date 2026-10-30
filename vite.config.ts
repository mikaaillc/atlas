import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server:{fs:{deny:['.env','.env.*','**/.git/**','**/private/**']}}, build: { rollupOptions: { output: { manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'] } } } } });
