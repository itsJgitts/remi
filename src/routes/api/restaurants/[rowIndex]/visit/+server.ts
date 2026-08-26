import { json, type RequestHandler } from '@sveltejs/kit';
import { getSheetsClient } from '$lib/sheets.js';

export const PATCH: RequestHandler = async ({ params, platform }) => {
  const rowIndex = Number(params.rowIndex);
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return json({ error: 'Invalid row index' }, { status: 400 });
  }
  const today = new Date().toISOString().split('T')[0];
  const { sheets, sheetId } = await getSheetsClient(platform);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `Sheet1!D${rowIndex}:F${rowIndex}`,
    });
    const currentCount = parseInt(response.data.values?.[0]?.[0] ?? '0') || 0;
    const currentStatus = response.data.values?.[0]?.[2] ?? 'visited';

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          { range: `Sheet1!C${rowIndex}`, values: [[today]] },
          { range: `Sheet1!D${rowIndex}`, values: [[currentCount + 1]] },
          { range: `Sheet1!F${rowIndex}`, values: [['visited']] },
        ],
      },
    });

    return json({
      success: true,
      lastVisited: today,
      timesBeen: currentCount + 1,
      wasToTry: currentStatus === 'to_try',
      status: 'visited',
    });
  } catch (err) {
    console.error('Failed to mark visit:', err);
    return json({ error: 'Failed to mark visit' }, { status: 500 });
  }
};
