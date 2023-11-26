import { writable } from 'svelte/store'
import { localStorageStore } from '@skeletonlabs/skeleton'
import type {
	User,
	Channel,
	Message,
	AttendanceHost,
	AttendanceMember
} from '@/types/app'

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

// Ability to start and stop attendance detection locally
const createAttendanceMemberStore = () => {
	const { subscribe, set, update } = writable<AttendanceMember>(null)
	return {
		subscribe,
		start: (
			hostId: number,
			duration: number,
			start?: number,
			until?: number
		) => {
			const now = Date.now()
			set({
				hostId,
				duration,
				start: start ?? now,
				until: until ?? now + duration * 1000
			})
		},
		stop: () => {
			update((a) => {
				if (a)
					return {
						...a,
						until: Date.now()
					}
				return a
			})
		},
		reset: () => {
			set(null)
		}
	}
}
export const attendanceMemberStore = createAttendanceMemberStore()

// Ability to send start and stop attendance to the host
const createAttendanceHostStore = () => {
	const { subscribe, set, update } = writable<AttendanceHost>(null)
	return {
		subscribe,
		start: (hostId: number, duration: number) => {
			set({
				action: 'start',
				hostId,
				duration
			})
		},
		stop: () => {
			update((a) => {
				if (a && a.action === 'start') {
					return {
						action: 'stop',
						hostId: a.hostId,
						duration: a.duration
					}
				}
				return a
			})
		},
		reset: () => {
			set(null)
		}
	}
}
export const attendanceHostStore = createAttendanceHostStore()
