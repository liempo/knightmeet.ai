<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'

	/* Components */
	import {
		Avatar,
		getToastStore,
		getDrawerStore,
		ProgressRadial
	} from '@skeletonlabs/skeleton'
	import { Microphone, Camera, Phone, Crown } from '@/icons'
	import { getInitials, formatShortTime } from '@/lib/utils'

	const toastStore = getToastStore()
	const drawerStore = getDrawerStore()
	let timer: ReturnType<typeof setInterval>
	let timerString: string = ''

	const startTimer = (until: number) => {
		timer = setInterval(() => {
			const elapsed = until - Date.now()
			if (elapsed <= 0) {
				timerString = ''
				clearInterval(timer)
				return
			}
			timerString = `Attendance: ${formatShortTime(elapsed)}`
		}, 1000)
	}

	const clearTimer = () => {
		timerString = ''
		clearInterval(timer)
	}

	/* App State */
	import {
		userStore,
		channelStore,
		membersStore,
		messagesStore,
		draftStore,
		attendanceHostStore,
		attendanceMemberStore
	} from '@/lib/stores'
	import type { ChannelMetadata } from '@/types/app'

	export let metadata: ChannelMetadata
	let localUser = $userStore

	$: {
		localAudioTrack?.setEnabled(localUser.audio)
		localVideoTrack?.setEnabled(localUser.video)
		localUser.video
			? localVideoTrack?.play('localVideoLive')
			: localVideoTrack?.stop()
	}

	$: membersStore.set([
		localUser,
		...remoteRtcUsers.map((u) => ({
			id: parseInt(u.uid.toString()),
			name: getMemberName(u.uid.toString()),
			audio: u.hasAudio,
			video: u.hasVideo
		}))
	])

	const presenceUnsub = membersStore.subscribe((members) => {
		if (!$attendanceHostStore || $attendanceHostStore.action !== 'stop') return

		const membersWithPresence = members.filter(
			(m) => m.presence && m.id !== localUser.id
		)
		if (membersWithPresence.length >= members.length / 2) {
			drawerStore.open({ id: 'attendance' })
			attendanceHostStore.reset()
		}
	})

	const draftUnsub = draftStore.subscribe((draft) => {
		if (!draft) return

		rtmChannel.sendMessage({ text: draft })
		draftStore.set('')
		const message = {
			senderId: metadata.uid,
			senderName: localUser.name,
			content: draft,
			timestamp: Date.now()
		}
		messagesStore.update((messages) => [...messages, message])
	})

	const attendanceHostUnsub = attendanceHostStore.subscribe(
		async (attendance) => {
			if (!attendance) {
				clearTimer()
				return
			}
			switch (attendance.action) {
				case 'start':
					const now = Date.now()
					await rtm.addOrUpdateChannelAttributes(metadata.channel, {
						attendance: JSON.stringify({
							hostId: metadata.uid,
							duration: attendance.duration,
							start: now,
							until: now + attendance.duration * 1000
						})
					})
					await rtmChannel.sendMessage({
						text: `/attendance_start ${attendance.duration}`
					})
					toastStore.trigger({
						message: 'Attendance triggered'
					})
					startTimer(now + attendance.duration * 1000)
					break
				case 'stop':
					await rtm.deleteChannelAttributesByKeys(metadata.channel, [
						'attendance'
					])
					await rtmChannel.sendMessage({
						text: '/attendance_stop'
					})
					toastStore.trigger({
						message: 'Attendance manually stopped'
					})
					clearTimer()
					break
			}
		}
	)

	const attendanceMemberUnsub = attendanceMemberStore.subscribe(
		async (attendance) => {
			if (!attendance) {
				clearTimer()
				return
			}
			if (attendance.until > Date.now()) startTimer(attendance.until)
		}
	)

	/* Setup Agora RTM */
	import AgoraRTM from 'agora-rtm-sdk'
	let rtm = AgoraRTM.createInstance(metadata.appId)
	let rtmChannel = rtm.createChannel(metadata.channel)
	let memberNames = new Map<string, string>()

	const getMemberName = (uid: string) => {
		const name = memberNames.get(uid)
		return name ? name : 'Mysterious Stranger'
	}

	const joinRtmChannel = async () => {
		await rtm.login({
			uid: metadata.uid.toString(),
			token: metadata.rtmToken
		})
		await rtm.setLocalUserAttributes({
			name: localUser.name
		})
		await rtmChannel.join()

		// Get or assign channel ownerId
		const attributes = await rtm.getChannelAttributes(metadata.channel)
		console.log('Channel attributes', attributes)
		if (!attributes.createdBy) {
			const newOwner = metadata.uid
			await rtm.addOrUpdateChannelAttributes(metadata.channel, {
				createdBy: newOwner.toString()
			})
			channelStore.set({
				name: metadata.channel,
				ownerId: newOwner
			})
		} else {
			const oldOwner = parseFloat(attributes.createdBy.value)
			channelStore.set({
				name: metadata.channel,
				ownerId: oldOwner
			})
		}

		if (attributes.attendance) {
			const attendance = JSON.parse(attributes.attendance.value)
			// If attendance is still on-going, start it
			if (attendance.hostId !== metadata.uid && Date.now() < attendance.until) {
				attendanceMemberStore.start(
					attendance.hostId,
					attendance.duration,
					attendance.start,
					attendance.until
				)
				toastStore.trigger({
					message: 'Attendance in progress'
				})
				render()
			}
		}

		rtmChannel.on('ChannelMessage', async ({ text }, senderId) => {
			if (!text) return
			switch (text.split(' ')[0]) {
				case '/attendance_start':
					const duration = parseInt(text.split(' ')[1])
					attendanceMemberStore.start(parseInt(senderId), duration)
					render()
					toastStore.trigger({
						message: 'Attendance started. Please open your camera.'
					})
					break
				case '/attendance_stop':
					attendanceMemberStore.stop()
					toastStore.trigger({
						message: 'Attendance ended by host'
					})
					clearTimer()
					break
				case '/attendance_save':
					membersStore.update((members) => {
						const presence = parseInt(text.split(' ')[1])
						const index = members.findIndex((m) => m.id === parseInt(senderId))
						if (index > -1) members[index].presence = presence
						return members
					})
					break

				default:
					const attributes = await rtm.getUserAttributes(senderId)
					const message = {
						senderId: parseInt(senderId),
						senderName: attributes.name
							? attributes.name
							: 'Mysterious Stranger',
						content: text,
						timestamp: Date.now()
					}
					messagesStore.update((messages) => [...messages, message])
					break
			}
		})
	}

	/*  Setup Agora RTC */
	import AgoraRTC, {
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

	AgoraRTC.setLogLevel(4)
	let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
	let localAudioTrack: ILocalAudioTrack | null = null
	let localVideoTrack: ILocalVideoTrack | null = null
	let remoteRtcUsers: IAgoraRTCRemoteUser[] = []

	const updateRemoteRtcUser = (
		user: IAgoraRTCRemoteUser,
		remove: boolean = false
	) => {
		const index = remoteRtcUsers.findIndex((u) => u.uid === user.uid)
		if (index > -1)
			if (remove)
				remoteRtcUsers = remoteRtcUsers.filter((u) => u.uid !== user.uid)
			else remoteRtcUsers[index] = user
		else remoteRtcUsers = [...remoteRtcUsers, user]
	}

	const joinRtcChannel = async () => {
		client.on('user-joined', async (user) => {
			console.log('user-joined', user)
			const attributes = await rtm.getUserAttributes(user.uid.toString())
			if (attributes.name) memberNames.set(user.uid.toString(), attributes.name)
			updateRemoteRtcUser(user)
		})

		client.on('user-left', (user) => {
			console.log('user-left', user)
			updateRemoteRtcUser(user, true)

			console.log(
				'attendanceMemberStore',
				$attendanceMemberStore,
				$attendanceMemberStore &&
					user.uid.toString() === $attendanceMemberStore.hostId.toString()
			)
			if (
				$attendanceMemberStore &&
				user.uid.toString() === $attendanceMemberStore.hostId.toString()
			) {
				attendanceMemberStore.stop()
				toastStore.trigger({
					message: 'Attendance ended, host left',
					background: 'variant-filled-error'
				})
			}
		})

		client.on('user-published', async (user, mediaType) => {
			console.log('user-published', user, mediaType)
			updateRemoteRtcUser(user)
			await client.subscribe(user, mediaType)
			if (mediaType === 'audio') user.audioTrack?.play()
			else if (mediaType === 'video')
				user.videoTrack?.play(`remoteVideoLive-${user.uid}`)
		})

		client.on('user-unpublished', (user, mediaType) => {
			console.log('user-unpublished', user, mediaType)
			if (mediaType === 'audio') user.audioTrack?.stop()
			else if (mediaType === 'video') user.videoTrack?.stop()
			updateRemoteRtcUser(user)
		})

		await client.join(
			metadata.appId,
			metadata.channel,
			metadata.rtcToken,
			metadata.uid
		)
		;[localAudioTrack, localVideoTrack] =
			await AgoraRTC.createMicrophoneAndCameraTracks()
		await client.publish([localAudioTrack, localVideoTrack])
	}

	/* Setup ML */
	// prettier-ignore
	import {  
		createFaceLandmarker,
		createPoseLandmarker 
	} from '@/lib/ml'
	import {
		FaceLandmarker,
		PoseLandmarker,
		DrawingUtils
	} from '@mediapipe/tasks-vision'
	import type {
		FaceLandmarker as FaceLandmarkerType,
		PoseLandmarker as PoseLandmarkerType
	} from '@mediapipe/tasks-vision'

	let faceLandmarker: FaceLandmarkerType
	let poseLandmarker: PoseLandmarkerType
	let localVideoRef: HTMLVideoElement
	let localOverlayRef: HTMLCanvasElement

	const createLandmarkers = async () => {
		faceLandmarker = await createFaceLandmarker()
		poseLandmarker = await createPoseLandmarker()
	}

	let drawingUtils: DrawingUtils
	let lastVideoTime = -1
	let presentFrames = 0
	const expectedFrameTime = 30
	$: {
		if (!drawingUtils && localOverlayRef) {
			const ctx = localOverlayRef.getContext('2d')
			if (ctx) drawingUtils = new DrawingUtils(ctx)
		}
	}

	const render = () => {
		if ($attendanceMemberStore && Date.now() >= $attendanceMemberStore.until) {
			localOverlayRef
				.getContext('2d')
				?.clearRect(0, 0, localVideoRef.videoWidth, localVideoRef.videoHeight)

			const expectedTotalFrames =
				((($attendanceMemberStore.until - $attendanceMemberStore.start) /
					1000) *
					expectedFrameTime) /
				2
			const presence = (presentFrames / expectedTotalFrames) * 100
			console.log(
				'Rendering attendance results',
				presence,
				presentFrames,
				expectedTotalFrames
			)
			rtmChannel.sendMessage({
				text: `/attendance_save ${presence.toPrecision(2)}`
			})

			presentFrames = 0
			return // Stop rendering if attendance is over
		}

		if (
			!localVideoRef ||
			!localOverlayRef ||
			!faceLandmarker ||
			!poseLandmarker ||
			!drawingUtils ||
			!localUser.video ||
			localVideoRef.currentTime === lastVideoTime
		) {
			setTimeout(() => requestAnimationFrame(render), 1000 / expectedFrameTime)
			return
		}

		localOverlayRef.width = localVideoRef.videoWidth
		localOverlayRef.height = localVideoRef.videoHeight

		const timestamp = performance.now()
		const faceLandmarkerResult = faceLandmarker.detectForVideo(
			localVideoRef,
			timestamp
		)
		const poseLandmarkerResult = poseLandmarker.detectForVideo(
			localVideoRef,
			timestamp
		)
		lastVideoTime = localVideoRef.currentTime

		if (
			faceLandmarkerResult.faceLandmarks.length > 0 ||
			poseLandmarkerResult.landmarks.length > 0
		)
			presentFrames++

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
			drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
				color: '#36454F',
				lineWidth: 0.2
			})
		}

		setTimeout(() => requestAnimationFrame(render), 1000 / expectedFrameTime)
	}

	/* Lifecycle */
	onMount(async () => {
		await joinRtmChannel()
		await joinRtcChannel()
		await createLandmarkers()
	})

	onDestroy(async () => {
		clearInterval(timer)
		draftUnsub()
		presenceUnsub()
		attendanceHostUnsub()
		attendanceMemberUnsub()
		localAudioTrack?.stop()
		localVideoTrack?.stop()
		faceLandmarker?.close()
		poseLandmarker?.close()
		client.removeAllListeners()
		rtm.removeAllListeners()
		await client.leave()
		await rtmChannel.leave()
		await rtm.logout()
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
				bind:this={localVideoRef}
				on:loadedmetadata={() => {
					if (
						$attendanceMemberStore &&
						Date.now() >= $attendanceMemberStore.until
					)
						render()
				}}
			>
				<track kind="captions" />
			</video>

			<div class="absolute top-0 left-0 w-[320px] h-[240px] -scale-x-[1]">
				<canvas
					class="w-full h-full"
					id="localVideoOverlay"
					bind:this={localOverlayRef}
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
				{#if $channelStore && $channelStore.ownerId === localUser.id}
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

		{#each remoteRtcUsers as rtcUser}
			<div class="relative">
				<video
					class="card w-[320px] h-[240px]"
					autoplay={true}
					muted={true}
					id={`remoteVideoLive-${rtcUser.uid}`}
				>
					<track kind="captions" />
				</video>

				{#if !rtcUser.hasVideo}
					<Avatar
						class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
						width="w-24"
						initials={getInitials(getMemberName(rtcUser.uid.toString()))}
					/>
				{/if}

				<div class="absolute bottom-2 left-2 badge variant-glass-secondary">
					<span class="mr-1">{getMemberName(rtcUser.uid.toString())}</span>
					{#if $channelStore && $channelStore.ownerId === parseInt(rtcUser.uid.toString())}
						<span>
							<Crown class="w-3 h-3" />
						</span>
					{/if}
					<span>
						<Microphone
							class="w-3 h-3"
							on={rtcUser.hasAudio}
						/>
					</span>
					<span>
						<Camera
							class="w-3 h-3"
							on={rtcUser.hasVideo}
						/>
					</span>
				</div>
			</div>
		{/each}
	</section>

	<div class="absolute bottom-2 left-2 right-2 flex justify-center">
		<div class="rounded-full variant-soft-surface flex items-center">
			{#if timerString}
				<ProgressRadial
					width="w-4"
					class="ml-4"
				/>
				<p class="p-2 text-xs text-surface-900-50-token">
					{timerString}
				</p>
				<div class="w-px h-6 bg-surface-700-200-token" />
			{/if}

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
				}}
			>
				<Phone />
			</button>
		</div>
	</div>
</div>
