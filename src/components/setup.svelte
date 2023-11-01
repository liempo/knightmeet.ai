<script lang="ts">
	import { onMount } from 'svelte'
	import { Microphone, Camera } from '@/icons'
	import { userStore } from '@/lib/stores'
	import { getInitials } from '@/lib/utils'

	import { Avatar } from '@skeletonlabs/skeleton'

	import type { User } from '@/types/app'
	import AgoraRTC, {
		type ILocalAudioTrack,
		type ILocalVideoTrack
	} from 'agora-rtc-sdk-ng'
	import { enhance } from '$app/forms'

	/*  Agora objects from Meeting Component */
	let localAudio: ILocalAudioTrack | null = null
	let localVideo: ILocalVideoTrack | null = null

	/* Current user preferences */
	let localUser: User = {
		name: '',
		audio: true,
		video: true
	}

	onMount(async () => {
		/* Create local tracks before setup and call */
		localAudio = await AgoraRTC.createMicrophoneAudioTrack()
		localVideo = await AgoraRTC.createCameraVideoTrack()
	})

	$: {
		localAudio?.setEnabled(localUser.audio)
		localVideo?.setEnabled(localUser.video)

		/* Play local video preview if localUser.id is not set */
		if (!localUser.id) {
			localUser.video
				? localVideo?.play('localVideoPreview')
				: localVideo?.stop()
		}
	}
</script>

<div class="h-full flex">
	<div class="m-auto space-y-8">
		<div class="space-y-2">
			<h1 class="h1">Get Ready</h1>
			<p>Setup your audio and profile before joining.</p>
		</div>

		<div class="relative">
			<video
				class="card"
				width="640"
				height="480"
				autoplay={true}
				muted={true}
				id="localVideoPreview"
			>
				<track kind="captions" />
			</video>

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
			>
				Join
			</button>
		</form>
	</div>
</div>
