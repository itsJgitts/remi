import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient, VISITS_RANGE } from '$lib/sheets.js';

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	const rowIndex = Number(params.rowIndex);
	if (!Number.isInteger(rowIndex) || rowIndex < 2) {
		return json({ error: 'Invalid row index' }, { status: 400 });
	}
	const today = new Date().toISOString().split('T')[0];

	let notes = '';
	try {
		const body = (await request.json()) as { notes?: unknown };
		if (typeof body.notes === 'string') notes = body.notes.trim();
	} catch {
		// Notes are optional until the visit form is added.
	}
	const { sheets, sheetId } = await getSheetsClient(platform);

	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: `Restaurants!A${rowIndex}:H${rowIndex}`
		});
		const restaurant = response.data.values?.[0];
		if (!restaurant?.[0]) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}

		const restaurantId = restaurant[0];
		const currentCount = parseInt(restaurant[3] ?? '0') || 0;
		const currentStatus = restaurant[5] ?? 'visited';

		// PERF: These writes are independent after the read, so run them concurrently.
		await Promise.all([
			sheets.spreadsheets.values.batchUpdate({
				spreadsheetId: sheetId,
				requestBody: {
					valueInputOption: 'RAW',
					data: [
						{ range: `Restaurants!C${rowIndex}`, values: [[today]] },
						{ range: `Restaurants!D${rowIndex}`, values: [[currentCount + 1]] },
						{ range: `Restaurants!F${rowIndex}`, values: [['visited']] }
					]
				}
			}),
			sheets.spreadsheets.values.append({
				spreadsheetId: sheetId,
				range: VISITS_RANGE,
				valueInputOption: 'RAW',
				insertDataOption: 'INSERT_ROWS',
				requestBody: {
					values: [[crypto.randomUUID(), restaurantId, today, notes]]
				}
			})
		]);

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
