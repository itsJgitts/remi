import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSheetsClient, RESTAURANT_RANGE, rowsToRestaurants, rowsToVisitItems, rowsToVisits, VISITS_RANGE, VISIT_ITEMS_RANGE } from '$lib/sheets';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { sheets, sheetId } = await getSheetsClient(platform);
	const restaurantResponse = await sheets.spreadsheets.values.get({
		spreadsheetId: sheetId,
		range: RESTAURANT_RANGE
	});

	const restaurant = rowsToRestaurants(restaurantResponse.data.values || []).find(
		(restaurant) => restaurant.id === params.id
	);

	if (!restaurant) error(404, 'Restaurant not found');

 	const visitsResponse = await sheets.spreadsheets.values.get({
  	spreadsheetId: sheetId,
  	range: VISITS_RANGE
  	});

  	const visits = rowsToVisits(visitsResponse.data.values || []).filter(
  	(visit) => visit.restaurantId === params.id
  	).sort(
			  	(a, b) => new Date(b.dateVisited).getTime() - new Date(a.dateVisited).getTime()
  );

  	const visitItemsResponse = await sheets.spreadsheets.values.get({
  	spreadsheetId: sheetId,
  	range: VISIT_ITEMS_RANGE
  	});

  const visitIds = new Set(visits.map((visit) => visit.id));

  const visitItems = rowsToVisitItems(visitItemsResponse.data.values || []).filter(
  	(item) => visitIds.has(item.visitId)
  );

  return { restaurant, visits, visitItems };
};
