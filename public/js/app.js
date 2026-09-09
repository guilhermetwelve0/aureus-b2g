/* ==========================================================================
   Aureus B2G - Interactive Client Script
   Radar PNCP, Auditoria CND, Calculadora BDI & Parcerias
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants & Global State ---
  const WHATSAPP_PHONE = '5519998927472';
  let activeEditalParaDossie = null;

  // Formatters
  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatPercent = (val) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + '%';

  // --- 1. Radar PNCP ao Vivo ---
  const radarResultsGrid = document.getElementById('radar-results-grid');
  const resultsCountLabel = document.getElementById('results-count-label');
  const radarSearchTerm = document.getElementById('radar-search-term');
  const radarModalidade = document.getElementById('radar-modalidade');
  const radarUf = document.getElementById('radar-uf');
  const btnSearchPncp = document.getElementById('btn-search-pncp');
  const filterTags = document.querySelectorAll('.tag-badge');

  async function fetchRadarTenders(termo = '', modalidade = 'TODAS', uf = 'TODOS') {
    if (resultsCountLabel) {
      resultsCountLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Consultando oportunidades no PNCP...';
    }

    try {
      const params = new URLSearchParams();
      if (termo) params.append('termo', termo);
      if (modalidade && modalidade !== 'TODAS') params.append('modalidade', modalidade);
      if (uf && uf !== 'TODOS') params.append('uf', uf);

      const res = await fetch(`/api/pncp/consulta?${params.toString()}`);
      const data = await res.json();

      renderRadarTenders(data.data || []);
      if (resultsCountLabel) {
        const count = data.data ? data.data.length : 0;
        resultsCountLabel.innerHTML = `Exibindo <strong>${count}</strong> editais auditados pela Lei 14.133/2021`;
      }
    } catch (err) {
      console.error('Erro ao consultar PNCP:', err);
      if (resultsCountLabel) {
        resultsCountLabel.innerHTML = 'Exibindo oportunidades pré-carregadas da base governamental.';
      }
    }
  }

  function renderRadarTenders(tenders) {
    if (!radarResultsGrid) return;
    radarResultsGrid.innerHTML = '';

    if (tenders.length === 0) {
      radarResultsGrid.innerHTML = `
        <div class="col-span-full text-center" style="grid-column: 1/-1; padding: 40px;">
          <i class="fa-solid fa-folder-open text-muted" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
          <h4>Nenhum edital encontrado para este filtro.</h4>
          <p class="text-muted text-sm">Tente buscar por termos mais amplos como "obras", "medicamentos", "veículos" ou "serviços".</p>
        </div>
      `;
      return;
    }

    tenders.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'tender-card';

      const dataLimite = new Date(item.dataEncerramentoProposta);
      const dataFormatada = isNaN(dataLimite.getTime()) ? 'Sob Consulta' : dataLimite.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div>
          <div class="tender-top-meta">
            <span class="tender-badge-modalidade">${item.modalidadeNome}</span>
            <span class="tender-uf">${item.orgaoEntidade.ufSigla || 'BR'}</span>
          </div>
          <div class="tender-orgao">
            <i class="fa-solid fa-landmark"></i> ${item.orgaoEntidade.razaoSocial}
          </div>
          <h4 class="tender-objeto" title="${item.objeto}">${item.objeto}</h4>
        </div>

        <div>
          <div class="tender-financial-row">
            <div>
              <span class="tender-valor-label">Valor Estimado</span>
              <div class="tender-valor-num">${formatBRL(item.valorTotalEstimado)}</div>
            </div>
            <div class="tender-deadline">
              <span class="text-xs text-muted block">Abertura:</span>
              <strong>${dataFormatada}</strong>
            </div>
          </div>

          <div class="tender-actions">
            <button class="btn btn-secondary btn-sm btn-block btn-open-dossier" data-id="${item.id}">
              <i class="fa-solid fa-file-shield text-gold"></i> Dossiê do Edital
            </button>
            <button class="btn btn-outline btn-sm btn-block btn-calc-bid" data-valor="${item.valorTotalEstimado}">
              <i class="fa-solid fa-calculator text-cyan"></i> Simular BDI
            </button>
          </div>
        </div>
      `;

      // Wire up buttons
      const btnDossier = card.querySelector('.btn-open-dossier');
      btnDossier.addEventListener('click', () => openDossierModalForEdital(item));

      const btnCalc = card.querySelector('.btn-calc-bid');
      btnCalc.addEventListener('click', () => {
        const directCost = item.valorTotalEstimado * 0.78; // Approx 78% direct cost
        const inputCusto = document.getElementById('input-custo-direto');
        if (inputCusto) {
          inputCusto.value = Math.min(Math.max(Math.round(directCost), 10000), 2000000);
          updateBdiCalculation();
        }
        document.getElementById('calculadora-bdi').scrollIntoView({ behavior: 'smooth' });
      });

      radarResultsGrid.appendChild(card);
    });
  }

  // Radar Filters Event Listeners
  if (btnSearchPncp) {
    btnSearchPncp.addEventListener('click', () => {
      fetchRadarTenders(radarSearchTerm.value, radarModalidade.value, radarUf.value);
    });
  }

  if (radarSearchTerm) {
    radarSearchTerm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        fetchRadarTenders(radarSearchTerm.value, radarModalidade.value, radarUf.value);
      }
    });
  }

  if (radarModalidade) {
    radarModalidade.addEventListener('change', () => {
      fetchRadarTenders(radarSearchTerm.value, radarModalidade.value, radarUf.value);
    });
  }

  if (radarUf) {
    radarUf.addEventListener('change', () => {
      fetchRadarTenders(radarSearchTerm.value, radarModalidade.value, radarUf.value);
    });
  }

  filterTags.forEach((tag) => {
    tag.addEventListener('click', () => {
      filterTags.forEach((t) => t.classList.remove('active'));
      tag.classList.add('active');
      const query = tag.getAttribute('data-query');
      if (radarSearchTerm) radarSearchTerm.value = query;
      fetchRadarTenders(query, radarModalidade ? radarModalidade.value : 'TODAS', radarUf ? radarUf.value : 'TODOS');
    });
  });

  // Load initial tenders
  fetchRadarTenders();

  // --- 2. Auditor de CNDs Anti-Inabilitação ---
  const cnpjAuditInput = document.getElementById('cnpj-audit-input');
  const btnRunAudit = document.getElementById('btn-run-audit');
  const certChecklistContainer = document.getElementById('cert-checklist-container');
  const auditScoreVal = document.getElementById('audit-score-val');
  const auditScoreText = document.getElementById('audit-score-text');
  const auditCompanyName = document.getElementById('audit-company-name');
  const presetChips = document.querySelectorAll('.btn-chip');

  const PROFILES_DATA = {
    regular: {
      name: 'Alfa Engenharia & Construções Ltda',
      cnpj: '12.345.678/0001-90',
      score: 100,
      scoreText: '100% APTO A PARTICIPAR',
      scoreColor: '#10b981',
      certs: [
        { name: 'Receita Federal / PGFN', desc: 'Tributos Federais e Dívida Ativa da União', status: 'valid', label: 'Válida (expira em 142 dias)' },
        { name: 'CRF / FGTS (Caixa Econômica)', desc: 'Certificado de Regularidade do FGTS', status: 'valid', label: 'Válida (expira em 28 dias)' },
        { name: 'CNDT (Tribunal Superior do Trabalho)', desc: 'Certidão Negativa de Débitos Trabalhistas', status: 'valid', label: 'Válida (expira em 160 dias)' },
        { name: 'SEFAZ Estadual (ICMS)', desc: 'Certidão Negativa de Débitos Estaduais', status: 'valid', label: 'Válida (expira em 84 dias)' },
        { name: 'Certidão Falência & Concordata', desc: 'Tribunal de Justiça - Distribuidor Cível', status: 'valid', label: 'Válida (expira em 75 dias)' },
        { name: 'SICAF Nível I a VI', desc: 'Sistema de Cadastramento Unificado de Fornecedores', status: 'valid', label: 'Ativo e Homologado' }
      ]
    },
    warning: {
      name: 'Distribuidora Hospitalar Beta Ltda',
      cnpj: '28.910.112/0001-45',
      score: 82,
      scoreText: 'ATENÇÃO: VENCIMENTO IMINENTE',
      scoreColor: '#f59e0b',
      certs: [
        { name: 'Receita Federal / PGFN', desc: 'Tributos Federais e Dívida Ativa da União', status: 'valid', label: 'Válida (expira em 90 dias)' },
        { name: 'CRF / FGTS (Caixa Econômica)', desc: 'Certificado de Regularidade do FGTS', status: 'warning', label: 'Alerta: Vence em 4 dias' },
        { name: 'CNDT (Tribunal Superior do Trabalho)', desc: 'Certidão Negativa de Débitos Trabalhistas', status: 'valid', label: 'Válida (expira em 48 dias)' },
        { name: 'SEFAZ Estadual (ICMS)', desc: 'Certidão Negativa de Débitos Estaduais', status: 'valid', label: 'Válida (expira em 60 dias)' },
        { name: 'Certidão Falência & Concordata', desc: 'Tribunal de Justiça - Distribuidor Cível', status: 'valid', label: 'Válida (expira em 32 dias)' },
        { name: 'SICAF Nível I a VI', desc: 'Sistema de Cadastramento Unificado de Fornecedores', status: 'warning', label: 'Aviso: Balanço a Renovar' }
      ]
    },
    critical: {
      name: 'Delta Prestadora de Serviços Contínuos Ltda',
      cnpj: '45.102.839/0001-11',
      score: 45,
      scoreText: 'RISCO CRÍTICO DE INABILITAÇÃO',
      scoreColor: '#ef4444',
      certs: [
        { name: 'Receita Federal / PGFN', desc: 'Tributos Federais e Dívida Ativa da União', status: 'critical', label: 'CRÍTICO: Débito em Dívida Ativa' },
        { name: 'CRF / FGTS (Caixa Econômica)', desc: 'Certificado de Regularidade do FGTS', status: 'critical', label: 'CRÍTICO: Impedimento Constatado' },
        { name: 'CNDT (Tribunal Superior do Trabalho)', desc: 'Certidão Negativa de Débitos Trabalhistas', status: 'valid', label: 'Válida (expira em 110 dias)' },
        { name: 'SEFAZ Estadual (ICMS)', desc: 'Certidão Negativa de Débitos Estaduais', status: 'warning', label: 'Expira amanhã' },
        { name: 'Certidão Falência & Concordata', desc: 'Tribunal de Justiça - Distribuidor Cível', status: 'valid', label: 'Válida (expira em 90 dias)' },
        { name: 'SICAF Nível I a VI', desc: 'Sistema de Cadastramento Unificado de Fornecedores', status: 'critical', label: 'Bloqueado por Inadimplência' }
      ]
    }
  };

  let currentAuditProfile = PROFILES_DATA.regular;

  function renderAuditProfile(profile) {
    currentAuditProfile = profile;
    if (auditCompanyName) auditCompanyName.textContent = profile.name;
    if (cnpjAuditInput) cnpjAuditInput.value = profile.cnpj;
    if (auditScoreVal) {
      auditScoreVal.textContent = profile.score + '%';
      auditScoreVal.style.color = profile.scoreColor;
    }
    if (auditScoreText) {
      auditScoreText.textContent = profile.scoreText;
      auditScoreText.style.color = profile.scoreColor;
    }

    if (certChecklistContainer) {
      certChecklistContainer.innerHTML = '';
      profile.certs.forEach((c) => {
        const item = document.createElement('div');
        item.className = `cert-card ${c.status}`;
        item.innerHTML = `
          <div class="cert-info">
            <h5>${c.name}</h5>
            <p>${c.desc}</p>
          </div>
          <span class="cert-status-badge badge-${c.status}">
            <i class="fa-solid fa-${c.status === 'valid' ? 'circle-check' : (c.status === 'warning' ? 'triangle-exclamation' : 'circle-xmark')}"></i>
            ${c.label}
          </span>
        `;
        certChecklistContainer.appendChild(item);
      });
    }
  }

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      presetChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const key = chip.getAttribute('data-profile');
      if (PROFILES_DATA[key]) {
        renderAuditProfile(PROFILES_DATA[key]);
      }
    });
  });

  if (btnRunAudit) {
    btnRunAudit.addEventListener('click', () => {
      const cnpjVal = cnpjAuditInput ? cnpjAuditInput.value.trim() : '';
      if (!cnpjVal) return;

      btnRunAudit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Auditando...';
      btnRunAudit.disabled = true;

      setTimeout(() => {
        btnRunAudit.innerHTML = '<i class="fa-solid fa-rotate"></i> Auditar Certidões Agora';
        btnRunAudit.disabled = false;
        renderAuditProfile(currentAuditProfile);
      }, 600);
    });
  }

  // Initial audit render
  renderAuditProfile(PROFILES_DATA.regular);

  // --- 3. Calculadora de BDI (Acórdão TCU 2622/2013) ---
  const inputCustoDireto = document.getElementById('input-custo-direto');
  const inputAc = document.getElementById('input-ac');
  const inputSg = document.getElementById('input-sg');
  const inputR = document.getElementById('input-r');
  const inputDf = document.getElementById('input-df');
  const inputLucro = document.getElementById('input-lucro');
  const inputImpostos = document.getElementById('input-impostos');

  const dispCustoDireto = document.getElementById('disp-custo-direto');
  const dispAc = document.getElementById('disp-ac');
  const dispSg = document.getElementById('disp-sg');
  const dispR = document.getElementById('disp-r');
  const dispDf = document.getElementById('disp-df');
  const dispLucro = document.getElementById('disp-lucro');
  const dispImpostos = document.getElementById('disp-impostos');

  const dispBdiRate = document.getElementById('disp-bdi-rate');
  const dispBdiVerdict = document.getElementById('disp-bdi-verdict');
  const dispResCusto = document.getElementById('disp-res-custo');
  const dispResBdiVal = document.getElementById('disp-res-bdi-val');
  const dispResTributos = document.getElementById('disp-res-tributos');
  const dispResPrecoFinal = document.getElementById('disp-res-preco-final');

  function updateBdiCalculation() {
    const custo = parseFloat(inputCustoDireto ? inputCustoDireto.value : 250000);
    const ac = parseFloat(inputAc ? inputAc.value : 4.5) / 100;
    const sg = parseFloat(inputSg ? inputSg.value : 0.8) / 100;
    const r = parseFloat(inputR ? inputR.value : 1.2) / 100;
    const df = parseFloat(inputDf ? inputDf.value : 1.1) / 100;
    const l = parseFloat(inputLucro ? inputLucro.value : 7.5) / 100;
    const i = parseFloat(inputImpostos ? inputImpostos.value : 8.65) / 100;

    // Update displays
    if (dispCustoDireto) dispCustoDireto.textContent = formatBRL(custo);
    if (dispAc) dispAc.textContent = formatPercent(ac * 100);
    if (dispSg) dispSg.textContent = formatPercent(sg * 100);
    if (dispR) dispR.textContent = formatPercent(r * 100);
    if (dispDf) dispDf.textContent = formatPercent(df * 100);
    if (dispLucro) dispLucro.textContent = formatPercent(l * 100);
    if (dispImpostos) dispImpostos.textContent = formatPercent(i * 100);

    // TCU Official Formula:
    // BDI = [((1 + AC + S + R + G) * (1 + DF) * (1 + L)) / (1 - I)] - 1
    const numerador = (1 + ac + sg + r) * (1 + df) * (1 + l);
    const denominador = 1 - i;
    const bdiTaxa = (numerador / denominador) - 1;
    const bdiPercent = bdiTaxa * 100;

    const valorBdi = custo * bdiTaxa;
    const precoFinal = custo + valorBdi;
    const valorTributos = precoFinal * i;

    if (dispBdiRate) dispBdiRate.textContent = formatPercent(bdiPercent);
    if (dispResCusto) dispResCusto.textContent = formatBRL(custo);
    if (dispResBdiVal) dispResBdiVal.textContent = formatBRL(valorBdi);
    if (dispResTributos) dispResTributos.textContent = formatBRL(valorTributos);
    if (dispResPrecoFinal) dispResPrecoFinal.textContent = formatBRL(precoFinal);

    // TCU Range Check (Typical recommended range is 20.0% to 28.5%)
    if (dispBdiVerdict) {
      if (bdiPercent >= 18.0 && bdiPercent <= 28.5) {
        dispBdiVerdict.innerHTML = '<i class="fa-solid fa-circle-check text-emerald"></i> Em Conformidade com a Faixa Média do TCU';
        dispBdiVerdict.style.color = 'var(--accent-emerald)';
      } else if (bdiPercent > 28.5) {
        dispBdiVerdict.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber"></i> Acima da Faixa Padrão TCU (Exige Justificativa Técnica)';
        dispBdiVerdict.style.color = 'var(--accent-amber)';
      } else {
        dispBdiVerdict.innerHTML = '<i class="fa-solid fa-circle-info text-cyan"></i> Abaixo da Faixa Média (Margem Operacional Apertada)';
        dispBdiVerdict.style.color = 'var(--accent-cyan)';
      }
    }
  }

  const bdiSliders = [inputCustoDireto, inputAc, inputSg, inputR, inputDf, inputLucro, inputImpostos];
  bdiSliders.forEach((s) => {
    if (s) s.addEventListener('input', updateBdiCalculation);
  });
  updateBdiCalculation();

  // Export BDI to Proposal action
  const btnApplyBdi = document.getElementById('btn-apply-bdi-proposal');
  if (btnApplyBdi) {
    btnApplyBdi.addEventListener('click', () => {
      openDossierModalForBdi();
    });
  }

  // --- 4. Partner VIP Registration & WhatsApp Link ---
  const partnerForm = document.getElementById('partner-vip-form');
  if (partnerForm) {
    partnerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('partner-nome').value.trim();
      const consultoria = document.getElementById('partner-consultoria').value.trim();
      const whatsapp = document.getElementById('partner-whatsapp').value.trim();
      const clientes = document.getElementById('partner-clientes').value;
      const segmento = document.getElementById('partner-segmento').value;

      const submitBtn = partnerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ativando VIP...';
      submitBtn.disabled = true;

      try {
        await fetch('/api/parceiros/vip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            consultoria,
            whatsapp,
            carteiraClientes: clientes,
            segmento
          })
        });
      } catch (err) {
        console.error('Erro ao registrar parceiro:', err);
      }

      // Pre-filled WhatsApp message for Guilherme
      const msg = `Olá, Guilherme! Sou *${nome}* da *${consultoria}*.\n\n` +
                  `Solicitei a ativação do *Acesso VIP de 30 Dias* da Aureus B2G.\n` +
                  `• Carteira: ${clientes}\n` +
                  `• Segmento: ${segmento}\n` +
                  `• WhatsApp: ${whatsapp}\n\n` +
                  `Gostaria de realizar a demonstração técnica e liberar o painel da nossa assessoria!`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;

      submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Ativado com Sucesso!';
      submitBtn.style.background = 'var(--accent-emerald)';

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.style.background = '';
      }, 1000);
    });
  }

  // --- 5. Modals (Demo Specialist & Dossier) ---
  const demoModal = document.getElementById('demo-modal');
  const btnOpenDemoModal = document.getElementById('btn-open-demo-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnFinalWhatsapp = document.getElementById('btn-final-whatsapp');

  function openDemoModal() {
    if (demoModal) demoModal.classList.add('active');
  }

  function closeDemoModal() {
    if (demoModal) demoModal.classList.remove('active');
  }

  if (btnOpenDemoModal) btnOpenDemoModal.addEventListener('click', openDemoModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeDemoModal);
  if (btnFinalWhatsapp) {
    btnFinalWhatsapp.addEventListener('click', () => {
      const msg = "Olá, Guilherme! Gostaria de falar sobre a plataforma Aureus B2G e o programa de parceria para consultorias de licitação.";
      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // Dossier Modal
  const dossierModal = document.getElementById('dossier-modal');
  const btnCloseDossier = document.getElementById('btn-close-dossier');
  const dossierContentArea = document.getElementById('dossier-content-area');
  const btnPrintDossier = document.getElementById('btn-print-dossier');
  const btnPrintAction = document.getElementById('btn-print-action');

  function openDossierModalForEdital(edital) {
    activeEditalParaDossie = edital;
    if (!dossierContentArea || !dossierModal) return;

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const valorFormatado = formatBRL(edital.valorTotalEstimado);

    dossierContentArea.innerHTML = `
      <div style="padding: 10px 0;">
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="font-size: 1.4rem; color: #f59e0b;">DOSSIÊ DE INSTRUÇÃO E HABILITAÇÃO DO EDITAL</h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">Emissão Formal em conformidade com o Artigo 62 e seguintes da Lei Federal nº 14.133/2021.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.88rem;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8; width: 30%;"><strong>Órgão Contratante:</strong></td>
            <td style="padding: 8px 0;">${edital.orgaoEntidade.razaoSocial}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Modalidade & Número:</strong></td>
            <td style="padding: 8px 0;">${edital.modalidadeNome} • Compra Nº ${edital.numeroCompra}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Controle PNCP:</strong></td>
            <td style="padding: 8px 0; font-family: monospace;">${edital.numeroControlePNCP}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Valor Estimado:</strong></td>
            <td style="padding: 8px 0; font-weight: bold; color: #f59e0b;">${valorFormatado}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 8px 0; color: #94a3b8;"><strong>Objeto:</strong></td>
            <td style="padding: 8px 0;">${edital.objeto}</td>
          </tr>
        </table>

        <h4 style="font-size: 1rem; margin: 18px 0 10px; color: #10b981;">
          <i class="fa-solid fa-check-double"></i> Checklist Obrigatório de Habilitação (Art. 62 a 70)
        </h4>
        <ul style="list-style: none; padding: 0; font-size: 0.85rem; line-height: 1.8;">
          <li><i class="fa-solid fa-square-check text-emerald"></i> Regularidade Fiscal Federal e Dívida Ativa da União (PGFN)</li>
          <li><i class="fa-solid fa-square-check text-emerald"></i> Regularidade do Fundo de Garantia do Tempo de Serviço (CRF/FGTS)</li>
          <li><i class="fa-solid fa-square-check text-emerald"></i> Certidão Negativa de Débitos Trabalhistas (CNDT - Justiça do Trabalho)</li>
          <li><i class="fa-solid fa-square-check text-emerald"></i> Certidão Negativa de Falência, Recuperação Judicial ou Extrajudicial</li>
          <li><i class="fa-solid fa-square-check text-emerald"></i> Declaração de Cumprimento do Disposto no Inciso XXXIII do Art. 7º da CF (Trabalho de Menor)</li>
          <li><i class="fa-solid fa-square-check text-emerald"></i> Declaração de Inexistência de Fatos Impeditivos e Proposta Independente</li>
        </ul>

        <div style="background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 14px; margin-top: 20px; font-size: 0.8rem; color: #94a3b8;">
          Emitido via <strong>Aureus B2G Intelligence</strong> para uso exclusivo da consultoria de licitação e seu cliente credenciado em ${dataHoje}.
        </div>
      </div>
    `;

    dossierModal.classList.add('active');
  }

  function openDossierModalForBdi() {
    if (!dossierContentArea || !dossierModal) return;
    const bdiRate = dispBdiRate ? dispBdiRate.textContent : '24.82%';
    const precoFinal = dispResPrecoFinal ? dispResPrecoFinal.textContent : 'R$ 312.050,00';
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    dossierContentArea.innerHTML = `
      <div style="padding: 10px 0;">
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="font-size: 1.4rem; color: #f59e0b;">MEMORIAL DE CÁLCULO DE BDI & PROPOSTA DE PREÇOS</h2>
          <p style="font-size: 0.85rem; color: #94a3b8;">Embasamento Técnico em Conformidade com o Acórdão nº 2622/2013 - Plenário do TCU.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px;">
            <span style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Taxa de BDI Homologada</span>
            <div style="font-size: 1.8rem; font-weight: bold; color: #f59e0b; font-family: monospace;">${bdiRate}</div>
            <span style="font-size: 0.75rem; color: #10b981;">Faixa Aceita pelo TCU</span>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px;">
            <span style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Preço Final da Proposta</span>
            <div style="font-size: 1.8rem; font-weight: bold; color: #10b981; font-family: monospace;">${precoFinal}</div>
            <span style="font-size: 0.75rem; color: #94a3b8;">Impostos e Encargos Inclusos</span>
          </div>
        </div>

        <h4 style="font-size: 1rem; margin-bottom: 10px;">Justificativa de Conformidade Legal</h4>
        <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.6;">
          A presente taxa foi calculada estritamente segundo os parâmetros fixados para contratos públicos regidos pela Lei nº 14.133/2021, resguardando a exequibilidade econômico-financeira da proposta e a vedação ao sobrepreço.
        </p>

        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; color: #94a3b8;">
          Data da emissão: <strong>${dataHoje}</strong> • Documento gerado pelo sistema Aureus B2G.
        </div>
      </div>
    `;

    dossierModal.classList.add('active');
  }

  if (btnPrintDossier) {
    btnPrintDossier.addEventListener('click', () => {
      openDossierModalForEdital({
        id: 'audit-demo',
        numeroControlePNCP: '00394460000141-1-000492/2026',
        orgaoEntidade: { razaoSocial: 'Órgão Licitante - Pregão Eletrônico Lei 14.133', ufSigla: 'DF' },
        modalidadeNome: 'Pregão Eletrônico',
        numeroCompra: '048/2026',
        valorTotalEstimado: 1250000.00,
        objeto: 'Habilitação da empresa ' + (currentAuditProfile.name || 'Licitante') + ' para fornecimento continuado com regularidade fiscal plena.'
      });
    });
  }

  if (btnCloseDossier) {
    btnCloseDossier.addEventListener('click', () => {
      dossierModal.classList.remove('active');
    });
  }

  if (btnPrintAction) {
    btnPrintAction.addEventListener('click', () => {
      window.print();
    });
  }

  // Close modals on click outside
  window.addEventListener('click', (e) => {
    if (e.target === demoModal) closeDemoModal();
    if (e.target === dossierModal) dossierModal.classList.remove('active');
  });
});
