import { writable } from 'svelte/store'
import { localStorageStore } from '@skeletonlabs/skeleton'
import type { User, Channel, Message } from '@/types/app'

// Current user profile (name, audio, video)
// export const userStore = writable<User>()
export const userStore = localStorageStore<User>('user', {
	name: '',
	audio: true,
	video: true
})

export const channelStore = writable<Channel>()

export const membersStore = writable<User[]>([])

export const messagesStore = writable<Message[]>([])

export const draftStore = writable<string>('')
