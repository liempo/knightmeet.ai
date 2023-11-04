<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { enhance } from '$app/forms'
	import { page } from '$app/stores'
	import { get } from 'svelte/store'

	import { Microphone, Camera } from '@/icons'
	import { getInitials } from '@/lib/utils'
	import { userStore } from '@/lib/stores'
	import type { User } from '@/types/app'

	import { Avatar } from '@skeletonlabs/skeleton'

	import AgoraRTC, {
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

	import { createFaceLandmarker } from '@/lib/ml'
	import { FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision'
	import type { FaceLandmarker as FaceLandmarkerType } from '@mediapipe/tasks-vision'

	/*  Agora objects from Meeting Component */
	let localAudio: ILocalAudioTrack | null = null
	let localVideo: ILocalVideoTrack | null = null

	/* Current user preferences (get from default) */
	let localUser: User = get(userStore)

	page.subscribe((p) => {
		if (p.form?.action === 'join' && p.form?.body) {
			userStore.set({
				...localUser,
				id: p.form.body.uid
			})
		}
	})

	$: {
		localAudio?.setEnabled(localUser.audio)
		localVideo?.setEnabled(localUser.video)

		localUser.video ? localVideo?.play('localVideoPreview') : localVideo?.stop()
	}

	let landmarker: FaceLandmarkerType
	let overlayRef: HTMLCanvasElement
	let drawingUtils: DrawingUtils
	let lastVideoTime = -1

	const renderLoop = () => {
		const video = document.getElementById(
			'localVideoPreview'
		) as HTMLVideoElement

		if (!landmarker || !video || video.currentTime === lastVideoTime) {
			requestAnimationFrame(renderLoop)
			return
		}

		const timestamp = performance.now()
		const landmarkerResult = landmarker.detectForVideo(video, timestamp)
		lastVideoTime = video.currentTime
		if (overlayRef) {
			const ctx = overlayRef.getContext('2d')
			ctx?.clearRect(0, 0, overlayRef.width, overlayRef.height)
			if (!drawingUtils && ctx) drawingUtils = new DrawingUtils(ctx)
			for (const landmarks of landmarkerResult.faceLandmarks) {
				drawingUtils.drawConnectors(
					landmarks,
					FaceLandmarker.FACE_LANDMARKS_TESSELATION,
					{ color: '#fff', lineWidth: 0.2 }
				)
			}
		}

		requestAnimationFrame(renderLoop)
	}

	onMount(async () => {
		localAudio = await AgoraRTC.createMicrophoneAudioTrack()
		localVideo = await AgoraRTC.createCameraVideoTrack()
		landmarker = await createFaceLandmarker()
	})

	onDestroy(() => {
		localAudio?.close()
		localVideo?.close()
	})
</script>

<div class="h-full flex">
	<div class="m-auto space-y-8">
		<div class="space-y-2">
			<h1 class="h1">Get Ready</h1>
			<p>Setup your audio and profile before joining.</p>
		</div>

		<div class="relative">
			<video
				class="card w-[640px] h-[480px] object-cover"
				autoplay={true}
				muted={true}
				id="localVideoPreview"
				on:loadeddata={renderLoop}
			>
				<track kind="captions" />
			</video>

			<div class="absolute top-0 left-0 w-full h-full -scale-x-[1]">
				<canvas
					class="w-full h-full"
					bind:this={overlayRef}
				/>
			</div>

			{#if !localUser.video && !localVideo?.isPlaying}
				<Avatar
					class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
					width="w-48"
					initials={getInitials(localUser.name)}
				/>
			{/if}
		</div>

		<form
			method="POST"
			class="flex gap-2 w-full items-center justify-between"
			action="?/join"
			use:enhance
		>
			<input
				name="name"
				bind:value={localUser.name}
				type="text"
				placeholder="Enter your name"
				class="input"
			/>
			<button
				type="button"
				class="btn-icon btn-icon-lg variant-filled-tertiary"
				on:click={() => (localUser.audio = !localUser.audio)}
			>
				<Microphone on={localUser.audio} />
			</button>
			<button
				type="button"
				class="btn-icon btn-icon-lg variant-filled-tertiary"
				on:click={() => (localUser.video = !localUser.video)}
			>
				<Camera on={localUser.video} />
			</button>

			<button
				class="btn variant-filled-primary"
				type="submit"
				disabled={!localUser.name}
			>
				Join
			</button>
		</form>
	</div>
</div>
