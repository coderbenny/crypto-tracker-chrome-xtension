const API_URLS = {
    binance: "https://api.binance.com/api/v3/ticker/price"
  };
  
  chrome.alarms.create("fetchPrices", { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener(fetchPrices);
  
  async function fetchPrices() {
    chrome.storage.local.get(["trackedPairs"], async (data) => {
      let pairs = data.trackedPairs || ["BTCUSDT", "ETHUSDT"];
      let fetchPromises = pairs.map(pair => fetch(`${API_URLS.binance}?symbol=${pair}`).then(res => res.json()));
  
      const results = await Promise.all(fetchPromises);
      chrome.storage.local.set({ prices: results, lastUpdated: new Date().toLocaleTimeString() });
    });
  }
  