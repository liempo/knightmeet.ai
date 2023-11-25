import { writable } from 'svelte/store'
import { localStorageStore } from '@skeletonlabs/skeleton'
import type { User, Channel } from '@/types/app'

// Current user profile (name, audio, video)
// export const userStore = writable<User>()
export const userStore = localStorageStore<User>('user', {
	name: '',
	audio: true,
	video: true
})

export const channelStore = writable<Channel>()

const createMembersStore = () => {
	const { subscribe, set, update } = writable<User[]>([])
	return {
		subscribe,
		set,
		update: (id: number, audio: boolean, video: boolean) =>
			update((users) =>
				users.map((user) => {
					if (user.id === id)
						return {
							...user,
							audio,
							video
						}
					return user
				})
			),
		add: (user: User) => update((users) => [...users, user]),
		remove: (id: number) =>
			update((users) => users.filter((user) => user.id !== id))
	}
}
export const membersStore = createMembersStore()
