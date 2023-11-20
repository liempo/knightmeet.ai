<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'

	import Attendance from '@/components/attendance.svelte'
	import { Microphone, Camera, Phone, Crown } from '@/icons'
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton'
	import { getToastStore } from '@skeletonlabs/skeleton'

	import { getInitials } from '@/lib/utils'
	import {
		channelStore,
		membersStore,
		userStore,
		attendanceStore
	} from '@/lib/stores'

	import type { UserData } from '@/lib/kv'
	import type { AttendanceMonitorState, MeetingMetadata } from '@/types/app'
	import type { ModalComponent } from '@skeletonlabs/skeleton'

	/*  Agora SDK */
	import AgoraRTC, {
		type IAgoraRTCClient,
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack,
		type UID
	} from 'agora-rtc-sdk-ng'
	import AgoraRTM from 'agora-rtm-sdk'

	/* MediaPipe */
	import { createFaceLandmarker, createPoseLandmarker } from '@/lib/ml'
	import {
		FaceLandmarker,
		PoseLandmarker,
		DrawingUtils
	} from '@mediapipe/tasks-vision'
	import type {
		FaceLandmarker as FaceLandmarkerType,
		PoseLandmarker as PoseLandmarkerType
	} from '@mediapipe/tasks-vision'

	const toastStore = getToastStore()
	const modalStore = getModalStore()

	export let metadata: MeetingMetadata

	let remoteUsers: IAgoraRTCRemoteUser[] = []
	let localUser = $userStore
	let localAudio: ILocalAudioTrack | null = null
	let localVideo: ILocalVideoTrack | null = null

	let showTrackingPreview = true
	let faceLandmarker: FaceLandmarkerType
	let poseLandmarker: PoseLandmarkerType
	let drawingUtils: DrawingUtils
	let lastVideoTime = -1

	let userDataMap = new Map<string, UserData>()

	AgoraRTC.setLogLevel(4)
	let client: IAgoraRTCClient = AgoraRTC.createClient({
		mode: 'rtc',
		codec: 'vp8'
	})
	let rtm = AgoraRTM.createInstance(metadata.appId)
	let channel = rtm.createChannel(metadata.channel)

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

	let presentFrames = 0
	let totalFrames = 0
	let renderPresenceStart = -1
	let renderPresenceUntil = -1

	/** HOST: Update channel attributes with attendance state */
	$: rtm
		.addOrUpdateChannelAttributes(
			metadata.channel,
			{
				attendanceState: JSON.stringify($attendanceStore),
				attendanceCount: '0'
			},
			{ enableNotificationToChannelMembers: true }
		)
		.then(() => {
			console.log('Updated channel attributes', $attendanceStore)
		})
		.catch((e) => {
			console.error('Failed to update channel attributes', e)
		})

	const renderPresence = () => {
		if (!$userStore.video) {
			totalFrames++
			requestAnimationFrame(renderPresence)
			return
		}

		if (!faceLandmarker || !poseLandmarker) {
			requestAnimationFrame(renderPresence)
			return
		}
		// prettier-ignore
		const video = document.getElementById(
			'localVideoLive'
		) as HTMLVideoElement
		const overlay = document.getElementById(
			'localVideoOverlay'
		) as HTMLCanvasElement

		if (Date.now() > renderPresenceUntil) {
			presentFrames = 0
			totalFrames = 0
			renderPresenceUntil = -1
			renderPresenceStart = -1
			overlay.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height)
			return
		}

		if (!video || !overlay) {
			requestAnimationFrame(renderPresence)
			return
		}

		if (!drawingUtils) {
			const ctx = overlay.getContext('2d')
			if (ctx) drawingUtils = new DrawingUtils(ctx)
		}

		if (video.currentTime === lastVideoTime) {
			requestAnimationFrame(renderPresence)
			return
		}

		overlay.width = video.videoWidth
		overlay.height = video.videoHeight

		const timestamp = performance.now()
		const faceLandmarkerResult = faceLandmarker.detectForVideo(video, timestamp)
		const poseLandmarkerResult = poseLandmarker.detectForVideo(video, timestamp)
		lastVideoTime = video.currentTime

		const isPresent =
			faceLandmarkerResult.faceLandmarks.length > 0 ||
			poseLandmarkerResult.landmarks.length > 0
		if (isPresent) presentFrames++
		totalFrames++

		if (showTrackingPreview) {
			for (const landmarks of faceLandmarkerResult.faceLandmarks) {
				drawingUtils.drawConnectors(
					landmarks,
					FaceLandmarker.FACE_LANDMARKS_TESSELATION,
					{ color: '#36454F', lineWidth: 0.2 }
				)
			}
			for (const landmarks of poseLandmarkerResult.landmarks) {
				drawingUtils.drawLandmarks(landmarks, {
					color: '#36454F',
					radius: 0.5
				})
				drawingUtils.drawConnectors(
					landmarks,
					PoseLandmarker.POSE_CONNECTIONS,
					{
						color: '#36454F',
						lineWidth: 0.2
					}
				)
			}
		}

		requestAnimationFrame(renderPresence)
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

		channel.on('AttributesUpdated', async (attributes) => {
			const attendance: AttendanceMonitorState = JSON.parse(
				attributes.attendanceState.value
			)

			const attendanceCount = attributes.attendanceCount
				? parseInt(attributes.attendanceCount.value)
				: 0

			if (metadata.uid !== metadata.owner)
				switch (attendance.state) {
					case 'idle':
						break
					//  Member will receive attendance start signal
					case 'active':
						toastStore.trigger({
							message: 'Ongoing attendance',
							hideDismiss: true,
							timeout: attendance.data!.until - Date.now()
						})
						renderPresenceStart = attendance.data!.start
						renderPresenceUntil = attendance.data!.until
						renderPresence()
						break
					// Member will receive attendance end signal
					case 'end':
						if (renderPresenceUntil === -1) break
						await rtm.addOrUpdateLocalUserAttributes({
							presence: (presentFrames / totalFrames).toFixed(5)
						})
						await rtm.addOrUpdateChannelAttributes(
							metadata.channel,
							{
								attendanceCount: (attendanceCount + 1).toString()
							},
							{ enableNotificationToChannelMembers: true }
						)
						renderPresenceUntil = -1 // Stop renderPresence
						toastStore.trigger({
							message: 'Attendance recorded',
							background: 'variant-filled-success'
						})
						break
				}
			else {
				switch (attendance.state) {
					case 'end':
						if (attendanceCount !== remoteUsers.length) break
						let attendanceData: { name: string; presence: string }[] = []
						for (const member of remoteUsers) {
							const { name } = getUserData(member.uid)
							const attributes = await rtm.getUserAttributes(
								member.uid.toString()
							)
							const presence = parseFloat(attributes.presence ?? '0')
							attendanceData.push({
								name: name,
								presence: (presence * 100).toFixed(2) + '%'
							})
						}

						const attendanceModal: ModalComponent = {
							ref: Attendance,
							props: { attendanceData }
						}

						modalStore.trigger({
							type: 'component',
							component: attendanceModal
						})
				}
			}
		})

		faceLandmarker = await createFaceLandmarker()
		poseLandmarker = await createPoseLandmarker()

		await client.join(
			metadata.appId,
			metadata.channel,
			metadata.rtcToken,
			metadata.uid
		)
		;[localAudio, localVideo] = await AgoraRTC.createMicrophoneAndCameraTracks()
		localVideo?.play('localVideoLive')
		channelStore.set(metadata)
		await client.publish([localAudio, localVideo])
		await rtm.login({ uid: metadata.uid.toString(), token: metadata.rtmToken })
		await channel.join()
	})

	const leave = async () => {
		remoteUsers = []
		faceLandmarker.close()
		poseLandmarker.close()
		client.removeAllListeners()
		channel.removeAllListeners()
		rtm.removeAllListeners()
		localAudio?.close()
		localVideo?.close()
		await client.leave()
	}

	onDestroy(async () => await leave())
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

			<div class="absolute top-0 left-0 w-[320px] h-[240px] -scale-x-[1]">
				<canvas
					class="w-full h-full"
					id="localVideoOverlay"
				/>
			</div>

			{#if !localUser.video}
				<Avatar
					class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
					width="w-24"
					initials={getInitials(localUser.name)}
				/>
			{/if}
			<div class="absolute bottom-2 left-2 badge variant-glass-secondary">
				<span class="mr-1">{localUser.name}</span>
				{#if metadata.owner === localUser.id}
					<span>
						<Crown class="w-3 h-3" />
					</span>
				{/if}
				<span>
					<Microphone
						class="w-3 h-3"
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
					<span class="mr-1">{getUserData(user.uid).name}</span>

					{#if metadata.owner === parseInt(user.uid.toString())}
						<span>
							<Crown class="w-3 h-3" />
						</span>
					{/if}
					<span>
						<Microphone
							class="w-3 h-3"
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
				on:click={() => {
					goto('/')
					leave()
				}}
			>
				<Phone />
			</button>
		</div>
	</div>
</div>
