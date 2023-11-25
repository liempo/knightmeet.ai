<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton'
	import { Table, tableMapperValues } from '@skeletonlabs/skeleton'
	import type { TableSource } from '@skeletonlabs/skeleton'

	export let attendanceData: { name: string; presence: string }[]
	const modalStore = getModalStore()
	const tableSource: TableSource = {
		head: ['Name', 'Presence'],
		body: tableMapperValues(attendanceData ?? [], ['name', 'presence'])
	}
</script>

<div class="card w-1/3 p-4 space-y-8">
	<h3 class="h3">Attendance Results</h3>
	<Table source={tableSource} />

	<div class="flex justify-end">
		<button
			class="btn btn-sm"
			on:click={() => {
				const csv = attendanceData
					.map((row) => {
						return `${row.name},${row.presence}`
					})
					.join('\n')
				const blob = new Blob([csv], { type: 'text/csv' })
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = 'attendance.csv'
				a.click()
				a.remove()
				window.URL.revokeObjectURL(url)
			}}>Download</button
		>
		<button
			class="btn btn-sm variant-filled"
			on:click={() => {
				modalStore.close()
			}}>Done</button
		>
	</div>
</div>
