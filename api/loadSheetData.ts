import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Permissões CORS (para o frontend conseguir chamar)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  // Resposta rápida para verificação prévia (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { sheetId, sheetName } = req.body;

  // Verifica se recebeu os parâmetros necessários
  if (!sheetId || !sheetName) {
    return res.status(400).json({ error: 'Faltam sheetId ou sheetName' });
  }

  // Pega a credencial da service account que configuraste no Vercel
  const serviceAccountJson = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    return res.status(500).json({ error: 'Credenciais não configuradas no servidor' });
  }

  try {
    // Converte a string JSON em objeto
    const credentials = JSON.parse(serviceAccountJson);

    // Autenticação com a service account
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Lê os dados da aba especificada (colunas A até Z – cobre tudo o que precisas)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];

    // Converte as linhas em texto simples, separando colunas por vírgula e linhas por \n
    // (é o formato que o Gemini entende melhor)
    const textData = rows.map(row => row.join(', ')).join('\n');

    // Devolve o texto para o frontend
    res.status(200).json({ textData });
  } catch (error: any) {
    console.error('Erro ao ler a Google Sheet:', error);
    res.status(500).json({ error: error.message || 'Erro ao acessar a Google Sheet' });
  }
}
