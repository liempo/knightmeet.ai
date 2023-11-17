import { writable } from 'svelte/store'
import { localStorageStore } from '@skeletonlabs/skeleton'
import type { AttendanceMonitorState, MeetingMetadata, User } from '@/types/app'

// Current user profile (name, audio, video)
// export const userStore = writable<User>()
export const userStore = localStorageStore<User>('user', {
	name: '',
	audio: true,
	video: true
})

export const channelStore = writable<MeetingMetadata>()

// List of members in the room including the current user
export const membersStore = writable<User[]>([])

// Attendance monitor state
export const attendanceStore = writable<AttendanceMonitorState>({
	state: 'idle',
	data: null
})