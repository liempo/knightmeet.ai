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
	token: string
}
