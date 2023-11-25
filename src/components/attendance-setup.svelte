<script lang="ts">
	import { RadioGroup, RadioItem, getModalStore } from '@skeletonlabs/skeleton'

	let minutes = 60

	const modalStore = getModalStore()
</script>

<div class="card w-1/3 p-4 space-y-8">
	<h3 class="h3">Attendance Start</h3>

	<div class="">
		<RadioGroup>
			<RadioItem
				name="15"
				bind:group={minutes}
				value={0}
			>
				15 minutes
			</RadioItem>
			<RadioItem
				name="30"
				bind:group={minutes}
				value={30}
			>
				30 minutes
			</RadioItem>
			<RadioItem
				name="60"
				bind:group={minutes}
				value={60}
			>
				60 minutes
			</RadioItem>
		</RadioGroup>
	</div>

	<div class="flex justify-end gap-2">
		<button
			class="btn btn-sm"
			on:click|preventDefault={() => {
				modalStore.close()
			}}
		>
			Cancel
		</button>
		<button
			class="btn btn-sm variant-filled"
			on:click={() => {
				modalStore.close()
			}}
		>
			Start
		</button>
	</div>
</div>
