import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'
import type { Actions } from './$types'

import pkg from 'agora-token'
import { generateUID } from '@/lib/utils'
const { RtcTokenBuilder, RtcRole } = pkg

export const actions = {
	default: async ({ params }) => {
		const channel = params.meet
		const appId = env.VITE_AGORA_APP_ID
		const appCertificate = env.VITE_AGORA_APP_CERTIFICATE
		const uid = generateUID()

		if (!channel) throw error(404, 'Invalid meeting')
		if (channel === env.VITE_AGORA_TEST_CHANNEL) {
			console.log('Using test token for channel', channel)
			return {
				body: {
					uid,
					appId,
					channel,
					token: env.VITE_AGORA_TEST_TOKEN
				}
			}
		}
		const token = RtcTokenBuilder.buildTokenWithUid(
			appId,
			appCertificate,
			channel,
			uid,
			RtcRole.PUBLISHER,
			600,
			Math.floor(Date.now() / 1000) + 3600
		)
		console.log('Token generated for channel', channel, token)

		return {
			body: {
				uid,
				appId,
				channel,
				token
			}
		}
	}
} satisfies Actions
