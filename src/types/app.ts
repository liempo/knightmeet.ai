export type User = {
	id?: number
	name: string
	audio: boolean
	video: boolean
	presence?: number
}

export type Channel = {
	name: string
	ownerId: number
}

export type MeetingMetadata = {
	uid: number
	appId: string
	channel: string
	rtcToken: string
	rtmToken: string
}
