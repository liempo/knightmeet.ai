<script lang="ts">
	import { page } from '$app/stores'

	import { Members as MembersIcon } from '@/icons'
	import Members from '@/components/members-list.svelte'
	import Banner from '@/components/banner.svelte'

	import {
		AppShell,
		AppBar,
		Drawer,
		Toast,
		Modal
	} from '@skeletonlabs/skeleton'
	import { getDrawerStore } from '@skeletonlabs/skeleton'
	import { channelStore, attendanceStore } from '@/lib/stores'

	const drawerStore = getDrawerStore()

	const startAttendance = (seconds: number) => {
		attendanceStore.set({
			state: 'active',
			data: {
				channel: $channelStore.channel,
				start: Date.now(),
				until: Date.now() + seconds * 1000,
				users: []
			}
		})
	}
</script>

<svelte:head>
	<title>KnightMeet | {$page.params.channel}</title>
</svelte:head>

<AppShell>
	<Drawer
		position="right"
		width="w-5/6 md:w-1/2 lg:w-1/3"
	>
		{#if $drawerStore.id === 'members'}
			<Members />
		{/if}
	</Drawer>
	<svelte:fragment slot="header">
		<AppBar class="shadow-lg">
			<svelte:fragment slot="lead">
				<a href="/">
					<Banner />
				</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				{#if $channelStore && $channelStore.uid === $channelStore.owner}
					<button
						class={`btn btn-sm ${
							$attendanceStore.state === 'active'
								? 'variant-filled-error'
								: 'variant-filled-tertiary'
						}`}
						on:click={() => {
							if ($attendanceStore.state === 'active') {
								attendanceStore.set({ state: 'end', data: null })
							} else {
								startAttendance(60)
							}
						}}
					>
						{$attendanceStore.state === 'active'
							? 'Attendance in progress'
							: 'Start Attendance'}
					</button>
				{/if}

				{#if $channelStore}
					<button
						class="btn-icon btn-icon-sm variant-filled"
						on:click={() => drawerStore.open({ id: 'members' })}
					>
						<MembersIcon />
					</button>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<slot />
	<Toast position="br" />
	<Modal />
</AppShell>
