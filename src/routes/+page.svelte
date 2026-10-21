<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import type { Restaurant } from '$lib/sheets';
	import Tiffin from '$lib/components/tiffin.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// PERF: Use the SSR result instead of making duplicate list and suggestion requests on mount.
	let restaurants = $derived(data.restaurants);

	type SortOption =
		'name-asc' | 'name-desc' | 'visits-asc' | 'visits-desc' | 'last-asc' | 'last-desc';

	let searchQuery = $state('');
	let sortBy = $state<SortOption>('name-asc');

	let visibleRestaurants = $derived.by(() => {
		const query = searchQuery.trim().toLowerCase();

		const filtered = restaurants.filter((restaurant) =>
			restaurant.name.toLowerCase().includes(query)
		);

		return [...filtered].sort((a, b) => {
			switch (sortBy) {
				case 'name-desc':
					return b.name.localeCompare(a.name);

				case 'visits-asc':
					return a.timesBeen - b.timesBeen;

				case 'visits-desc':
					return b.timesBeen - a.timesBeen;

				case 'last-asc':
					return dateValue(a.lastVisited) - dateValue(b.lastVisited);

				case 'last-desc':
					return dateValue(b.lastVisited) - dateValue(a.lastVisited);

				default:
					return a.name.localeCompare(b.name);
			}
		});
	});

	let isAddingRestaurant = $state(false);

	let newRestaurant = $state({ name: '', status: 'to_try' });

	async function addRestaurant() {
		if (!newRestaurant.name.trim() || isAddingRestaurant) return;

		isAddingRestaurant = true;

		try {
			const response = await fetch('/api/restaurants', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRestaurant)
			});
			if (!response.ok) throw new Error('Failed to add restaurant');

			newRestaurant = { name: '', status: 'to_try' };
			await invalidateAll();
		} finally {
			isAddingRestaurant = false;
		}
	}
	function goToRestaurant(restaurant: Restaurant) {
		goto(`/restaurant/${restaurant.id}`);
	}

	function daysSince(dateStr: string | null): number {
		if (!dateStr) return Infinity;
		return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
	}

	function dateValue(date: string | null): number {
		return date ? new Date(date).getTime() : 0;
	}
</script>

<main class="app-shell">
	<header class="app-header">
		<div>
			<p class="eyebrow">The little book of good food</p>
			<h1 class="page-title">Tiffin. Hi</h1>
			<p class="page-subtitle">
				Restaurants worth remembering, dishes worth ordering again, and a friendly nudge when it’s
				time to go back.
			</p>
		</div>
	</header>
	<div class="restaurant-controls">
		<label>
			<span>Search</span>
			<input type="search" placeholder="Search restaurants…" bind:value={searchQuery} />
		</label>

		<label>
			<span>Sort by</span>
			<select bind:value={sortBy}>
				<option value="name-asc">Name A–Z</option>
				<option value="name-desc">Name Z–A</option>
				<option value="visits-desc">Most visited</option>
				<option value="visits-asc">Least visited</option>
				<option value="last-desc">Last visited: newest</option>
				<option value="last-asc">Last visited: oldest</option>
			</select>
		</label>
	</div>
	<div class="restaurant-grid">
		{#each visibleRestaurants as restaurant (restaurant.id)}
			<button class="restaurant-card" onclick={() => goToRestaurant(restaurant)}>
				<span class="card-name">{restaurant.name}</span>
				<div class="card-meta">
					<span class="meta-pill">{restaurant.timesBeen} visits</span>
					{#if restaurant.lastVisited}
						<span class="meta-pill">{daysSince(restaurant.lastVisited)}d ago</span>
					{:else}
						<span class="meta-pill">Not visited yet</span>
					{/if}
					{#if restaurant.exclude}
						<span class="meta-pill meta-pill--danger">Out of the Tiffin</span>
					{/if}
				</div>
			</button>
		{/each}
		<div class="add-card">
			<input
				placeholder="Add a restaurant…"
				aria-label="Restaurant name"
				bind:value={newRestaurant.name}
			/>
			<button
				class="add-button"
				aria-label="Add restaurant"
				onclick={() => addRestaurant()}
				disabled={isAddingRestaurant}
				onkeydown={(e) => e.key === 'Enter' && addRestaurant()}
			>
				{#if isAddingRestaurant}
					<span class="spinner"></span>
				{:else}
					+
				{/if}
			</button>
		</div>
	</div>
	<Tiffin {restaurants} />
</main>
