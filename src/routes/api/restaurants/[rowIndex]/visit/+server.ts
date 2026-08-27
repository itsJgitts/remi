import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient, VISITS_RANGE } from '$lib/sheets.js';

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	const rowIndex = Number(params.rowIndex);
	if (!Number.isInteger(rowIndex) || rowIndex < 2) {
		return json({ error: 'Invalid row index' }, { status: 400 });
	}
	const today = new Date().toISOString().split('T')[0];

	let visitors = '';
	try {
		const body = (await request.json()) as { visitors?: string[] | string };
		if (Array.isArray(body?.visitors)) visitors = body.visitors.join(', ');
		else if (typeof body?.visitors === 'string') visitors = body.visitors;
	} catch {
		// no body supplied; visitors stays empty
	}

	const { sheets, sheetId } = await getSheetsClient(platform);

	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: `Restaurants!A${rowIndex}:G${rowIndex}`
		});
		const restaurantId = response.data.values?.[0]?.[0] ?? '';
		const currentCount = parseInt(response.data.values?.[0]?.[4] ?? '0') || 0;
		const currentStatus = response.data.values?.[0]?.[6] ?? 'visited';

		await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: sheetId,
			requestBody: {
				valueInputOption: 'RAW',
				data: [
					{ range: `Restaurants!D${rowIndex}`, values: [[today]] },
					{ range: `Restaurants!E${rowIndex}`, values: [[currentCount + 1]] },
					{ range: `Restaurants!G${rowIndex}`, values: [['visited']] }
				]
			}
		});

		await sheets.spreadsheets.values.append({
			spreadsheetId: sheetId,
			range: VISITS_RANGE,
			valueInputOption: 'RAW',
			insertDataOption: 'INSERT_ROWS',
			requestBody: {
				values: [[crypto.randomUUID(), restaurantId, today, visitors]]
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
