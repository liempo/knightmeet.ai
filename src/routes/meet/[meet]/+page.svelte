<script lang="ts">
	import { onMount } from 'svelte'

	import type { ActionData } from './$types'
	let form: ActionData

	let Meeting: typeof import('@/components/meeting.svelte').default
	onMount(async () => {
		Meeting = (await import('@/components/meeting.svelte')).default
	})
</script>

<body>
	<!-- Meeting needs to be loaded client side -->
	<svelte:component
		this={Meeting}
		metadata={form?.body}
	/>
</body>
