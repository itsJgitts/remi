import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient } from '$lib/sheets.js';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	const rowIndex = Number(params.rowIndex);
	if (!Number.isInteger(rowIndex) || rowIndex < 2) {
		return json({ error: 'Invalid row index' }, { status: 400 });
	}
	const { rating, status, exclude } = (await request.json()) as {
		rating?: number;
		status?: string;
		exclude?: boolean;
	};
	const { sheets, sheetId } = await getSheetsClient(platform);

	try {
		const updates = [];
		if (rating !== undefined)
			updates.push({ range: `Restaurants!E${rowIndex}`, values: [[rating]] });
		if (status !== undefined)
			updates.push({ range: `Restaurants!F${rowIndex}`, values: [[status]] });
		if (exclude !== undefined) {
			updates.push({ range: `Restaurants!H${rowIndex}`, values: [[exclude ? 'TRUE' : 'FALSE']] });
		}

		if (updates.length > 0) {
			await sheets.spreadsheets.values.batchUpdate({
				spreadsheetId: sheetId,
				requestBody: {
					valueInputOption: 'RAW',
					data: updates
				}
			});
		}
		return json({ success: true });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to update restaurant' }, { status: 500 });
	}
};
