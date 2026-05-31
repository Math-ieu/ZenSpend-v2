import json
import urllib.request
import logging

logger = logging.getLogger(__name__)

DEFAULT_RATES = {
    'EUR': 1.0,
    'USD': 1.09,
    'GBP': 0.84,
    'CAD': 1.48,
    'JPY': 170.8,
    'CHF': 0.98,
}

_cached_rates = None

def get_rates():
    global _cached_rates
    if _cached_rates is not None:
        return _cached_rates
    
    try:
        # Fetch live rates from a reliable daily free open API (er-api.com) with a clean user-agent
        req = urllib.request.Request(
            'https://open.er-api.com/v6/latest/EUR',
            headers={'User-Agent': 'Mozilla/5.0 (ZenSpend Exchange Service)'}
        )
        # Using a 3 seconds timeout to avoid blocking backend API response
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            if data and 'rates' in data:
                rates = {
                    'EUR': 1.0,
                    'USD': float(data['rates'].get('USD', DEFAULT_RATES['USD'])),
                    'GBP': float(data['rates'].get('GBP', DEFAULT_RATES['GBP'])),
                    'CAD': float(data['rates'].get('CAD', DEFAULT_RATES['CAD'])),
                    'JPY': float(data['rates'].get('JPY', DEFAULT_RATES['JPY'])),
                    'CHF': float(data['rates'].get('CHF', DEFAULT_RATES['CHF'])),
                }
                _cached_rates = rates
                logger.info("Real-time exchange rates successfully loaded from er-api: %s", rates)
                return rates
    except Exception as e:
        logger.warning("Failed to fetch live exchange rates from API, using DEFAULT_RATES fallback: %s", e)
    
    return DEFAULT_RATES

def convert_currency(amount, from_cur, to_cur):
    if amount is None:
        return 0.0
    
    from_cur = str(from_cur or 'EUR').strip().upper()
    to_cur = str(to_cur or 'EUR').strip().upper()
    
    if from_cur == to_cur:
        return float(amount)
        
    rates = get_rates()
    val = float(amount)
    
    # Convert from original currency to EUR base
    amount_in_eur = val / rates.get(from_cur, rates.get('EUR', 1.0))
    # Convert from EUR base to target currency
    return amount_in_eur * rates.get(to_cur, rates.get('EUR', 1.0))
