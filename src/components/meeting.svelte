<script lang="ts">
	import { onMount } from 'svelte'

	/*  Agora SDK */
	import AgoraRTC, {
		type IAgoraRTCClient,
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'
	import type { User } from '@/types/app'
	import Setup from './setup.svelte'

	let remoteUsers: IAgoraRTCRemoteUser[] = []
	let localAudio: ILocalAudioTrack | null = null
	let localVideo: ILocalVideoTrack | null = null
	let rtcClient: IAgoraRTCClient = AgoraRTC.createClient({
		mode: 'rtc',
		codec: 'vp8'
	})

	onMount(async () => {
		/* Create local tracks before setup and call */
		localAudio = await AgoraRTC.createMicrophoneAudioTrack()
		localVideo = await AgoraRTC.createCameraVideoTrack()
	})
</script>

<Setup
	bind:localAudio
	bind:localVideo
/>
