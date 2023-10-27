<script lang="ts">
	import { Members as MembersIcon } from '@/icons'
	import Members from '@/components/members.svelte'
	import Banner from '@/components/banner.svelte'

	import { AppBar, Drawer, LightSwitch } from '@skeletonlabs/skeleton'
	import { getDrawerStore } from '@skeletonlabs/skeleton'

	const drawerStore = getDrawerStore()
</script>

<AppBar class="shadow-lg">
	<svelte:fragment slot="lead"><Banner /></svelte:fragment>
	<svelte:fragment slot="trail">
		<LightSwitch />
		<button
			class="btn-icon btn-icon-sm variant-filled"
			on:click={() => drawerStore.open({ id: 'members' })}
		>
			<MembersIcon />
		</button>
	</svelte:fragment>
</AppBar>

<aside>
	<Drawer
		position="right"
		width="w-5/6 md:w-1/2 lg:w-1/3"
	>
		{#if $drawerStore.id === 'members'}
			<Members />
		{/if}
	</Drawer>
</aside>

<main>
	<slot />
</main>
