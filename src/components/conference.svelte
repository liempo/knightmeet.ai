<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'

	import { Microphone, Camera, Phone } from '@/icons'
	import { Avatar } from '@skeletonlabs/skeleton'

	import { getInitials } from '@/lib/utils'
	import { membersStore, userStore } from '@/lib/stores'
	import type { UserData } from '@/lib/kv'
	import type { MeetingMetadata } from '@/types/app'

	/*  Agora SDK */
	import AgoraRTC, {
		type IAgoraRTCClient,
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack,
		type UID
	} from 'agora-rtc-sdk-ng'

	export let metadata: MeetingMetadata

	let remoteUsers: IAgoraRTCRemoteUser[] = []
	let localUser = $userStore
	let localAudio: ILocalAudioTrack | null = null
	let localVideo: ILocalVideoTrack | null = null

	let userDataMap = new Map<string, UserData>()

	AgoraRTC.setLogLevel(4)
	let client: IAgoraRTCClient = AgoraRTC.createClient({
		mode: 'rtc',
		codec: 'vp8'
	})

	$: {
		console.log('localUser', localUser)
		localAudio?.setEnabled(localUser.audio)
		localVideo?.setEnabled(localUser.video)
		localUser.video ? localVideo?.play('localVideoLive') : localVideo?.stop()
	}

	$: membersStore.set([
		localUser,
		...remoteUsers.map((u) => ({
			id: parseInt(u.uid.toString()),
			name: getUserData(u.uid).name,
			audio: u.hasAudio,
			video: u.hasVideo
		}))
	])

	const getUserData = (id: UID) => {
		const uid = id.toString()
		return userDataMap.get(uid) ?? { id: -1, name: 'Guest' }
	}

	const updateRemoteUser = (
		user: IAgoraRTCRemoteUser,
		remove: boolean = false
	) => {
		const index = remoteUsers.findIndex((u) => u.uid === user.uid)
		if (index > -1)
			if (remove) remoteUsers = remoteUsers.filter((u) => u.uid !== user.uid)
			else remoteUsers[index] = user
		else remoteUsers = [...remoteUsers, user]
	}

	onMount(async () => {
		client.on('user-joined', async (user) => {
			console.log('user-joined', user.uid)
			const uid = user.uid.toString()
			userDataMap.set(
				uid,
				await fetch(`/api/user/${uid}`).then((r) => r.json())
			)
			updateRemoteUser(user)
		})

		client.on('user-published', async (user, type) => {
			console.log('user-published', user.uid, type)
			updateRemoteUser(user)

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
			updateRemoteUser(user)

			if (type === 'audio') {
				user.audioTrack?.stop()
			} else if (type === 'video') {
				user.videoTrack?.stop()
			}
		})

		client.on('user-left', (u) => {
			console.log('user-left', u.uid)
			updateRemoteUser(u, true)
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
				class="card w-[320px] h-[240px]"
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
					class="card w-[320px] h-[240px]"
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
						initials={getInitials(getUserData(user.uid).name)}
					/>
				{/if}
				<div class="absolute bottom-2 left-2 badge variant-glass-secondary">
					{getUserData(user.uid).name}
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

	<div class="absolute bottom-2 left-2 right-2 flex justify-center">
		<div class="rounded-full px-1 variant-soft-surface">
			<button
				class="btn-icon"
				on:click={() => {
					localUser.audio = !localUser.audio
					userStore.set(localUser)
				}}
			>
				<Microphone on={localUser.audio} />
			</button>

			<button
				class="btn-icon"
				on:click={() => {
					localUser.video = !localUser.video
					userStore.set(localUser)
				}}
			>
				<Camera on={localUser.video} />
			</button>

			<button
				class="btn-icon btn-icon-sm variant-filled-error mr-1"
				on:click={async () => {
					remoteUsers = []
					localAudio?.close()
					localVideo?.close()
					client.removeAllListeners()
					await client.leave()
					goto('/')
				}}
			>
				<Phone />
			</button>
		</div>
	</div>
</div>
