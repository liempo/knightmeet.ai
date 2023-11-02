import { getUserData } from '@/lib/kv'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params: { id } }) => {
	const uid = parseInt(id)
	const data = await getUserData(uid)
	return new Response(JSON.stringify(data))
}
