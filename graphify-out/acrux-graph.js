/* ACRUX presentation layer for Graphify's self-contained vis-network export. */
(function () {
  'use strict';

  const palette = [
    '#38b8d4', '#477fd2', '#72d9e7', '#5c9de0', '#3487b7', '#80b8e8',
    '#2a6eb4', '#54c9c6', '#739bc6', '#36a3bb', '#91d3ed', '#4d78ad',
  ];
  const accent = '#f7e634';
  const communityColor = new Map(LEGEND.map((item, index) => [item.cid, palette[index % palette.length]]));
  const hubs = new Set([...RAW_NODES].sort((a, b) => b.degree - a.degree).slice(0, 4).map((node) => node.id));

  nodesDS.update(RAW_NODES.map((node) => {
    const color = hubs.has(node.id) ? accent : communityColor.get(node.community);
    node.color = { background: color, border: '#d7f7ff', highlight: { background: '#ffffff', border: color }, hover: { background: '#ffffff', border: color } };
    return { id: node.id, color: node.color, borderWidth: hubs.has(node.id) ? 2.5 : 1.2 };
  }));
  edgesDS.update(RAW_EDGES.map((_, id) => ({
    id,
    color: { color: 'rgba(123, 203, 231, 0.17)', highlight: '#8be7f0', hover: '#8be7f0', inherit: false },
  })));
  LEGEND.forEach((item) => { item.color = communityColor.get(item.cid); });
  document.querySelectorAll('.legend-item').forEach((item, index) => {
    const dot = item.querySelector('.legend-dot');
    if (!dot || !LEGEND[index]) return;
    dot.style.backgroundColor = LEGEND[index].color;
    dot.style.boxShadow = `0 0 13px ${LEGEND[index].color}66`;
  });

  document.documentElement.lang = 'pt-BR';
  document.title = 'Mapa do projeto | ACRUX ROBOCEP';
  document.getElementById('search').placeholder = 'Buscar arquivo, função ou conceito…';
  document.querySelector('#info-panel h3').textContent = 'Detalhes do nó';
  document.querySelector('#legend-wrap h3').textContent = 'Comunidades';
  document.querySelector('#legend-controls label').lastChild.textContent = 'Selecionar todas';
  document.getElementById('info-content').innerHTML = '<span class="empty">Selecione um ponto para ver suas conexões.</span>';
  document.getElementById('stats').textContent = `${RAW_NODES.length} nós · ${RAW_EDGES.length} conexões · ${LEGEND.length} comunidades`;

  const heading = document.createElement('div');
  heading.id = 'acrux-heading';
  heading.innerHTML = '<div class="eyebrow">ACRUX ROBOCEP · Arquitetura</div><h1>Mapa de constelações</h1><p>Explore como as páginas, os componentes e os dados do projeto se conectam.</p>';
  document.body.appendChild(heading);

  const toolbar = document.createElement('nav');
  toolbar.id = 'acrux-toolbar';
  toolbar.setAttribute('aria-label', 'Controles do grafo');
  document.body.appendChild(toolbar);

  function button(label, title, action, pressed) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.title = title;
    element.setAttribute('aria-label', title);
    if (pressed !== undefined) element.setAttribute('aria-pressed', String(pressed));
    element.addEventListener('click', action);
    toolbar.appendChild(element);
    return element;
  }

  button('+', 'Aproximar', () => network.moveTo({ scale: Math.min(network.getScale() * 1.25, 4), animation: { duration: 220 } }));
  button('−', 'Afastar', () => network.moveTo({ scale: Math.max(network.getScale() / 1.25, 0.08), animation: { duration: 220 } }));
  button('Enquadrar', 'Enquadrar todos os pontos', () => network.fit({ animation: { duration: 400 } }));

  let labelsVisible = false;
  const labelsButton = button('Rótulos', 'Mostrar ou ocultar nomes dos nós', () => {
    labelsVisible = !labelsVisible;
    labelsButton.setAttribute('aria-pressed', String(labelsVisible));
    nodesDS.update(RAW_NODES.map((node) => ({
      id: node.id,
      font: labelsVisible ? { ...node.font, size: node.degree > 8 ? 13 : 10, color: '#eaf9ff', strokeWidth: 3, strokeColor: '#06152f' } : node.font,
    })));
  }, false);

  let edgesVisible = true;
  const edgesButton = button('Conexões', 'Mostrar ou ocultar conexões', () => {
    edgesVisible = !edgesVisible;
    edgesButton.setAttribute('aria-pressed', String(edgesVisible));
    edgesDS.update(RAW_EDGES.map((_, id) => ({ id, hidden: !edgesVisible })));
  }, true);

  button('Buscar /', 'Ir para a busca (atalho /)', () => document.getElementById('search').focus());

  const hint = document.createElement('p');
  hint.id = 'acrux-hint';
  hint.textContent = 'Arraste para mover · role para aproximar · toque em um nó para explorar';
  document.body.appendChild(hint);

  const search = document.getElementById('search');
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === 'Escape') {
      search.value = '';
      search.dispatchEvent(new Event('input'));
      search.blur();
      network.unselectAll();
    }
  });
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const match = RAW_NODES.find((node) => node.label.toLocaleLowerCase('pt-BR').includes(search.value.trim().toLocaleLowerCase('pt-BR')));
    if (!match || !search.value.trim()) return;
    event.preventDefault();
    focusNode(match.id);
    document.getElementById('search-results').style.display = 'none';
  });

  const nativeShowInfo = showInfo;
  showInfo = function (nodeId) {
    nativeShowInfo(nodeId);
    const panel = document.getElementById('info-content');
    panel.innerHTML = panel.innerHTML
      .replaceAll('Type:', 'Tipo:')
      .replaceAll('Community:', 'Comunidade:')
      .replaceAll('Source:', 'Origem:')
      .replaceAll('Degree:', 'Conexões:')
      .replaceAll('Neighbors (', 'Vizinhos (');
  };

  network.setOptions({ interaction: { keyboard: { enabled: true, bindToWindow: false }, multiselect: false }, nodes: { shadow: { enabled: true, color: 'rgba(56, 184, 212, 0.25)', size: 11, x: 0, y: 0 } } });
  window.addEventListener('resize', () => network.redraw());
})();

