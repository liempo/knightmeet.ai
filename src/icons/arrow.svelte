<script lang="ts">
	export let direction: 'left' | 'right'
</script>

{#if direction === 'left'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...$$props}
		><path
			fill="currentColor"
			d="M4 6h2v12H4zm10.293-.707L7.586 12l6.707 6.707l1.414-1.414L11.414 13H20v-2h-8.586l4.293-4.293z"
		/></svg
	>
{:else if direction === 'right'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...$$props}
		><path
			fill="currentColor"
			d="M18 6h2v12h-2zM4 13h8.586l-4.293 4.293l1.414 1.414L16.414 12L9.707 5.293L8.293 6.707L12.586 11H4z"
		/></svg
	>
{/if}
