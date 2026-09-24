<script lang="ts">
	import { goto } from '$app/navigation';
	import tiffinImage from '$lib/assets/tiffin.png';
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

	function openTiffin() {
		chooseSuggestion();
		open = true;
	}

	function closeTiffin() {
		open = false;
	}

	function suggestionMessage(restaurant: Restaurant): string {
		if (restaurant.status === 'to_try') {
			return `Something new from the Tiffin: ${restaurant.name}.`;
		}

		const days = daysSince(restaurant.lastVisited);
		if (!restaurant.lastVisited) return `${restaurant.name} is in the Tiffin for tonight.`;
		if (restaurant.timesBeen >= 5) {
			return `Back in the Tiffin: ${restaurant.name}. It’s been ${days} days.`;
		}
		return `From the Tiffin: ${restaurant.name} deserves another visit. It’s been ${days} days.`;
	}
</script>

<button type="button" class="tiffin-trigger" onclick={openTiffin} aria-label="Open the Tiffin">
	<img alt="" src={tiffinImage} />
</button>

{#if open}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeTiffin()}
	>
		<div
			class="modal-panel tiffin-panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="tiffin-title"
		>
			<header class="tiffin-panel-header">
				<div class="tiffin-avatar">
					<img alt="" src={tiffinImage} />
				</div>
				<div class="tiffin-name">
					<h2 id="tiffin-title">What’s in the Tiffin?</h2>
				</div>
				<button
					type="button"
					class="icon-button"
					onclick={closeTiffin}
					aria-label="Close the Tiffin">×</button
				>
			</header>

			<div class="chat-body">
				<div class="chat-bubble chat-bubble--soft">
					<p class="text-sm">Let’s open the Tiffin and find somewhere to go.</p>
				</div>

				{#if suggestion}
					<div class="chat-bubble chat-bubble--strong">
						<p>{suggestionMessage(suggestion)}</p>
						<div class="chat-meta">
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
					<div class="chat-bubble chat-bubble--soft">
						<p>The Tiffin is empty. Add a few places first.</p>
					</div>
				{/if}
			</div>

			<footer class="tiffin-footer">
				<button type="button" class="button button--secondary" onclick={chooseSuggestion}>
					Check another layer
				</button>
				{#if suggestion}
					<button
						type="button"
						class="button button--coral"
						onclick={() => goto(`/restaurant/${suggestion?.id}`)}
					>
						View restaurant
					</button>
				{/if}
			</footer>
		</div>
	</div>
{/if}
