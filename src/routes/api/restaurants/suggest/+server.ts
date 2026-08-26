import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient, rowsToRestaurants, RANGE } from '$lib/sheets.js';

export const GET: RequestHandler = async ({ platform }) => {
    try {
        const { sheets, sheetId } = await getSheetsClient(platform);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: RANGE
        });
        const restaurants = rowsToRestaurants(response.data.values || []);
        const eligible = restaurants.filter((r) => !r.exclude);
        const sorted = eligible.sort((a, b) => {
            if (a.status === 'to_try' && b.status !== 'to_try') return -1;
            if (a.status !== 'to_try' && b.status === 'to_try') return 1;
            if (a.status === 'to_try' && b.status === 'to_try') {
                return new Date(a.dateAdded ?? 0).getTime() - new Date(b.dateAdded ?? 0).getTime();
            }
            if (!a.lastVisited && b.lastVisited) return -1;
            if (a.lastVisited && !b.lastVisited) return 1;
            if (!a.lastVisited && !b.lastVisited) return 0;
            return new Date(a.lastVisited!).getTime() - new Date(b.lastVisited!).getTime();
        });
        return json(sorted.slice(0, 3));
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return json({ error: 'Failed to get suggestions' }, { status: 500 });
    }
};