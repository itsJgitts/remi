import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient, getWorksheetIds } from '$lib/sheets.js';

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	const rowIndex = Number(params.rowIndex);
	if (!Number.isInteger(rowIndex) || rowIndex < 2) {
		return json({ error: 'Invalid row index' }, { status: 400 });
	}
	const today = new Date().toISOString().split('T')[0];

	const body = (await request.json()) as {
		items?: unknown;
	};

	if (!Array.isArray(body.items)) {
		return json({ error: 'Items must be an array' }, { status: 400 });
	}

	const items = body.items
		.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
		.map((item) => ({
			name: typeof item.name === 'string' ? item.name.trim() : '',
			review: typeof item.review === 'string' ? item.review.trim() : '',
			orderAgain: item.orderAgain === true
		}))
		.filter((item) => item.name.length > 0);

	if (items.length === 0) {
		return json({ error: 'At least one item is required' }, { status: 400 });
	}

	const visitId = crypto.randomUUID();

	const itemRows = items.map((item) => [
		crypto.randomUUID(),
		visitId,
		item.name,
		item.review,
		item.orderAgain
	]);

	const { sheets, sheetId } = await getSheetsClient(platform);

	try {
		// PERF: Fetch the restaurant and resolve batch-write tab IDs concurrently on the first request.
		const [response, worksheetIds] = await Promise.all([
			sheets.spreadsheets.values.get({
				spreadsheetId: sheetId,
				range: `Restaurants!A${rowIndex}:G${rowIndex}`
			}),
			getWorksheetIds(sheets, sheetId)
		]);
		const restaurant = response.data.values?.[0];
		if (!restaurant?.[0]) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}

		const restaurantId = restaurant[0];
		const currentCount = parseInt(restaurant[3] ?? '0') || 0;
		const currentStatus = restaurant[4] ?? 'visited';

		// PERF: Convert primitive values once into the CellData format required by a single batch request.
		const cell = (value: string | number | boolean) => ({
			userEnteredValue:
				typeof value === 'boolean'
					? { boolValue: value }
					: typeof value === 'number'
						? { numberValue: value }
						: { stringValue: value }
		});

		// PERF: Apply the restaurant update and both appends atomically in one Google Sheets round trip.
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: sheetId,
			requestBody: {
				requests: [
					{
						updateCells: {
							start: {
								sheetId: worksheetIds.restaurants,
								rowIndex: rowIndex - 1,
								columnIndex: 2
							},
							rows: [{ values: [cell(today)] }],
							fields: 'userEnteredValue'
						}
					},
					{
						updateCells: {
							start: {
								sheetId: worksheetIds.restaurants,
								rowIndex: rowIndex - 1,
								columnIndex: 3
							},
							rows: [{ values: [cell(currentCount + 1)] }],
							fields: 'userEnteredValue'
						}
					},
					{
						updateCells: {
							start: {
								sheetId: worksheetIds.restaurants,
								rowIndex: rowIndex - 1,
								columnIndex: 4
							},
							rows: [{ values: [cell('visited')] }],
							fields: 'userEnteredValue'
						}
					},
					{
						appendCells: {
							sheetId: worksheetIds.visits,
							rows: [{ values: [cell(visitId), cell(restaurantId), cell(today)] }],
							fields: 'userEnteredValue'
						}
					},
					{
						appendCells: {
							sheetId: worksheetIds.visitItems,
							rows: itemRows.map((row) => ({ values: row.map(cell) })),
							fields: 'userEnteredValue'
						}
					}
				]
			}
		});

		return json({
			success: true,
			lastVisited: today,
			timesBeen: currentCount + 1,
			wasToTry: currentStatus === 'to_try',
			status: 'visited'
		});
	} catch (err) {
		console.error('Failed to mark visit:', err);
		return json({ error: 'Failed to mark visit' }, { status: 500 });
	}
};
