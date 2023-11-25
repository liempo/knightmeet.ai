<script lang="ts">
	import { page } from '$app/stores'

	import {
		Members as MembersIcon,
		Chat as ChatIcon,
		Copy as CopyIcon
	} from '@/icons'
	import Members from '@/components/members.svelte'
	import Chat from '@/components/chat.svelte'
	import Banner from '@/components/banner.svelte'

	import {
		AppShell,
		AppBar,
		Drawer,
		Toast,
		getToastStore,
		getModalStore,
		getDrawerStore
	} from '@skeletonlabs/skeleton'

	import { userStore, channelStore, attendanceStore } from '@/lib/stores'

	const drawerStore = getDrawerStore()
	const toastStore = getToastStore()
	const modalStore = getModalStore()
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
		{:else if $drawerStore.id == 'chat'}
			<Chat />
		{/if}
	</Drawer>
	<svelte:fragment slot="header">
		<AppBar
			gridColumns="grid-cols-3"
			slotDefault="place-self-center"
			slotTrail="place-content-end"
			class="shadow-lg"
		>
			<svelte:fragment slot="lead">
				<a href="/">
					<Banner />
				</a>
			</svelte:fragment>

			{#if $channelStore}
				<button
					class="btn btn-sm group hover:variant-soft-surface"
					on:click={() => {
						navigator.clipboard.writeText(window.location.href)
						toastStore.trigger({
							message: 'Meeting URL copied to clipboard',
							timeout: 1000,
							background: 'bg-surface-active-token',
							hideDismiss: true
						})
					}}
				>
					{$channelStore.name}
					<CopyIcon
						class="w-4 h-4 ml-2 transition ease-in-out duration-300 fill-on-success-token -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
					/>
				</button>
			{/if}

			<svelte:fragment slot="trail">
				{#if $channelStore && $userStore.id === $channelStore.ownerId}
					<button
						class={`btn btn-sm ${'variant-filled-secondary'}`}
						on:click={() => {}}
					>
						{'Start Attendance'}
					</button>
				{/if}

				{#if $channelStore}
					<button
						class="btn-icon btn-icon-sm variant-filled"
						on:click={() => drawerStore.open({ id: 'members' })}
					>
						<MembersIcon />
					</button>
					<button
						class="btn-icon btn-icon-sm variant-filled"
						on:click={() => drawerStore.open({ id: 'chat' })}
					>
						<ChatIcon />
					</button>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<slot />
	<Toast position="br" />
</AppShell>
