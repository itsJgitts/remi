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

<button type="button" class="remi-trigger" onclick={openRemi} aria-label="Ask Remi where to eat">
	<img alt="" src={remiImage} />
</button>

{#if open}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeRemi()}
	>
		<div
			class="modal-panel remi-panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="remi-title"
		>
			<header class="remi-panel-header">
				<div class="remi-avatar">
					<img alt="" src={remiImage} />
				</div>
				<div class="remi-name">
					<h2 id="remi-title">Ask Remi</h2>
				</div>
				<button type="button" class="icon-button" onclick={closeRemi} aria-label="Close Remi"
					>×</button
				>
			</header>

			<div class="chat-body">
				<div class="chat-bubble chat-bubble--soft">
					<p class="text-sm">Remi has looked into the books and found a place to go.</p>
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
						<p>I don’t have any eligible restaurants to suggest yet.</p>
					</div>
				{/if}
			</div>

			<footer class="remi-footer">
				<button type="button" class="button button--secondary" onclick={chooseSuggestion}>
					Pick another
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
