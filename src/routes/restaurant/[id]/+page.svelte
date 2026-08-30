<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let updating = $state(false);

	async function toggleExclude() {
		updating = true;
		const response = await fetch(`/api/restaurants/${data.restaurant.rowIndex}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ exclude: !data.restaurant.exclude })
		});
		updating = false;

		if (!response.ok) throw new Error('Failed to update restaurant');
		await invalidateAll();
	}

	async function markVisited() {
		updating = true;
		const response = await fetch(`/api/restaurants/${data.restaurant.rowIndex}/visit`, {
			method: 'PATCH'
		});
		updating = false;

		if (!response.ok) throw new Error('Failed to mark restaurant as visited');
		await invalidateAll();
	}
</script>

<main class="mx-auto max-w-3xl p-4 font-sans">
	<a href="/" class="text-sm text-violet-700">&larr; All restaurants</a>
	<h1 class="mt-4 text-3xl font-bold">{data.restaurant.name}</h1>

	<div class="mt-4 space-y-2">
		<p>{data.restaurant.notes || 'No notes yet.'}</p>
		<p>{data.restaurant.timesBeen} visits</p>
		{#if data.restaurant.rating !== null}
			<p>Rating: {data.restaurant.rating}/5</p>
		{/if}
		{#if data.restaurant.lastVisited}
			<p>Last visited: {data.restaurant.lastVisited}</p>
		{/if}
	</div>

	<div class="mt-6 flex gap-3">
		<button class="rounded bg-violet-200 px-4 py-2" onclick={markVisited} disabled={updating}>
			Mark visited
		</button>
		<button class="rounded bg-stone-200 px-4 py-2" onclick={toggleExclude} disabled={updating}>
			{data.restaurant.exclude ? 'Include in suggestions' : 'Exclude from suggestions'}
		</button>
	</div>
</main>
