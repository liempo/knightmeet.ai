<script lang="ts">
	import { onMount, onDestroy } from 'svelte'

	import { Microphone, Camera } from '@/icons'
	import { Avatar } from '@skeletonlabs/skeleton'

	import { getInitials } from '@/lib/utils'
	import { userStore, membersStore } from '@/lib/stores'
	import type { MeetingMetadata, User } from '@/types/app'

	/*  Agora SDK */
	import AgoraRTC, {
		type IAgoraRTCClient,
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

	export let metadata: MeetingMetadata

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

	$: {
		console.log('localUser', localUser)
		localAudio?.setEnabled(localUser.audio)
		localVideo?.setEnabled(localUser.video)
		localUser.video ? localVideo?.play('localVideoLive') : localVideo?.stop()
	}

	onMount(async () => {
		client.on('user-joined', async (user) => {
			console.log('user-joined', user.uid)
			remoteUsers = [...remoteUsers, user]
		})

		client.on('user-published', async (user, type) => {
			console.log('user-published', user.uid, type)
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
			console.log('user-left', u.uid)
			remoteUsers = remoteUsers.filter((user) => user.uid !== u.uid)
		})

		await client.join(
			metadata.appId,
			metadata.channel,
			metadata.token,
			metadata.uid
		)
		;[localAudio, localVideo] = await AgoraRTC.createMicrophoneAndCameraTracks()
		localVideo?.play('localVideoLive')
		await client.publish([localAudio, localVideo])
	})

	onDestroy(() => {
		remoteUsers = []
		localAudio?.close()
		localVideo?.close()
		client.leave()
		client.removeAllListeners()
	})
</script>

<div class="h-full flex relative">
	<section class="m-auto flex flex-wrap justify-center gap-2">
		<div class="relative">
			<video
				class="card"
				width="320"
				height="240"
				autoplay={true}
				muted={true}
				id="localVideoLive"
			>
				<track kind="captions" />
			</video>

			{#if !localUser.video}
				<Avatar
					class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
					width="w-24"
					initials={getInitials(localUser.name)}
				/>
			{/if}
			<div class="absolute bottom-2 left-2 badge variant-glass-secondary">
				{localUser.name}
				<span>
					<Microphone
						class="w-3 h-3 ml-2"
						on={localUser.audio}
					/>
				</span>
				<span>
					<Camera
						class="w-3 h-3"
						on={localUser.video}
					/>
				</span>
			</div>
		</div>

		{#each remoteUsers as user}
			<div class="relative">
				<video
					class="card"
					width="320"
					height="240"
					autoplay={true}
					muted={true}
					id="remoteVideoLive-{user.uid}"
				>
					<track kind="captions" />
				</video>

				{#if !user.hasVideo}
					<Avatar
						class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
						width="w-24"
						initials={getInitials('Other')}
					/>
				{/if}
				<div class="absolute bottom-2 left-2 badge variant-filled-primary">
					{'Other'}
					<span>
						<Microphone
							class="w-3 h-3 ml-2"
							on={user.hasAudio}
						/>
					</span>
					<span>
						<Camera
							class="w-3 h-3"
							on={user.hasVideo}
						/>
					</span>
				</div>
			</div>
		{/each}
	</section>

	<div
		class="absolute bottom-2 left-2 rounded-full px-2 bg-gradient-to-br variant-gradient-primary-secondary"
	>
		<button
			class="btn btn-icon"
			on:click={() => {
				localUser.audio = !localUser.audio
				userStore.set(localUser)
			}}
		>
			<Microphone on={localUser.audio} />
		</button>

		<button
			class="btn btn-icon"
			on:click={() => {
				localUser.video = !localUser.video
				userStore.set(localUser)
			}}
		>
			<Camera on={localUser.video} />
		</button>
	</div>
</div>