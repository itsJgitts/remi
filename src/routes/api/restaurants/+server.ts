import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient, rowsToRestaurants, RANGE } from '$lib/sheets.js';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const { sheets, sheetId } = await getSheetsClient(platform);
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: RANGE
		});
		return json(rowsToRestaurants(response.data.values || []));
	} catch (error) {
		console.error('Error fetching restaurants:', error);
		return json({ error: 'Failed to fetch restaurants' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { name, notes, status } = (await request.json()) as {
			name?: string;
			notes?: string;
			status?: string;
		};
		if (typeof name !== 'string' || name.trim() === '') {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		const { sheets, sheetId } = await getSheetsClient(platform);
		const today = new Date().toISOString().split('T')[0];
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: RANGE
		});
		const nextRow = (response.data.values?.length || 0) + 2;
		await sheets.spreadsheets.values.update({
			spreadsheetId: sheetId,
			range: `Restaurants!A${nextRow}:I${nextRow}`,
			valueInputOption: 'RAW',
			requestBody: {
				values: [
					[crypto.randomUUID(), name.trim(), notes ?? '', '', 0, '', status || 'visited', today, 'FALSE']
				]
			}
		});
		return json({ message: 'Restaurant added successfully' });
	} catch (error) {
		console.error('Error adding restaurant:', error);
		return json({ error: 'Failed to add restaurant' }, { status: 500 });
	}
};
