<script lang="ts">
	import type { PageProps } from './$types';
	import LogVisitModal from '$lib/components/logVisitModal.svelte';
	import type { VisitItemInput } from '$lib/sheets';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();
	let restaurant = $derived(data.restaurant);
	let visits = $derived(data.visits);
	let visitItems = $derived(data.visitItems);
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
			await invalidateAll();
		} finally {
			updating = false;
		}
	}
</script>

<main class="app-shell">
	<a href="/" class="back-link">&larr; All restaurants</a>
	<section class="detail-hero">
		<p class="eyebrow">From the Tiffin</p>
		<h1 class="detail-title">{restaurant.name}</h1>

		<div class="detail-stats">
			<p class="detail-stat">{restaurant.timesBeen} visits</p>
			{#if restaurant.lastVisited}
				<p class="detail-stat">Last visited {restaurant.lastVisited}</p>
			{/if}
		</div>

		<div class="action-row">
			<button
				class="button button--primary"
				onclick={() => (visitModalOpen = true)}
				disabled={updating}
			>
				Mark visited
			</button>
			<button class="button button--coral" onclick={toggleExclude} disabled={updating}>
				{restaurant.exclude ? 'Add to the Tiffin' : 'Remove from the Tiffin'}
			</button>
			<LogVisitModal
				open={visitModalOpen}
				submitting={updating}
				onclose={() => (visitModalOpen = false)}
				onsubmit={markVisited}
			/>
		</div>
	</section>
	<section class="visit-list">
		<h2 class="section-title">Past visits</h2>
		{#each visits as visit (visit.id)}
			<details class="visit-card">
				<summary>
					Visited: {visit.dateVisited}
				</summary>

				{#each visitItems.filter((item: { visitId: any }) => item.visitId === visit.id) as item (item.id)}
					<div class="visit-item">
						<div>
							<p><strong>{item.name}</strong></p>
							<p class="visit-verdict">
								{item.orderAgain ? 'Worth ordering again' : 'Skip this one next time'}
							</p>
						</div>
						{#if item.review}
							<p>{item.review}</p>
						{/if}
					</div>
				{:else}
					<p class="visit-item">No dishes were noted for this visit.</p>
				{/each}
			</details>
		{:else}
			<p>No visits here yet.</p>
		{/each}
	</section>
</main>
