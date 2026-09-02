<script lang="ts">
	import type { PageProps } from './$types';
	import LogVisitModal from '$lib/components/logVisitModal.svelte';
	import type { VisitItemInput } from '$lib/sheets';

	let { data }: PageProps = $props();
	let restaurant = $derived(data.restaurant);
	let updating = $state(false);
	let visitModalOpen = $state(false);

	type VisitItemDraft = VisitItemInput & {
		id: string;
	};

	async function toggleExclude() {
		updating = true;
		const response = await fetch(`/api/restaurants/${restaurant.rowIndex}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ exclude: !restaurant.exclude })
		});
		updating = false;

		if (!response.ok) throw new Error('Failed to update restaurant');
		restaurant = { ...restaurant, exclude: !restaurant.exclude };
	}

	async function markVisited(items: VisitItemDraft[]) {
		updating = true;
		try {
			const response = await fetch(`/api/restaurants/${restaurant.rowIndex}/visit`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items })
			});
			if (!response.ok) {
				throw new Error('Failed to mark restaurant as visited');
			}

			const result = (await response.json()) as {
				lastVisited: string;
				timesBeen: number;
				status: string;
			};

			restaurant = {
				...restaurant,
				lastVisited: result.lastVisited,
				timesBeen: result.timesBeen,
				status: result.status
			};

			visitModalOpen = false;
		} finally {
			updating = false;
		}
	}
</script>

<main class="mx-auto max-w-3xl p-4 font-sans">
	<a href="/" class="text-sm text-violet-700">&larr; All restaurants</a>
	<h1 class="mt-4 text-3xl font-bold">{restaurant.name}</h1>

	<div class="mt-4 flex flex-wrap gap-x-4 gap-y-2">
		<p>{restaurant.timesBeen} visits</p>
		{#if restaurant.rating !== null}
			<p>Rating: {restaurant.rating}/5</p>
		{/if}
		{#if restaurant.lastVisited}
			<p>Last visited: {restaurant.lastVisited}</p>
		{/if}
	</div>

	<div class="mt-6 flex gap-3">
		<button
			class="rounded bg-violet-200 px-4 py-2"
			onclick={() => (visitModalOpen = true)}
			disabled={updating}
		>
			Mark visited
		</button>
		<button class="rounded bg-stone-200 px-4 py-2" onclick={toggleExclude} disabled={updating}>
			{restaurant.exclude ? 'Include in suggestions' : 'Exclude from suggestions'}
		</button>
		<LogVisitModal
			open={visitModalOpen}
			submitting={updating}
			onclose={() => (visitModalOpen = false)}
			onsubmit={markVisited}
		/>
	</div>
</main>
