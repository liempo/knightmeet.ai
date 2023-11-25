export type User = {
	id?: number
	name: string
	audio: boolean
	video: boolean
	presence?: number
}

export type Message = {
	senderId: number
	senderName: string
	content: string
	timestamp: number
}

export type Channel = {
	name: string
	ownerId: number
}

export type ChannelMetadata = {
	uid: number
	appId: string
	channel: string
	rtcToken: string
	rtmToken: string
}

export type Attendance = {
	hostId: number
	duration: number
} | null
