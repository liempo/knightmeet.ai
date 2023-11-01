import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'
import { purgeCss } from 'vite-plugin-tailwind-purgecss'
import dotEnvExpand from 'dotenv-expand'

export default defineConfig(({ mode }) => {
	if (mode === 'development') {
		const env = loadEnv(mode, process.cwd(), '')
		dotEnvExpand.expand({ parsed: env })
	}
	return {
		plugins: [sveltekit(), purgeCss()],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		}
	}
})
