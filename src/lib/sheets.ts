import { google } from 'googleapis';


export async function getSheetsClient(platform: any) {
  const email = platform?.env?.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (platform?.env?.GOOGLE_PRIVATE_KEY ?? process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n');
  const sheetId = platform?.env?.GOOGLE_SHEET_ID ?? process.env.GOOGLE_SHEET_ID;

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return { sheets: google.sheets({ version: 'v4', auth }), sheetId };
}

export function rowsToRestaurants(rows: any) {
  return rows.map((row: string[], index: number) => ({
    rowIndex: index + 2,
    name: row[0] || '',
    notes: row[1] || '',
    lastVisited: row[2] || null,
    timesBeen: parseInt(row[3]) || 0,
    rating: row[4] ? parseInt(row[4]) : null,
    status: row[5] || 'visited',
    dateAdded: row[6] || null,
    exclude: row[7]?.toUpperCase() === 'TRUE',
  }));
}

export const RANGE = 'Sheet1!A2:H';
