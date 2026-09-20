<script lang="ts">
	import { navigating } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div role="status" aria-live="polite" aria-atomic="true">
	{#if navigating.to}
		<div
			class="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-violet-700 px-4 py-2 text-sm text-white shadow-md"
		>
			<span
				class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
				aria-hidden="true"
			></span>
			. . .Remi is checking the books. . .
		</div>
	{/if}
</div>

<div aria-busy={!!navigating.to}>
	{@render children()}
</div>

<style>
	:global(html) {
		background-color: var(--color-stone-50);
		min-height: 100vh;
	}
</style>
