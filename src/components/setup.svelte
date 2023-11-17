<script lang="ts">
	import { enhance } from '$app/forms'
	import { page } from '$app/stores'
	import { get } from 'svelte/store'

	import { Microphone, Camera, Brain } from '@/icons'
	import { userStore } from '@/lib/stores'
	import type { User } from '@/types/app'

	import LocalUserVideo from './local-user-video.svelte'

	let localUser: User = get(userStore)
	let showTrackingPreview = false

	page.subscribe((p) => {
		if (p.form?.action === 'join' && p.form?.body) {
			userStore.set({
				...localUser,
				id: p.form.body.uid
			})
		}
	})
</script>

<div class="h-full flex">
	<div class="m-auto space-y-8">
		<div class="space-y-2">
			<h1 class="h1">Get Ready</h1>
			<p>Setup your audio and profile before joining.</p>
		</div>

		<LocalUserVideo
			user={localUser}
			{showTrackingPreview}
		/>

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
