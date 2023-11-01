export type User = {
	id?: number
	name: string
	audio: boolean
	video: boolean
}

export type MeetingMetadata = {
	appId: string
	channel: string
	token: string
}
