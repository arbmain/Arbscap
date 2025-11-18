export async function handler(event, context) {
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
      return {
        statusCode: 500,
        body: 'Failed to parse Bybit response as JSON',
      };
    }

    if (data.retCode !== 0) {
      console.error('Bybit API returned error:', data.retMsg);
      return {
        statusCode: 500,
        body: `Bybit API error: ${data.retMsg}`,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (err) {
    console.error('Unexpected error fetching Bybit:', err);
    return {
      statusCode: 500,
      body: `Unexpected error: ${err.message}`,
    };
  }
}
