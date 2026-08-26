import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Remi',
        short_name: 'Remi',
        description: 'Team lunch tracker',
        theme_color: '#573c56',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/remi.png', sizes: '192x192', type: 'image/png' },
          { src: '/remi.png', sizes: '512x512', type: 'image/png' },
          { src: '/remi.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
	]
});
