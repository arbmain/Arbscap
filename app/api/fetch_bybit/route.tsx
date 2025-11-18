export async function GET(request: Request) {
  console.log('--- Fetch Bybit function called ---');

  const BYBIT_API_URL = 'https://api.bybit.com/v5/market/tickers?category=spot&limit=1000';

  try {
    console.log('Requesting Bybit API URL:', BYBIT_API_URL);

    const response = await fetch(BYBIT_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyArbBot/1.0)',
      },
    });

    console.log('Bybit status code:', response.status);
    console.log('Bybit response headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Bybit raw response (first 2000 chars):', text.slice(0, 2000));

    let data;
    try {
      data = JSON.parse(text);
      console.log('Successfully parsed JSON. Keys:', Object.keys(data));
    } catch (err) {
      console.error('JSON parse error:', err);
      return new Response(
        'Failed to parse Bybit response as JSON. See logs for details.',
        { status: 500 }
      );
    }

    if (data.retCode !== 0) {
      console.error('Bybit API returned error retCode != 0:', data.retMsg);
      return new Response(`Bybit API error: ${data.retMsg}`, { status: 500 });
    }

    console.log('Bybit API returned successfully.');
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Unexpected error fetching Bybit:', err);
    return new Response(`Unexpected error: ${err.message}`, { status: 500 });
  }
}
