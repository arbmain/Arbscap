export async function handler(event, context) {
  try {
    const response = await fetch('https://api.bybit.com/v5/market/tickers?category=spot&limit=1000');
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
