import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSheetsClient, RANGE, rowsToRestaurants } from '$lib/sheets';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { sheets, sheetId } = await getSheetsClient(platform);
	const restaurantResponse = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: RANGE
	});
	const visitsResponse = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: RANGE
	});

	const restaurant = rowsToRestaurants(restaurantResponse.data.values || []).find(
		(restaurant) => restaurant.id === params.id
	);

	if (!restaurant) error(404, 'Restaurant not found');

	return { restaurant };
};
