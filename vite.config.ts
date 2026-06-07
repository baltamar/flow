import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// base: '/flow/' assumes the GitHub repo is named `flow` and the site is served
// from https://<user>.github.io/flow/. Change this to '/' if you serve from
// the user/organization root (e.g. https://<user>.github.io/).
export default defineConfig({
  plugins: [react()],
  base: '/flow/',
});
