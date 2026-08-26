import { json } from '@sveltejs/kit';
import { getSheetsClient, rowsToRestaurants, RANGE } from '$lib/sheets.js';

export async function GET({ platform }: { platform: any }) {
	const { sheets, sheetId } = await getSheetsClient(platform);
	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: RANGE
	});
	return json({ rowsToRestaurants: rowsToRestaurants(response.data.values || []), 
		catch (error: any) {
			console.error('Error fetching restaurants:', error);
			return json({ error: 'Failed to fetch restaurants' }, { status: 500 });
		}
	});
}


export async function POST({ request, platform }: { request: Request; platform: any }) {
	const  { name, notes, status} = await request.json();
	const { sheets, sheetId } = await getSheetsClient(platform);
	const today = new Date().toISOString().split('T')[0];

	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: RANGE,
		});
		const nextRow = (response.data.values?.length || 0) + 2;
		await sheets.spreadsheets.values.update({
			spreadsheetId: sheetId,
			range: `Sheet1!A${nextRow}:C${nextRow}`,
			valueInputOption: 'RAW',
			requestBody: {
				 values: [[name, notes || '', '', 0, '', status || 'regular', today, 'FALSE']],
			},
		});
		return json({ message: 'Restaurant added successfully' });
	} catch (error: any) {
		console.error('Error adding restaurant:', error);
		return json({ error: 'Failed to add restaurant' }, { status: 500 });
	}
}
