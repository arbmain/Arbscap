export async function GET(request: Request) {
  console.log('Fetch Bybit function called');

  try {
    const response = await fetch(
      'https://api.bybit.com/v5/market/tickers?category=spot&limit=1000'
    );

    console.log('Bybit API URL:', response.url);
    console.log('Status code:', response.status);

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
      console.log('Response JSON keys:', Object.keys(data));
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      return new Response('Failed to parse Bybit response as JSON', { status: 500 });
    }

    if (data.retCode !== 0) {
      console.error('Bybit API returned error:', data.retMsg);
      return new Response(`Bybit API error: ${data.retMsg}`, { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Unexpected error fetching Bybit:', err);
    return new Response(`Unexpected error: ${err.message}`, { status: 500 });
  }
}
