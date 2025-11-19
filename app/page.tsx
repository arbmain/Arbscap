const handleCalculate = async (formData: ArbitrageCalculateRequest) => {
  setLoading(true);
  setError(null);
  setResults({
    start_coin: formData.start_coin,
    start_amount: formData.start_amount,
    mode: formData.mode,
    opportunities: [],
    total_count: 0,
    fetch_timestamp: new Date().toISOString(),
  });
  setStartAmount(formData.start_amount);

  try {
    const response = await fetch(`${api.BACKEND_URL}/arbitrage/calculate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    const opportunities: ArbitrageOpportunity[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Try to parse complete JSON objects from the buffer
      let boundary = buffer.lastIndexOf('},');
      if (boundary !== -1) {
        const chunk = buffer.slice(0, boundary + 1); // include closing }
        buffer = buffer.slice(boundary + 2); // remaining buffer

        const items = chunk
          .replace(/^\[|]$/g, '') // remove leading/trailing brackets
          .split('},')
          .map(s => s.endsWith('}') ? s : s + '}');

        for (const item of items) {
          try {
            const parsed = JSON.parse(item);
            opportunities.push(parsed);
            setResults(prev => prev
              ? { ...prev, opportunities: [...opportunities], total_count: opportunities.length }
              : null
            );
          } catch (e) {
            // ignore partial JSON
          }
        }
      }
    }

    // Final parse for remaining buffer
    if (buffer.trim()) {
      try {
        const finalParsed = JSON.parse(buffer);
        if (finalParsed.opportunities) {
          opportunities.push(...finalParsed.opportunities);
          setResults(prev => prev
            ? { ...prev, opportunities, total_count: opportunities.length }
            : null
          );
        }
      } catch {}
    }

  } catch (err: any) {
    setError(err.message || 'Failed to calculate arbitrage opportunities.');
    console.error('Arbitrage calculation error:', err);
  } finally {
    setLoading(false);
  }
};
