// Import only Sheets so the Worker does not bundle every Google API client.
import {
	sheets as createSheets,
	auth as sheetsAuth
} from 'googleapis/build/src/apis/sheets/index.js';
import { getGoogleAccessToken } from './google-auth';

let cachedSheetsClient: {
	sheets: ReturnType<typeof createSheets>;
	sheetId: string | undefined;
} | null = null;

// PERF: Cache numeric worksheet IDs so batch writes only need a metadata lookup on the first request.
let cachedWorksheetIds: {
	restaurants: number;
	visits: number;
	visitItems: number;
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
}

export interface VisitItem {
	id: string;
	visitId: string;
	name: string;
	review: string;
	orderAgain: boolean;
}

export interface VisitItemInput {
	name: string;
	review: string;
	orderAgain: boolean;
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

	if (!email || !key || !sheetId) {
		throw new Error('Missing Google Sheets credentials or sheet ID');
	}
	const auth = new sheetsAuth.OAuth2();
	// OAuth2 caches the token and calls this handler again before it expires.
	auth.refreshHandler = () => getGoogleAccessToken(email, key);

	cachedSheetsClient = { sheets: createSheets({ version: 'v4', auth }), sheetId };
	return cachedSheetsClient;
}

// PERF: Resolve the worksheet IDs required to combine all visit writes into one API request.
export async function getWorksheetIds(
	sheets: ReturnType<typeof createSheets>,
	spreadsheetId: string | undefined
) {
	// PERF: Reuse worksheet IDs for every warm request because tab IDs do not change when rows change.
	if (cachedWorksheetIds) return cachedWorksheetIds;

	const response = await sheets.spreadsheets.get({
		spreadsheetId,
		// PERF: Request only tab titles and IDs rather than downloading spreadsheet data.
		fields: 'sheets.properties(sheetId,title)'
	});

	const worksheetIds = new Map(
		response.data.sheets?.map((sheet) => [sheet.properties?.title, sheet.properties?.sheetId])
	);
	const restaurants = worksheetIds.get('Restaurants');
	const visits = worksheetIds.get('Visits');
	const visitItems = worksheetIds.get('VisitItems');

	if (restaurants == null || visits == null || visitItems == null) {
		throw new Error('Required worksheet tabs are missing');
	}

	// PERF: Store the resolved IDs so subsequent visit requests skip spreadsheet metadata entirely.
	cachedWorksheetIds = { restaurants, visits, visitItems };
	return cachedWorksheetIds;
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

export const RESTAURANT_RANGE = 'Restaurants!A2:H';

export const VISITS_RANGE = 'Visits!A:C';

export const VISIT_ITEMS_RANGE = 'VisitItems!A:E';

export function rowsToVisits(rows: string[][]): Visit[] {
	return rows.map((row: string[]) => ({
		id: row[0] || '',
		restaurantId: row[1] || '',
		dateVisited: row[2] || ''
	}));
}

export function rowsToVisitItems(rows: string[][]): VisitItem[] {
	return rows.map((row) => ({
		id: row[0] || '',
		visitId: row[1] || '',
		name: row[2] || '',
		review: row[3] || '',
		orderAgain: row[4]?.toUpperCase() === 'TRUE'
	}));
}
