<script lang="ts">
	import { userStore } from '@/lib/stores'
	import type { MeetingMetadata } from '@/types/app'

	import Setup from './setup.svelte'
	import Conference from './conference.svelte'

	export let metadata: MeetingMetadata | undefined
	$: console.log(metadata)
</script>

{#if metadata}
	<Conference />
{:else}
	<Setup />
{/if}
