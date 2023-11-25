<script lang="ts">
	import { page } from '$app/stores'
	import Setup from './setup.svelte'
	import Conference from './conference.svelte'

	import type { MeetingMetadata } from '@/types/app'
	let metadata: MeetingMetadata
	$: metadata = $page.form?.body
</script>

{#if metadata}
	<Conference />
{:else}
	<Setup />
{/if}
