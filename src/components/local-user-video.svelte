<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { Avatar } from '@skeletonlabs/skeleton'
	import { getInitials } from '@/lib/utils'
	import type { User } from '@/types/app'

	import AgoraRTC, {
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

	import { createFaceLandmarker } from '@/lib/ml'
	import { FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision'
	import type { FaceLandmarker as FaceLandmarkerType } from '@mediapipe/tasks-vision'
	import { fade } from 'svelte/transition'

	export let user: User
	let video: HTMLVideoElement
	let overlay: HTMLCanvasElement

	let audioTrack: ILocalAudioTrack | null = null
	let videoTrack: ILocalVideoTrack | null = null

	let faceLandmarker: FaceLandmarkerType
	let drawingUtils: DrawingUtils
	let lastVideoTime = -1

	$: {
		if (!drawingUtils && overlay) {
			const ctx = overlay.getContext('2d')
			if (ctx) drawingUtils = new DrawingUtils(ctx)
		}
	}

	$: {
		if (user.video) videoTrack?.play(video)
		else videoTrack?.stop()
		audioTrack?.setEnabled(user.audio)
		videoTrack?.setEnabled(user.video)
	}

	onMount(async () => {
		videoTrack = await AgoraRTC.createCameraVideoTrack()
		audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
		faceLandmarker = await createFaceLandmarker()
	})

	const render = () => {
		if (
			!faceLandmarker ||
			!video ||
			!overlay ||
			!drawingUtils ||
			video.currentTime === lastVideoTime
		) {
			requestAnimationFrame(render)
			return
		}

		const timestamp = performance.now()
		const landmarkerResult = faceLandmarker.detectForVideo(video, timestamp)
		lastVideoTime = video.currentTime
		console.log('landmarkerResult', landmarkerResult)

		overlay.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height)
		for (const landmarks of landmarkerResult.faceLandmarks) {
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_TESSELATION,
				{ color: '#36454F', lineWidth: 0.3 }
			)
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
		class="card w-[640px] h-[480px] object-cover"
		autoplay={true}
		muted={true}
		bind:this={video}
		on:loadedmetadata={render}
	>
		<track kind="captions" />
	</video>

	<div
		class="absolute top-0 left-0 w-full h-full -scale-x-[1]"
		in:fade={{ duration: 500, delay: 500 }}
	>
		<canvas
			class="w-full h-full"
			bind:this={overlay}
		/>
	</div>

	{#if !user.video && !videoTrack?.isPlaying}
		<Avatar
			class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
			width="w-48"
			initials={getInitials(user.name)}
		/>
	{/if}
</div>
