<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { Avatar } from '@skeletonlabs/skeleton'
	import { getInitials } from '@/lib/utils'
	import type { User } from '@/types/app'

	import AgoraRTC, {
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

	import {
		FaceLandmarker,
		PoseLandmarker,
		DrawingUtils,
		HandLandmarker
	} from '@mediapipe/tasks-vision'
	import {
		createFaceLandmarker,
		createPoseLandmarker,
		createHandLandmarker
	} from '@/lib/ml'
	import type {
		FaceLandmarker as FaceLandmarkerType,
		PoseLandmarker as PoseLandmarkerType,
		HandLandmarker as HandLandmarkerType
	} from '@mediapipe/tasks-vision'
	import type { L } from 'vitest/dist/types-198fd1d9'

	export let user: User
	export let width: string = 'w-[640px]'
	export let height: string = 'h-[480px]'
	export let avatarWidth: string = 'w-48'
	export let video: HTMLVideoElement | null = null
	export let overlay: HTMLCanvasElement | null = null

	export let audioTrack: ILocalAudioTrack | null = null
	export let videoTrack: ILocalVideoTrack | null = null

	let faceLandmarker: FaceLandmarkerType
	let poseLandmarker: PoseLandmarkerType
	let handLandmarker: HandLandmarkerType
	let drawingUtils: DrawingUtils
	let lastVideoTime = -1

	$: {
		if (!drawingUtils && overlay) {
			const ctx = overlay.getContext('2d')
			if (ctx) drawingUtils = new DrawingUtils(ctx)
		}
	}

	$: {
		if (video && user.video) videoTrack?.play(video)
		else {
			videoTrack?.stop()
			overlay?.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height)
		}
		audioTrack?.setEnabled(user.audio)
		videoTrack?.setEnabled(user.video)
	}

	onMount(async () => {
		videoTrack = await AgoraRTC.createCameraVideoTrack()
		audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
		faceLandmarker = await createFaceLandmarker()
		poseLandmarker = await createPoseLandmarker()
		handLandmarker = await createHandLandmarker()
	})

	const render = () => {
		if (
			!faceLandmarker ||
			!poseLandmarker ||
			!handLandmarker ||
			!video ||
			!overlay ||
			!drawingUtils ||
			video.currentTime === lastVideoTime
		) {
			requestAnimationFrame(render)
			return
		}

		const videoWidth = parseInt(width.match(/\d+/)![0])
		const ratio = video.videoHeight / video.videoWidth
		const calculatedHeight = videoWidth * ratio
		video.width = videoWidth
		video.height = calculatedHeight
		overlay.width = videoWidth
		overlay.height = calculatedHeight
		overlay.width = video.videoWidth
		overlay.height = video.videoHeight

		const timestamp = performance.now()
		const startInferenceTime = performance.now()
		const faceLandmarkerResult = faceLandmarker.detectForVideo(video, timestamp)
		const poseLandmarkerResult = poseLandmarker.detectForVideo(video, timestamp)
		const handLandmarkerResult = handLandmarker.detectForVideo(video, timestamp)
		const endInferenceTime = performance.now()
		const inferenceTime = endInferenceTime - startInferenceTime
		console.log('Inference time: ', inferenceTime)
		lastVideoTime = video.currentTime

		for (const landmarks of faceLandmarkerResult.faceLandmarks) {
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_TESSELATION,
				{ color: '#C0C0C070', lineWidth: 1 }
			)
		}

		for (const landmarks of poseLandmarkerResult.landmarks) {
			drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
				color: '#00FF00',
				lineWidth: 1
			})
		}

		for (const landmarks of handLandmarkerResult.landmarks) {
			drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
				color: '#00CC00',
				lineWidth: 5
			})
		}

		requestAnimationFrame(render)
	}

	onDestroy(() => {
		audioTrack?.stop()
		videoTrack?.stop()
	})
</script>

<div class="relative">
	<video
		class={`card ${width} ${height} object-cover`}
		autoplay={true}
		muted={true}
		bind:this={video}
		on:loadedmetadata={render}
	>
		<track kind="captions" />
	</video>

	<div class="absolute top-0 bottom-0 left-0 right-0 -scale-x-[1]">
		<canvas bind:this={overlay} />
	</div>

	{#if !user.video && !videoTrack?.isPlaying}
		<Avatar
			class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
			width={avatarWidth}
			initials={getInitials(user.name)}
		/>
	{/if}
</div>
