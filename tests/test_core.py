import pytest
from core.arbitragem import calcular_lucro

def test_calculo_arbitragem():
    preco_compra = 100
    preco_venda = 110
    taxa = 0.01
    lucro = calcular_lucro(preco_compra, preco_venda, taxa)
    assert round(lucro, 2) == 8.9
