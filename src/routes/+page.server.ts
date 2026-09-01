import type { PageServerLoad } from './$types';
import { getSheetsClient, RANGE, rowsToRestaurants } from '$lib/sheets';

export const load: PageServerLoad = async ({ platform }) => {
	const { sheets, sheetId } = await getSheetsClient(platform);
	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: RANGE
	});

	return { restaurants: rowsToRestaurants(response.data.values || []) };
};
