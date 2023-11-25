<script lang="ts">
	import { Microphone, Camera, Close, Arrow } from '@/icons'

	import { Avatar } from '@skeletonlabs/skeleton'
	import { scale } from 'svelte/transition'

	import { membersStore } from '@/lib/stores'
	import { getInitials } from '@/lib/utils'

	import { getDrawerStore } from '@skeletonlabs/skeleton'
	const drawerStore = getDrawerStore()
	let query: string
</script>

<div class="p-8 space-y-4">
	<div class="flex justify-between items-center">
		<h2 class="h2">Members</h2>
		<button
			class="btn-icon variant-filled"
			on:click={() => drawerStore.close()}
		>
			<Arrow direction="right" />
		</button>
	</div>

	<div class="relative">
		<input
			type="text"
			class="input"
			placeholder="Search"
			bind:value={query}
		/>
		{#if query}
			<button
				class="btn-icon btn-icon-sm bg-initial absolute top-1/2 right-2 transform -translate-y-1/2"
				transition:scale
				on:click={() => (query = '')}
			>
				<Close />
			</button>
		{/if}
	</div>

	<ul class="list">
		{#each $membersStore.filter((m) => {
			return query ? m.name.toLowerCase().includes(query.toLowerCase()) : true
		}) as member}
			<li>
				<span>
					<Avatar
						initials={getInitials(member.name)}
						width="w-8"
					/>
				</span>
				<span class="flex-auto">{member.name}</span>
				<span><Camera on={member.video} /></span>
				<span><Microphone on={member.audio} /></span>
			</li>
		{/each}
	</ul>
</div>
