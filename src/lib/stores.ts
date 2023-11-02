import { writable } from 'svelte/store'
import { localStorageStore } from '@skeletonlabs/skeleton'
import type { User } from '@/types/app'

// Current user profile (name, audio, video)
// export const userStore = writable<User>()
export const userStore = localStorageStore<User>('user', {
	name: '',
	audio: true,
	video: true
})

// List of members in the room including the current user
export const membersStore = writable<User[]>([])
