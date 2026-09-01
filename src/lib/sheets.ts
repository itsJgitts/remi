import { google } from 'googleapis';

let cachedSheetsClient: {
	sheets: ReturnType<typeof google.sheets>;
	sheetId: string | undefined;
} | null = null;

export interface Restaurant {
	rowIndex: number;
	id: string;
	name: string;
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
	notes: string | null;
}

export async function getSheetsClient(platform: App.Platform | undefined) {
	if (cachedSheetsClient) return cachedSheetsClient;

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

	cachedSheetsClient = { sheets: google.sheets({ version: 'v4', auth }), sheetId };
	return cachedSheetsClient;
}

export function rowsToRestaurants(rows: string[][]): Restaurant[] {
	return rows.map((row: string[], index: number) => ({
		rowIndex: index + 2,
		id: row[0] || '',
		name: row[1] || '',
		lastVisited: row[2] || null,
		timesBeen: parseInt(row[3]) || 0,
		rating: row[4] ? parseInt(row[4]) : null,
		status: row[5] || 'visited',
		dateAdded: row[6] || null,
		exclude: row[7]?.toUpperCase() === 'TRUE'
	}));
}

export const RANGE = 'Restaurants!A2:H';

export function rowsToVisits(rows: string[][]): Visit[] {
	return rows.map((row: string[]) => ({
		id: row[0] || '',
		restaurantId: row[1] || '',
		dateVisited: row[2] || '',
		notes: row[3] || null
	}));
}

export const VISITS_RANGE = 'Visits!A:D';
