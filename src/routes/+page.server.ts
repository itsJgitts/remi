import type { PageServerLoad } from './$types';
import { getSheetsClient, RESTAURANT_RANGE, rowsToRestaurants } from '$lib/sheets';

export const load: PageServerLoad = async ({ platform }) => {
	const { sheets, sheetId } = await getSheetsClient(platform);
	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: RESTAURANT_RANGE
	});

	return { restaurants: rowsToRestaurants(response.data.values || []) };
};
