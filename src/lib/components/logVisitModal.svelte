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
		class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget && !submitting) onclose();
		}}
	>
		<div
			class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="visit-modal-title"
		>
			<h2 id="visit-modal-title" class="text-xl font-semibold">Log visit</h2>

			<form class="mt-4" onsubmit={submitVisit}>
				<label for="review" class="block text-sm font-medium"> Review </label>
				{#each items as item, index (item.id)}
					<div class="mt-2 flex w-full items-center gap-3">
						<input
							id={`item-name-${index}`}
							class="min-w-0 flex-1 rounded border border-gray-300 p-3"
							placeholder={`Item ${index + 1}`}
							bind:value={item.name}
						/>

						<input
							id={`item-review-${index}`}
							class="min-w-0 flex-1 rounded border border-gray-300 p-3"
							placeholder="Item review"
							bind:value={item.review}
						/>

						<label
							for={`order-again-${index}`}
							class="flex shrink-0 items-center gap-2 text-sm font-medium"
						>
							<input id={`order-again-${index}`} type="checkbox" bind:checked={item.orderAgain} />

							Order again
						</label>
					</div>
				{/each}
				<button
					type="button"
					class="mt-3 rounded bg-violet-100 px-3 py-2 text-sm text-violet-700"
					onclick={addItem}
				>
					+ Add another item
				</button>
				{#if error}
					<p class="mt-2 text-sm text-red-600">{error}</p>
				{/if}

				<div class="mt-6 flex justify-end gap-3">
					<button
						type="button"
						class="rounded bg-stone-200 px-4 py-2"
						onclick={onclose}
						disabled={submitting}
					>
						Cancel
					</button>

					<button
						type="submit"
						class="rounded bg-violet-600 px-4 py-2 text-white"
						disabled={submitting}
					>
						{submitting ? 'Saving…' : 'Save visit'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
