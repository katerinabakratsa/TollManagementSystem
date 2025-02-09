// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Define the path to SSL certificates using process.cwd()
const sslKeyPath = path.resolve(__dirname, 'key.pem');
const sslCertPath = path.resolve(__dirname, 'cert.pem');

export default defineConfig({
  server: {
    host: true,
    port: 5173, // Your frontend will run on https://localhost:5173
    https: {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    }
  },
  plugins: [react()]
});
