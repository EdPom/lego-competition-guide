const article = document.querySelector('.content');
const contents = document.querySelector('.page-contents');
const headings = article.querySelectorAll('h2[id]');
if (headings.length) {
  const list = document.createElement('ul');
  for (const heading of headings) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  }
  contents.querySelector('nav').append(list);
  contents.hidden = false;
}

for (const table of article.querySelectorAll('table')) {
  table.tabIndex = 0;
  table.setAttribute('aria-label', 'Reference table; scroll horizontally to see all columns');
}

for (const img of article.querySelectorAll('img')) {
  if (img.closest('a')) continue;
  const link = document.createElement('a');
  link.href = img.src;
  link.className = 'image-link';
  link.title = 'Open full-size image';
  link.setAttribute('aria-label', `Open full-size image: ${img.alt}`);
  img.before(link);
  link.append(img);
}

const blocks = [...new Set([...article.querySelectorAll(
  'pre > code.language-mermaid, pre.language-mermaid, div.language-mermaid pre'
)].map(node => node.closest('pre')))];

function showDiagramError(pre) {
  const message = document.createElement('p');
  message.className = 'diagram-error';
  message.append('This diagram could not load. ');
  const link = document.createElement('a');
  link.href = document.querySelector('.site-footer a').href;
  link.textContent = 'View the diagrams on GitHub.';
  message.append(link);
  pre.before(message);
}

if (blocks.length) {
  try {
    const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: 'system-ui, sans-serif',
      flowchart: { curve: 'stepAfter', useMaxWidth: false },
      themeVariables: {
        primaryColor: '#f0f6ef', primaryTextColor: '#20332b',
        primaryBorderColor: '#5f876b', lineColor: '#53665b',
        secondaryColor: '#fff4d7', tertiaryColor: '#ffffff', fontSize: '16px'
      }
    });
    for (const [index, pre] of blocks.entries()) {
      try {
        const { svg } = await mermaid.render(`guide-diagram-${index}`, pre.textContent);
        const figure = document.createElement('figure');
        figure.className = 'diagram';
        const caption = document.createElement('figcaption');
        caption.append('Follow the arrows left to right. Scroll sideways if needed.');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Fit to screen';
        button.setAttribute('aria-pressed', 'false');
        caption.append(button);
        const viewport = document.createElement('div');
        viewport.className = 'diagram-scroll';
        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-label', `Dependency diagram ${index + 1}; scroll horizontally to explore`);
        viewport.innerHTML = svg;
        const graphic = viewport.querySelector('svg');
        graphic.style.width = `${graphic.viewBox.baseVal.width}px`;
        button.addEventListener('click', () => {
          const fit = viewport.classList.toggle('is-fit');
          button.textContent = fit ? 'Actual size' : 'Fit to screen';
          button.setAttribute('aria-pressed', String(fit));
        });
        figure.append(caption, viewport);
        pre.replaceWith(figure);
      } catch (error) {
        console.error('Diagram rendering failed', error);
        showDiagramError(pre);
      }
    }
  } catch (error) {
    console.error('Diagram library could not load', error);
    blocks.forEach(showDiagramError);
  }
}
