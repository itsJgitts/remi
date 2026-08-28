<script lang="ts">
	import { onMount } from 'svelte';
	import type { Restaurant } from '$lib/sheets';
	import Remi from '$lib/components/remi.svelte';

	let restaurants = $state<Restaurant[]>([]);
	let suggestions = $state<Restaurant[]>([]);

	let selectedRestaurant: Restaurant | null = $state(null);

	let loading = $state(true);
	let isAddingRestaurant = $state(false);
	let showAddForm = $state(false);
	let newRestaurant = $state({ name: '', status: 'to_try' });

	onMount(async () => {
		await fetchAll();
		loading = false;
	});

	async function fetchAll() {
		const [listRes, sugRes] = await Promise.all([
			fetch('/api/restaurants').then((r) => r.json() as Promise<Restaurant[]>),
			fetch('/api/restaurants/suggest').then((r) => r.json() as Promise<Restaurant[]>)
		]);
		restaurants = listRes;
		suggestions = sugRes;
	}

	async function markVisited(rowIndex: number) {
		await fetch(`/api/restaurants/${rowIndex}/visit`, { method: 'PATCH' });
		await fetchAll();
	}

	async function addRestaurant() {
		if (!newRestaurant.name.trim() || isAddingRestaurant) return;

		isAddingRestaurant = true;

		try {
			await fetch('/api/restaurants', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRestaurant)
			});

			newRestaurant = { name: '', status: 'to_try' };
			showAddForm = false;
			await fetchAll();
		} finally {
			isAddingRestaurant = false;
		}
	}

	async function toggleExclude(rowIndex: number, currentExclude: boolean) {
		await fetch(`/api/restaurants/${rowIndex}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ exclude: !currentExclude })
		});
		await fetchAll();
	}

	function selectRestaurant(restaurant: Restaurant) {
		selectedRestaurant = restaurant;
		// Later: open a modal, navigate to detail page, etc.
		console.log('Selected:', restaurant.name);
	}

	function daysSince(dateStr: string | null): number {
		if (!dateStr) return Infinity;
		return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
	}

	function remiSays(restaurant: Restaurant): string {
		if (restaurant.exclude) return "Remi won't suggest this";
		if (restaurant.status === 'to_try') {
			const days = daysSince(restaurant.dateAdded);
			if (days <= 14) return `Remi says the word on the street is to try ${restaurant.name}`;
			if (days <= 35) return `Remi's been sitting on ${restaurant.name} for a while...`;
			return `Remi's been waiting a while on ${restaurant.name}...`;
		}
		const days = daysSince(restaurant.lastVisited);
		if (days > 56) return `Remi thinks you've been neglecting ${restaurant.name}`;
		if (days > 28) return `Remi has fond memories of ${restaurant.name}`;
		return `Remi keeps thinking about ${restaurant.name}`;
	}
</script>

<div class="mx-auto max-w-3xl p-4 pb-24 font-sans">
	<header class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Remi</h1>
	</header>
	{#if loading}
		<p>Remi is checking the books</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
			{#each restaurants as restaurant (restaurant.id)}
				<button
					class="rounded-lg border-2 p-4 text-left transition-all hover:border-blue-400 hover:shadow-md
            {restaurant.exclude
						? 'border-gray-200 bg-gray-50 opacity-40'
						: daysSince(restaurant.lastVisited) > 42
							? 'border-amber-300 bg-amber-50'
							: 'border-transparent bg-violet-200 text-violet-700'}"
					onclick={() => selectRestaurant(restaurant)}
				>
					<div class="mb-2 flex items-center gap-2">
						<span class="text-lg font-semibold">{restaurant.name}</span>
					</div>
					<div class="flex items-center gap-3 text-xs text-gray-400">
						<span>{restaurant.timesBeen} visits</span>
						{#if restaurant.rating}
							<span>{restaurant.rating}/5</span>
						{/if}
						{#if restaurant.lastVisited}
							<span>{daysSince(restaurant.lastVisited)}d ago</span>
						{:else}
							<span>Remi hasnt been here</span>
						{/if}
						{#if restaurant.exclude}
							<span class="text-red-400">No Good</span>
						{/if}
					</div>
				</button>
			{/each}
			<div class="flex items-center justify-between rounded-lg border-2 border-gray-200">
				<input
					class="flex-1 border-transparent"
					placeholder="Add new Restaurant"
					bind:value={newRestaurant.name}
				/>
				<button
					class="p-4 text-right text-2xl transition-all hover:border-blue-400 hover:shadow-md"
					onclick={() => addRestaurant()}
					disabled={isAddingRestaurant}
					onkeydown={(e) => e.key === 'Enter' && addRestaurant()}
				>
					{#if isAddingRestaurant}
						<span
							class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
						></span>
					{:else}
						+
					{/if}
				</button>
			</div>
		</div>
	{/if}
	<Remi></Remi>
</div>
