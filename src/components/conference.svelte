<script lang="ts">
	import { onMount } from 'svelte'
	import { userStore, membersStore } from '@/lib/stores'
	import { getInitials } from '@/lib/utils'
	import { Avatar } from '@skeletonlabs/skeleton'
	import type { User } from '@/types/app'

	/*  Agora SDK */
	import AgoraRTC, {
		type IAgoraRTCClient,
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

	let remoteUsers: IAgoraRTCRemoteUser[] = []
	let localUser = $userStore
	let localAudio: ILocalAudioTrack | null = null
	let localVideo: ILocalVideoTrack | null = null

	AgoraRTC.setLogLevel(4)
	let client: IAgoraRTCClient = AgoraRTC.createClient({
		mode: 'rtc',
		codec: 'vp8'
	})

	const updateMembersStore = (user: User) =>
		membersStore.update((members) => {
			const index = members.findIndex((m) => m.id === user.id)
			if (members[index]) members[index] = user
			else return [...members, user]
			return members
		})

	onMount(async () => {
		client.on('user-joined', async (user) => {
			console.log('user-joined', user.uid)
			remoteUsers = [...remoteUsers, user]
		})

		client.on('user-published', async (user, type) => {
			console.log('user-published', user.uid)
			remoteUsers[remoteUsers.findIndex((u) => u.uid === user.uid)] = user

			if (type === 'audio') {
				await client.subscribe(user, type)
				user.audioTrack?.play()
			} else if (type === 'video') {
				await client.subscribe(user, type)
				user.videoTrack?.play(`remoteVideoLive-${user.uid}`)
			}
		})

		client.on('user-unpublished', (user, type) => {
			console.log('user-unpublished', user.uid)
			remoteUsers[remoteUsers.findIndex((u) => u.uid === user.uid)] = user
			if (type === 'audio') {
				user.audioTrack?.stop()
			} else if (type === 'video') {
				user.videoTrack?.stop()
			}
		})

		client.on('user-left', (u) => {
			remoteUsers = remoteUsers.filter((user) => user.uid !== u.uid)
		})

		// await client.join(appId, channel, token, uid)
		;[localAudio, localVideo] = await AgoraRTC.createMicrophoneAndCameraTracks()
		localVideo?.play('localVideoLive')
		await client.publish([localAudio, localVideo])
	})

	$: {
		/* Update tracks when localUser changes */
		localAudio?.setEnabled(localUser.audio)
		localVideo?.setEnabled(localUser.video)
	}
</script>

<div class="h-full flex">
	<section class="m-auto flex flex-wrap justify-center gap-2">
		<div class="relative">
			<video
				class="card"
				width="640"
				height="480"
				autoplay={true}
				muted={true}
				id="localVideoLive"
			>
				<track kind="captions" />
			</video>

			{#if !localUser.video}
				<Avatar
					class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
					width="w-48"
					initials={getInitials(localUser.name)}
				/>
			{/if}
		</div>
	</section>
</div>
