<script lang="ts">
	import { goto } from '$app/navigation';
	import remiImage from '$lib/assets/remi.png';
	import type { Restaurant } from '$lib/sheets';

	type Props = { restaurants: Restaurant[] };

	let { restaurants }: Props = $props();
	let open = $state(false);
	let suggestion = $state<Restaurant | null>(null);
	let previousSuggestionId = $state<string | null>(null);

	const DAY = 86_400_000;

	function daysSince(date: string | null): number {
		if (!date) return 365;
		return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / DAY));
	}

	function suggestionScore(restaurant: Restaurant): number {
		if (restaurant.status === 'to_try') {
			return 120 + Math.min(daysSince(restaurant.dateAdded), 90);
		}

		const timeSinceVisit = daysSince(restaurant.lastVisited);
		return timeSinceVisit + Math.min(restaurant.timesBeen * 4, 40);
	}

	function chooseSuggestion() {
		const candidates = restaurants
			.filter((restaurant) => !restaurant.exclude)
			.toSorted((a, b) => suggestionScore(b) - suggestionScore(a))
			.slice(0, 5);

		const newChoices = candidates.filter((restaurant) => restaurant.id !== previousSuggestionId);
		const pool = newChoices.length > 0 ? newChoices : candidates;
		suggestion = pool[Math.floor(Math.random() * pool.length)] ?? null;

		if (suggestion) previousSuggestionId = suggestion.id;
	}

	function openRemi() {
		chooseSuggestion();
		open = true;
	}

	function closeRemi() {
		open = false;
	}

	function suggestionMessage(restaurant: Restaurant): string {
		if (restaurant.status === 'to_try') {
			return `Remi thinks it's ready to have a crack at ${restaurant.name}`;
		}

		const days = daysSince(restaurant.lastVisited);
		if (!restaurant.lastVisited) return `Remi wants to go to ${restaurant.name}`;
		if (restaurant.timesBeen >= 5) {
			return `Remi wants to go back to ${restaurant.name}. Remi has been waiting ${days} days`;
		}
		return `Remi thinks ${restaurant.name} deserves another visit. It’s been ${days} days`;
	}
</script>

<button
	type="button"
	class="fixed right-5 bottom-5 z-40 grid h-18 w-18 place-items-center rounded-full bg-violet-200 shadow-lg ring-1 ring-violet-300 transition hover:scale-105 hover:shadow-xl focus-visible:ring-4 focus-visible:outline-none"
	onclick={openRemi}
	aria-label="Ask Remi where to eat"
>
	<img alt="" src={remiImage} class="h-14 w-14 object-contain" />
</button>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/45 p-4 sm:items-center"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeRemi()}
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-3xl bg-stone-50 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="remi-title"
		>
			<header class="flex items-center gap-3 border-b border-stone-200 bg-white px-5 py-4">
				<div class="grid h-11 w-11 place-items-center rounded-full bg-violet-200">
					<img alt="" src={remiImage} class="h-9 w-9 object-contain" />
				</div>
				<div class="min-w-0 flex-1">
					<h2 id="remi-title" class="font-semibold text-stone-900">Remi</h2>
				</div>
				<button
					type="button"
					class="rounded-full p-2 text-xl leading-none text-stone-500 hover:bg-stone-100"
					onclick={closeRemi}
					aria-label="Close Remi">×</button
				>
			</header>

			<div class="min-h-64 space-y-4 p-5">
				<div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-violet-200 px-4 py-3 text-violet-950">
					<p class="text-sm">Remi has looked into the books and found a place to go.</p>
				</div>

				{#if suggestion}
					<div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-violet-600 px-4 py-3 text-white">
						<p>{suggestionMessage(suggestion)}</p>
						<div class="mt-2 flex gap-3 text-xs text-violet-100">
							{#if suggestion.status === 'to_try'}
								<span>New place to try</span>
							{:else}
								<span>{suggestion.timesBeen} visits</span>
								{#if suggestion.lastVisited}
									<span>{daysSince(suggestion.lastVisited)}d ago</span>
								{/if}
							{/if}
						</div>
					</div>
				{:else}
					<div
						class="max-w-[85%] rounded-2xl rounded-tl-sm bg-violet-200 px-4 py-3 text-violet-950"
					>
						<p>I don’t have any eligible restaurants to suggest yet.</p>
					</div>
				{/if}
			</div>

			<footer class="flex gap-3 border-t border-stone-200 bg-white p-4">
				<button
					type="button"
					class="flex-1 rounded-xl bg-stone-200 px-4 py-3 font-medium text-stone-800 hover:bg-stone-300"
					onclick={chooseSuggestion}
				>
					Pick another
				</button>
				{#if suggestion}
					<button
						type="button"
						class="flex-1 rounded-xl bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700"
						onclick={() => goto(`/restaurant/${suggestion?.id}`)}
					>
						View restaurant
					</button>
				{/if}
			</footer>
		</div>
	</div>
{/if}
