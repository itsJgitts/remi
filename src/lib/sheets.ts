import { google } from 'googleapis';

export interface Restaurant {
	rowIndex: number;
	id: string;
	name: string;
	notes: string;
	lastVisited: string | null;
	timesBeen: number;
	rating: number | null;
	status: string;
	dateAdded: string | null;
	exclude: boolean;
}

export interface Visit {
	id: string;
	restaurantId: string;
	dateVisited: string;
	visitors: string | null;
	notes: string;
}

export async function getSheetsClient(platform: App.Platform | undefined) {
	const email =
		platform?.env?.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const key = (platform?.env?.GOOGLE_PRIVATE_KEY ?? process.env.GOOGLE_PRIVATE_KEY)?.replace(
		/\\n/g,
		'\n'
	);
	const sheetId = platform?.env?.GOOGLE_SHEET_ID ?? process.env.GOOGLE_SHEET_ID;

	const auth = new google.auth.JWT({
		email,
		key,
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});

	return { sheets: google.sheets({ version: 'v4', auth }), sheetId };
}

export function rowsToRestaurants(rows: string[][]): Restaurant[] {
	return rows.map((row: string[], index: number) => ({
		rowIndex: index + 2,
		id: row[0] || '',
		name: row[1] || '',
		notes: row[2] || '',
		lastVisited: row[3] || null,
		timesBeen: parseInt(row[4]) || 0,
		rating: row[5] ? parseInt(row[5]) : null,
		status: row[6] || 'visited',
		dateAdded: row[7] || null,
		exclude: row[8]?.toUpperCase() === 'TRUE'
	}));
}

export const RANGE = 'Restaurants!A2:I';

export function rowsToVisits(rows: string[][]): Visit[] {
	return rows.map((row: string[]) => ({
		id: row[0] || '',
		restaurantId: row[1] || '',
		dateVisited: row[2] || '',
		visitors: row[3] || null,
		notes: row[4] || ''
	}));
}

export const VISITS_RANGE = 'Visits!A:E';
