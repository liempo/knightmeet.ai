import { writable } from 'svelte/store'
import type { User } from '@/types/app'

// Current user profile (name, audio, video)
export const userStore = writable<User>()

// List of members in the room including the current user
export const membersStore = writable<User[]>([])
