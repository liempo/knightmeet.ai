import { kv } from '@vercel/kv'

export type ChannelData = {
	name: string
	owner: number
}

export type UserData = {
	id: number
	name: string
}

export const createChannel = async (data: ChannelData) => {
	await kv.hset(`channel:${data.name}`, data)
}

export const getChannel = async (name: string) => {
	return await kv.hgetall<ChannelData>(`channel:${name}`)
}

export const setUserData = async (uid: number, name: string) => {
	await kv.set(`user:${uid}`, { id: uid, name })
}

export const getUserData = async (uid: number) => {
	return await kv.get<UserData>(`user:${uid}`)
}
