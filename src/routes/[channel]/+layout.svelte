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
		popup,
		getToastStore,
		getDrawerStore,
		ProgressRadial
	} from '@skeletonlabs/skeleton'

	import { userStore, channelStore, attendanceHostStore } from '@/lib/stores'
	import AttendanceSetup from '@/components/attendance-setup.svelte'
	import AttendanceResults from '@/components/attendance-results.svelte'

	const drawerStore = getDrawerStore()
	const toastStore = getToastStore()
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
		{:else if $drawerStore.id == 'attendance'}
			<AttendanceResults />
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
					<div class="flex flex-row items-stretch">
						<button
							class={`group btn btn-sm ${
								$attendanceHostStore
									? $attendanceHostStore.action === 'start'
										? 'variant-filled-success group-hover:variant-filled-error'
										: 'variant-filled-warning'
									: 'variant-filled-secondary'
							} [&>*]:pointer-events-none`}
							use:popup={{
								event: 'click',
								target:
									$attendanceHostStore &&
									$attendanceHostStore.action === 'start'
										? ''
										: 'attendanceHover',
								placement: 'bottom'
							}}
							disabled={$attendanceHostStore?.action === 'stop'}
							on:click={() => {
								if (
									$attendanceHostStore &&
									$attendanceHostStore.action === 'start'
								)
									attendanceHostStore.stop()
							}}
						>
							{#if $attendanceHostStore}
								{#if $attendanceHostStore.action === 'start'}
									Attendance on-going
								{:else if $attendanceHostStore.action === 'stop'}
									<span>
										<ProgressRadial width="w-4" />
									</span>
									<span> Wating for results </span>
								{/if}
							{:else}
								Start Attendance
							{/if}
						</button>

						<div data-popup="attendanceHover">
							<AttendanceSetup
								on:attendancestart={({ detail: duration }) => {
									if (!$userStore.id) return
									if (duration <= 0) attendanceHostStore.stop()
									attendanceHostStore.start($userStore.id, duration)
									setTimeout(() => {
										attendanceHostStore.stop()
									}, duration * 1000)
								}}
							/>
						</div>
					</div>
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
