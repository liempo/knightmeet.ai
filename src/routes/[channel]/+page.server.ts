import { env } from '$env/dynamic/private'
import { error, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

import { createChannel, getChannel, setUserData } from '@/lib/kv'

import pkg from 'agora-token'
import { generateUID } from '@/lib/utils'
const { RtcTokenBuilder, RtcRole } = pkg

export const load = async ({ params: { channel }, url, cookies }) => {
	if (channel === env.VITE_AGORA_TEST_CHANNEL) return

	const _new = url.searchParams.get('new')
	const existingData = await getChannel(channel)
	if (_new) {
		if (existingData) throw redirect(303, `/${channel}`)
		else cookies.set('hosting', 'true', { path: '/' })
	} else if (!existingData) throw error(404, 'Meeting not found')
}

export const actions = {
	join: async ({ params, cookies, request }) => {
		const channel = params.channel
		const appId = env.VITE_AGORA_APP_ID
		const appCertificate = env.VITE_AGORA_APP_CERTIFICATE

		const form = await request.formData()
		const uid = parseInt(form.get('uid')?.toString() || '') || generateUID()

		const name = form.get('name')?.toString()
		if (name) await setUserData(uid, name)

		const hosting = cookies.get('hosting') === 'true'
		cookies.delete('hosting', { path: '/' })
		let owner = -1

		if (hosting)  {
			await createChannel({ name: channel, owner: uid })
			owner = uid
		}
		else {
			const existingData = await getChannel(channel)
			if (!existingData) throw error(404, 'Meeting not found')
			// KV doesn't support numbers, so we have to cast it
			owner = parseInt(`${existingData.owner}`)
		}

		if (channel === env.VITE_AGORA_TEST_CHANNEL) {
			console.log('Using test token for channel', channel)
			return {
				body: {
					uid,
					appId,
					channel,
					token: env.VITE_AGORA_TEST_TOKEN,
					owner
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
		console.log(`Token generated`, {
			uid,
			channel,
			token,
			owner
		})

		return {
			action: 'join',
			body: {
				uid,
				appId,
				channel,
				token,
				owner
			}
		}
	}
} satisfies Actions
