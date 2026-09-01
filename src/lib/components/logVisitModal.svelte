<script lang="ts">
	type Props = {
		open: boolean;
		submitting?: boolean;
		onclose: () => void;
		onsubmit: (notes: string) => Promise<void>;
	};

	let { open, submitting = false, onclose, onsubmit }: Props = $props();
	let notes = $state('');
	let error = $state('');

	async function submitVisit(event: SubmitEvent) {
		event.preventDefault();
		error = '';

		try {
			await onsubmit(notes);
			notes = '';
		} catch {
			error = 'Could not save this visit. Please try again.';
		}
	}
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
				<label for="visit-notes" class="block text-sm font-medium"> Notes </label>

				<textarea
					id="visit-notes"
					class="mt-2 min-h-28 w-full rounded border border-gray-300 p-3"
					placeholder="Add visit notes"
					bind:value={notes}></textarea>

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
