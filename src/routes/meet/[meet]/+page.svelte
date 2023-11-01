<script lang="ts">
	import { onMount } from 'svelte'
	let Meeting: typeof import('@/components/meeting.svelte').default
	onMount(async () => {
		Meeting = (await import('@/components/meeting.svelte')).default
	})
</script>

<body>
	<!-- Meeting needs to be loaded client side -->
	<svelte:component this={Meeting} />
</body>
