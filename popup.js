const apiUrl = "https://api.binance.com/api/v3/ticker/price";
const storedPairsKey = "trackedCurrencyPairs";
const alertsKey = "priceAlerts";
const emailKey = "userEmail";

document.addEventListener("DOMContentLoaded", function () {
  const pairDropdown = document.getElementById("pair-dropdown");
  const addButton = document.getElementById("add-pair");
  const currencyList = document.getElementById("currency-list");
  const emailInput = document.getElementById("email-input");
  const saveEmailButton = document.getElementById("save-email");
  const loader = document.getElementById("loader");

  const currencyPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT"];

  // Populate dropdown
  currencyPairs.forEach((pair) => {
    const option = document.createElement("option");
    option.value = pair;
    option.textContent = pair;
    pairDropdown.appendChild(option);
  });

  function saveToStorage(key, data) {
    chrome.storage.local.set({ [key]: data });
  }

  function loadPairsFromStorage() {
    chrome.storage.local.get([storedPairsKey], function (result) {
      if (result[storedPairsKey]) {
        result[storedPairsKey].forEach((pair) => addCurrencyPair(pair));
      }
    });
  }

  function loadEmailFromStorage() {
    chrome.storage.local.get([emailKey], function (result) {
      if (result[emailKey]) {
        emailInput.value = result[emailKey];
      }
    });
  }

  function addCurrencyPair(pair) {
    if (document.getElementById(`pair-${pair}`)) return;

    const pairItem = document.createElement("div");
    pairItem.id = `pair-${pair}`;
    pairItem.className = "currency-item";
    pairItem.innerHTML = `
            <span class="pair-title">${pair} - Click "Track" for updates</span>
            <div class="actions">
                <button class='btn track-btn' data-pair='${pair}'>Track</button>
                <span class='price' id='price-${pair}'>Waiting...</span>
                <input type="number" id="alert-${pair}" placeholder="Alert price">
                <button class='btn set-alert' data-pair='${pair}'>Set Alert</button>
                <button class='btn danger delete-pair' data-pair='${pair}'>❌</button>
            </div>
            <button class="btn toggle-history" data-pair="${pair}">View History</button>
            <div class="history-container" id="history-container-${pair}" style="display: none;">
                <label>Select timeframe: 
                    <select class="timeframe-select" data-pair="${pair}">
                        <option value="1m">1 min</option>
                        <option value="3m">3 mins</option>
                        <option value="5m">5 mins</option>
                    </select>
                </label>
                <button class="btn fetch-history" data-pair="${pair}">Fetch History</button>
                <button class="btn hide-history" data-pair="${pair}">Hide History</button>
                <div class="historical-data" id="history-${pair}"></div>
            </div>
        `;
    currencyList.appendChild(pairItem);
  }

  addButton.addEventListener("click", function () {
    const selectedPair = pairDropdown.value;
    addCurrencyPair(selectedPair);
    saveToStorage(
      storedPairsKey,
      [...document.querySelectorAll(".currency-item .pair-title")].map(
        (e) => e.textContent.split(" - ")[0]
      )
    );
  });

  currencyList.addEventListener("click", function (event) {
    const pair = event.target.dataset.pair;
    if (event.target.classList.contains("track-btn")) {
      fetchDataForPair(pair);
    } else if (event.target.classList.contains("set-alert")) {
      setPriceAlert(pair);
    } else if (event.target.classList.contains("delete-pair")) {
      deleteCurrencyPair(pair);
    } else if (event.target.classList.contains("toggle-history")) {
      document.getElementById(`history-container-${pair}`).style.display =
        "block";
    } else if (event.target.classList.contains("fetch-history")) {
      const timeframe = document.querySelector(
        `.timeframe-select[data-pair='${pair}']`
      ).value;
      fetchHistoricalData(pair, timeframe);
    } else if (event.target.classList.contains("hide-history")) {
      document.getElementById(`history-container-${pair}`).style.display =
        "none";
    }
  });

  function fetchDataForPair(pair) {
    fetch(`${apiUrl}?symbol=${pair}`)
      .then((response) => response.json())
      .then((data) => {
        const price = parseFloat(data.price).toFixed(2);
        document.getElementById(`price-${pair}`).textContent = `$${price}`;
      })
      .catch((error) => console.error("Error fetching price:", error));
  }

  function fetchHistoricalData(pair, timeframe) {
    fetch(
      `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${timeframe}&limit=5`
    )
      .then((response) => response.json())
      .then((data) => {
        const prices = data.map((item) => parseFloat(item[4]));
        const minPrice = Math.min(...prices).toFixed(2);
        const maxPrice = Math.max(...prices).toFixed(2);
        document.getElementById(
          `history-${pair}`
        ).innerHTML = `📉 Low: $${minPrice} | 📈 High: $${maxPrice}`;
      });
  }

  function deleteCurrencyPair(pair) {
    document.getElementById(`pair-${pair}`).remove();
  }

  loadPairsFromStorage();
  loadEmailFromStorage();
});
