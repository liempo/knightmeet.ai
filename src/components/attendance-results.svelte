<script lang="ts">
	import { Close, Arrow } from '@/icons'

	import { Avatar } from '@skeletonlabs/skeleton'
	import { scale } from 'svelte/transition'

	import { channelStore, membersStore } from '@/lib/stores'
	import { getInitials } from '@/lib/utils'

	import { getDrawerStore } from '@skeletonlabs/skeleton'
	const drawerStore = getDrawerStore()

	let members = $membersStore.filter(
		(m) => m.presence && m.id !== $channelStore?.ownerId
	)
	let query: string
</script>

<div class="p-8 space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="h3">Attendance results</h3>
		<button
			class="btn-icon variant-filled"
			on:click={() => drawerStore.close()}
		>
			<Arrow direction="right" />
		</button>
	</div>

	<ul class="list">
		{#each members as member}
			<dl class="list-dl bg-surfa">
				<div>
					<span>
						<Avatar
							initials={getInitials(member.name)}
							width="w-8"
							background="bg-surface-600-300-token"
							border={`border-2 ${
								(member.presence ?? 0) > 75
									? 'border-success-800'
									: 'border-error-700'
							}`}
						/>
					</span>

					<span class="flex-auto">
						<dt>{member.name}</dt>
						<dd class="text-sm">
							Presence score: {member.presence?.toFixed(2)}%
						</dd>
					</span>
				</div>
				<!-- ... -->
			</dl>
		{/each}
	</ul>
</div>
