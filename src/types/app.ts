export type User = {
	id?: number
	name: string
	audio: boolean
	video: boolean
}

export type MeetingMetadata = {
	uid: number
	appId: string
	channel: string
	owner: number
	rtcToken: string
	rtmToken: string
}

export type AttendanceUserState = {
	id: number
	presence: number
}

export type AttendanceMonitorState = {
	state: 'idle' | 'active' | 'end'
	data: AttendanceHostData | null
}

export type AttendanceHostData = {
	channel: string
	start: number
	until: number
	users: AttendanceUserState[]
}