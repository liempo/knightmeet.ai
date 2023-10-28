<script lang="ts">
	import { Microphone, Camera, User as UserIcon } from '@/icons'
	import type { User } from '@/types/app'
	import { userStore } from '@/lib/stores'
	import { generateUID, getInitials } from '@/lib/utils'

	import { Avatar } from '@skeletonlabs/skeleton'

	import type { ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng'

	/*  Agora objects from Meeting Component */
	export let localAudio: ILocalAudioTrack | null = null
	export let localVideo: ILocalVideoTrack | null = null
	let previewVideoRef: HTMLVideoElement | null = null

	/* Current user preferences */
	let localUser: User = {
		name: '',
		audio: true,
		video: true
	}

	$: {
		localAudio?.setEnabled(localUser.audio)
		localVideo?.setEnabled(localUser.video)

		/* Play local video preview if localUser.id is not set */
		if (!localUser.id && previewVideoRef) {
			localUser.video ? localVideo?.play(previewVideoRef) : localVideo?.stop()
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
				bind:this={previewVideoRef}
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

		<div class="flex gap-2 w-full items-center justify-between">
			<input
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
				on:click={() => {
					localUser.id = generateUID()
					if (localUser.name === '') localUser.name = 'Guest'
					userStore.set(localUser)
				}}
			>
				Join
			</button>
		</div>
	</div>
</div>
