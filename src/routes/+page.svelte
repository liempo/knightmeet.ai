<script>
	import Banner from '@/components/banner.svelte'
</script>

<body class="h-full w-full min-h-screen flex bg-transparent">
	<div class="space-y-4 m-auto p-8">
		<div class="h1">
			<Banner />
		</div>
		<p class="text">Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
		<section
			class="gap-2 flex sm:items-center justify-evenly flex-col sm:flex-row sm:gap-4"
		>
			<button class="btn variant-filled">New meeting</button>
			<p class="text-token hidden sm:block">or</p>
			<div class="relative flex items-center py-2 sm:hidden">
				<div class="flex-grow border-t border-token" />
				<span class="flex-shrink mx-4 text-gray-400">or</span>
				<div class="flex-grow border-t border-token" />
			</div>

			<div class="flex gap-2">
				<input
					type="text"
					class="input"
					placeholder="Enter meeting code"
				/>
				<button class="btn variant-filled">Join</button>
			</div>
		</section>
	</div>
</body>
