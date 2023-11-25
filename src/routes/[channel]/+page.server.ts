import { env } from '$env/dynamic/private'
import type { Actions } from './$types'

import pkg from 'agora-token'
import { generateUID } from '@/lib/utils'
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole } = pkg

export const load = async ({ params: { channel }, url, cookies }) => {
	const _new = url.searchParams.get('new')
	if (_new && channel !== env.VITE_AGORA_TEST_CHANNEL)
		cookies.set('hosting', 'true', { path: '/' })
}

export const actions = {
	join: async ({ params, cookies, request }) => {
		const channel = params.channel
		const appId = env.VITE_AGORA_APP_ID
		const appCertificate = env.VITE_AGORA_APP_CERTIFICATE

		const form = await request.formData()
		const uid = parseInt(form.get('uid')?.toString() || '') || generateUID()

		const hosting = cookies.get('hosting') === 'true'
		cookies.delete('hosting', { path: '/' })

		const rtcToken =
			channel === env.VITE_AGORA_TEST_CHANNEL
				? env.VITE_AGORA_TEST_TOKEN
				: RtcTokenBuilder.buildTokenWithUid(
						appId,
						appCertificate,
						channel,
						uid,
						hosting ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
						600,
						Math.floor(Date.now() / 1000) + 3600
				  )

		const rtmToken = RtmTokenBuilder.buildToken(
			appId,
			appCertificate,
			uid.toString(),
			Math.floor(Date.now() / 1000) + 3600
		)

		console.log(`Tokens generated`, {
			uid,
			channel,
			rtcToken,
			rtmToken
		})

		return {
			action: 'join',
			body: {
				uid,
				appId,
				channel,
				rtcToken,
				rtmToken
			}
		}
	}
} satisfies Actions
