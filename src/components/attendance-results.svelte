<script lang="ts">
	import { Arrow } from '@/icons'

	import { Avatar } from '@skeletonlabs/skeleton'

	import { channelStore, membersStore } from '@/lib/stores'
	import { getInitials } from '@/lib/utils'

	import { getDrawerStore } from '@skeletonlabs/skeleton'
	const drawerStore = getDrawerStore()

	let members = $membersStore.filter(
		(m) => m.presence && m.id !== $channelStore?.ownerId
	)

	const download = () => {
		const csv = [
			['Name', 'Presence score'],
			...members.map((m) => [
				m.name,
				m.presence && m.presence > 50 ? 'Present' : 'Absent'
			])
		]
			.map((e) => e.join(','))
			.join('\n')

		const blob = new Blob([csv], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)

		// filename as current date and time formmated as YYYY-MM-DD_HHMMSS
		const filename = new Date()
			.toISOString()
			.replace(/[-:]/g, '')
			.replace('T', '_')
			.replace(/\..+/, '')

		const a = document.createElement('a')
		a.setAttribute('hidden', '')
		a.setAttribute('href', url)
		a.setAttribute('download', `${filename}.csv`)
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}

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
							{member.presence && member.presence > 50 ? 'Present' : 'Absent'}
						</dd>
					</span>
				</div>
				<!-- ... -->
			</dl>
		{/each}
	</ul>

	<div class="flex justify-end">
		<button
			class="btn btn-sm variant-soft"
			on:click={download}
		>
			Export as CSV
		</button>
	</div>
</div>
