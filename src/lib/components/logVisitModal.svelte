<script lang="ts">
	type Props = {
		open: boolean;
		submitting?: boolean;
		onclose: () => void;
		onsubmit: (items: VisitItemDraft[]) => Promise<void>;
	};

	type VisitItemDraft = {
		id: string;
		name: string;
		review: string;
		orderAgain: boolean;
	};

	type VisitItem = {
		id: string;
		name: string;
		review: string;
		orderAgain: boolean;
	};

	let { open, submitting = false, onclose, onsubmit }: Props = $props();

	let error = $state('');

	async function submitVisit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		const completedItems = items.filter((item) => item.name.trim());

		if (completedItems.length === 0) {
			error = 'Add at least one item.';
			return;
		}

		try {
			await onsubmit(completedItems);
			items = [createItem()];
		} catch {
			error = 'Could not save this visit. Please try again.';
		}
	}

	function createItem(): VisitItem {
		return {
			id: crypto.randomUUID(),
			name: '',
			review: '',
			orderAgain: true
		};
	}

	function addItem() {
		items.push(createItem());
	}

	let items = $state<VisitItem[]>([createItem()]);
</script>

{#if open}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget && !submitting) onclose();
		}}
	>
		<div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="visit-modal-title">
			<header class="modal-header">
				<h2 id="visit-modal-title" class="modal-title">What did you eat?</h2>
			</header>

			<form class="modal-body" onsubmit={submitVisit}>
				<p class="form-label">Add the dishes from this visit</p>
				{#each items as item, index (item.id)}
					<div class="item-row">
						<input
							id={`item-name-${index}`}
							class="field"
							placeholder={`Item ${index + 1}`}
							bind:value={item.name}
						/>

						<input
							id={`item-review-${index}`}
							class="field"
							placeholder="Item review"
							bind:value={item.review}
						/>

						<label for={`order-again-${index}`} class="check-label">
							<input id={`order-again-${index}`} type="checkbox" bind:checked={item.orderAgain} />

							Order again
						</label>
					</div>
				{/each}
				<button type="button" class="button button--secondary mt-4" onclick={addItem}>
					+ Add another item
				</button>
				{#if error}
					<p class="form-error">{error}</p>
				{/if}

				<div class="modal-actions">
					<button
						type="button"
						class="button button--secondary"
						onclick={onclose}
						disabled={submitting}
					>
						Cancel
					</button>

					<button type="submit" class="button button--primary" disabled={submitting}>
						{submitting ? 'Saving…' : 'Save visit'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
