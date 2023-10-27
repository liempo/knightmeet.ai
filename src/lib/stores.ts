import { writable } from 'svelte/store'

import type { Member } from '@/types/app'
export const membersStore = writable<Member[]>([])
