<script lang="ts">
	import { onMount } from 'svelte';
	import { registerSW } from 'virtual:pwa-register';
	import { navigating } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();
	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(() => {
		registerSW({
			onRegisterError(error) {
				console.error('Service worker registration failed:', error);
			}
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

<div role="status" aria-live="polite" aria-atomic="true">
	{#if navigating.to}
		<div class="loading-banner">
			<span class="spinner" aria-hidden="true"></span>
			. . .Remi is checking the books. . .
		</div>
	{/if}
</div>

<div aria-busy={!!navigating.to}>
	{@render children()}
</div>
