import { build } from 'esbuild';
import { loadEnv } from 'vite';

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = loadEnv(mode, process.cwd(), 'VITE_FIREBASE_');

const define = Object.fromEntries(FIREBASE_ENV_KEYS.map((key) => [`import.meta.env.${key}`, JSON.stringify(env[key] ?? '')]));

await build({
  entryPoints: ['src/service-worker/firebase-messaging-sw.ts'],
  outfile: 'public/firebase-messaging-sw.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  define,
  logLevel: 'info',
});
