# Aureus B2G — Plataforma de Inteligência em Licitações Públicas

Plataforma de alta performance para **Consultorias de Licitação**, **Assessorias Empresariais B2G** e **Empresas Licitantes**, em conformidade total com a **Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021)** e o **Portal Nacional de Contratações Públicas (PNCP)**.

---

## 🏛️ Principais Funcionalidades

1. **Radar PNCP em Tempo Real**:
   - Integração direta com a API pública do PNCP.
   - Filtros dinâmicos por palavras-chave, Estado (UF) e modalidade (Pregão Eletrônico, Dispensa Eletrônica, Concorrência).
   - Rastreamento de editais de Saúde, Obras, TI, Alimentação e Serviços Contínuos.

2. **Auditor de Regularidade Fiscal & CNDs (Anti-Inabilitação)**:
   - Diagnóstico automatizado das 5 certidões essenciais para disputa pública:
     - Receita Federal / PGFN (Tributos Federais e Dívida Ativa da União)
     - CRF / FGTS (Caixa Econômica Federal)
     - CNDT (Certidão Negativa de Débitos Trabalhistas - TST)
     - Certidão Negativa de Falência e Concordata
     - Regularidade no SICAF (Níveis I a VI)
   - Alertas preditivos de vencimento para blindar clientes licitantes.

3. **Calculadora de BDI (Acórdão TCU nº 2622/2013)**:
   - Cálculo formal e justificado da taxa de Bonificação e Despesas Indiretas:
     $$BDI = \left( \frac{(1 + AC + S + R + G)(1 + DF)(1 + L)}{1 - I} \right) - 1$$
   - Simulação instantânea do preço de lance final e margem de lucro operacional.

4. **Gerador de Dossiê do Edital e Habilitação**:
   - Montagem de checklist de instrução em conformidade com os artigos 62 a 70 da Lei 14.133/2021.
   - Layout formal e pronto para impressão ou salvamento em PDF.

5. **Portal da Consultoria & Programa de Parcerias**:
   - Acesso VIP de 30 dias para consultores homologarem a solução.
   - Painel multi-cliente e comissão recorrente vitalícia de 30%.
   - Atendimento prioritário e integração com WhatsApp comercial.

---

## 🚀 Execução Local

```bash
# Instalação das dependências
npm install

# Inicialização do servidor
npm start
```

O sistema estará acessível em `http://localhost:10000`.

---

## 🐳 Container Docker

```bash
# Construção da imagem
docker build -t aureus-b2g .

# Execução
docker run -p 10000:10000 aureus-b2g
```

---

## ⚖️ Conformidade Legal
- Lei Federal nº 14.133/2021 (Nova Lei de Licitações e Contratos)
- Acórdão TCU nº 2622/2013 - Plenário
- Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)

© 2026 Aureus B2G Intelligence Systems.
