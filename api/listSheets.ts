import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { sheetId } = req.body;

  if (!sheetId) {
    return res.status(400).json({ error: 'Falta o sheetId' });
  }

  const serviceAccountJson = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    return res.status(500).json({ error: 'Credenciais não configuradas' });
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheetTitles = response.data.sheets?.map((sheet: any) => ({
      name: sheet.properties?.title || 'Sem nome',
      id: sheet.properties?.sheetId || 0,
    })) || [];

    res.status(200).json({ sheets: sheetTitles });
  } catch (error: any) {
    console.error('Erro ao listar abas:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar as abas da Sheet' });
  }
}
