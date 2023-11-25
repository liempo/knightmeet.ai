<script lang="ts">
	import { enhance } from '$app/forms'
	import { page } from '$app/stores'
	import { get } from 'svelte/store'
	import { onMount, onDestroy } from 'svelte'

	import type { User } from '@/types/app'
	import { Microphone, Camera, Brain } from '@/icons'
	import { Avatar } from '@skeletonlabs/skeleton'

	import { userStore } from '@/lib/stores'
	import { getInitials } from '@/lib/utils'

	import AgoraRTC, {
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'

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

	let audioTrack: ILocalAudioTrack | null = null
	let videoTrack: ILocalVideoTrack | null = null

	let localUser: User = get(userStore)

	let video: HTMLVideoElement
	let overlay: HTMLCanvasElement

	let faceLandmarker: FaceLandmarkerType
	let poseLandmarker: PoseLandmarkerType
	let drawingUtils: DrawingUtils
	let lastVideoTime = -1
	let showTrackingPreview = false

	page.subscribe((p) => {
		if (p.form?.action === 'join' && p.form?.body) {
			userStore.set({
				...localUser,
				id: p.form.body.uid
			})
		}
	})

	onMount(async () => {
		videoTrack = await AgoraRTC.createCameraVideoTrack()
		audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
		faceLandmarker = await createFaceLandmarker()
		poseLandmarker = await createPoseLandmarker()
	})

	$: {
		if (localUser.video) videoTrack?.play(video)
		else videoTrack?.stop()
		audioTrack?.setEnabled(localUser.audio)
		videoTrack?.setEnabled(localUser.video)
	}

	$: {
		if (!drawingUtils && overlay) {
			const ctx = overlay.getContext('2d')
			if (ctx) drawingUtils = new DrawingUtils(ctx)
		}
	}

	const render = () => {
		if (
			!faceLandmarker ||
			!poseLandmarker ||
			!video ||
			!overlay ||
			!drawingUtils ||
			video.currentTime === lastVideoTime
		) {
			requestAnimationFrame(render)
			return
		}

		overlay.width = video.videoWidth
		overlay.height = video.videoHeight

		const timestamp = performance.now()
		const faceLandmarkerResult = faceLandmarker.detectForVideo(video, timestamp)
		const poseLandmarkerResult = poseLandmarker.detectForVideo(video, timestamp)
		lastVideoTime = video.currentTime

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

		requestAnimationFrame(render)
	}

	onDestroy(() => {
		videoTrack?.stop()
		audioTrack?.stop()
		faceLandmarker.close()
		poseLandmarker.close()
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
				bind:this={video}
			>
				<track kind="captions" />
			</video>

			<div class="absolute top-0 left-0 w-[640px] h-[480px] -scale-x-[1]">
				<canvas
					class="w-full h-full"
					bind:this={overlay}
				/>
			</div>

			{#if !localUser.video && !videoTrack?.isPlaying}
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
				name="uid"
				bind:value={localUser.id}
				type="hidden"
			/>

			<input
				name="name"
				bind:value={localUser.name}
				type="text"
				placeholder="Enter your name"
				class="input"
			/>

			<button
				type="button"
				class="btn btn-sm variant-filled-tertiary"
				disabled={!localUser.video}
				on:click={() => (showTrackingPreview = !showTrackingPreview)}
			>
				<span>
					<Brain on={showTrackingPreview} />
				</span>
				<span>AI</span>
			</button>

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
