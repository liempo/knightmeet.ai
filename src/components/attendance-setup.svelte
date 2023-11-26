<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	const dispatcher = createEventDispatcher()
	const setDuration = (seconds: number) => {
		dispatcher('attendancestart', seconds)
	}
</script>

<div class="btn-group-vertical variant-filled">
	<button on:click={() => setDuration(30 * 60)}>30 minutes</button>
	<button on:click={() => setDuration(15 * 60)}>15 minutes</button>
	<button on:click={() => setDuration(5 * 60)}>5 minutes</button>
	<button on:click={() => setDuration(60)}>60 seconds</button>
</div>
