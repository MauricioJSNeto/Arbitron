def triangular_arbitrage(symbol1, symbol2, symbol3, exchange):
    """
    Identifica oportunidades de arbitragem triangular entre 3 pares.
    Retorna: (profitability, volume_available)
    """
    # Exemplo simplificado
    price1 = exchange.get_price(symbol1)
    price2 = exchange.get_price(symbol2)
    price3 = exchange.get_price(symbol3)
    profitability = (price1 / price2 * price3) - 1
    return profitability, min(price1.volume, price2.volume, price3.volume)

if __name__ == "__main__":
    print("Módulo de estratégia carregado.")
