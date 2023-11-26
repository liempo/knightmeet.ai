<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton'
	import { getInitials, formatShortTime } from '@/lib/utils'
	import { Arrow, Send } from '@/icons'

	import { getDrawerStore } from '@skeletonlabs/skeleton'
	import { messagesStore, draftStore, userStore } from '@/lib/stores'

	const drawerStore = getDrawerStore()

	let draft: string = ''

	const send = () => {
		draft = draft.trim()
		if (!draft) return
		draftStore.set(draft)
		draft = ''
	}

	const getElapsed = (timestamp: number): string => {
		const now = Date.now()
		const elapsed = now - timestamp
		return formatShortTime(elapsed)
	}
</script>

<div class="h-full p-8 space-y-4 flex flex-col">
	<div class="flex justify-between items-center">
		<h2 class="h2">Chat</h2>
		<button
			class="btn-icon variant-filled"
			on:click={() => drawerStore.close()}
		>
			<Arrow direction="right" />
		</button>
	</div>

	<div class="grow flex flex-col items-stretch justify-between gap-8">
		<!-- Conversation -->
		<section class="overflow-y-auto space-y-4 flex-1 py-4">
			{#each $messagesStore as message}
				{#if message.senderId !== $userStore.id}
					<div class="grid grid-cols-[auto_1fr] gap-2">
						<Avatar
							initials={getInitials(message.senderName)}
							width="w-12"
						/>
						<div class="card p-4 variant-soft rounded-tl-none space-y-2">
							<header class="flex justify-between items-center">
								<p class="font-bold">{message.senderName}</p>
								<small class="opacity-50">{getElapsed(message.timestamp)}</small
								>
							</header>
							<p>{message.content}</p>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-[1fr_auto] gap-2">
						<div class="card p-4 rounded-tr-none space-y-2">
							<header class="flex justify-between items-center">
								<p class="font-bold">{message.senderName}</p>
								<small class="opacity-50">{getElapsed(message.timestamp)}</small
								>
							</header>
							<p>{message.content}</p>
						</div>
						<Avatar
							initials={getInitials(message.senderName)}
							width="w-12"
						/>
					</div>
				{/if}
			{/each}
		</section>

		<!-- Prompt -->
		<section class="shrink-0 py-4">
			<div
				class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token"
			>
				<textarea
					bind:value={draft}
					class="col-span-2 bg-transparent border-0 ring-0"
					name="prompt"
					id="prompt"
					placeholder="Write a message..."
					rows="1"
					on:keydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							send()
						}
					}}
				/>
				<button
					class={draft ? 'variant-filled-primary' : 'input-group-shim'}
					on:click={send}
				>
					<Send />
				</button>
			</div>
		</section>
	</div>
</div>
