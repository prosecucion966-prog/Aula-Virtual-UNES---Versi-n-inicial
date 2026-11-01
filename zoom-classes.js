// Gestión de clases en vivo. Modo de demostración local hasta conectar Zoom API + Neon.
(() => {
  const STORAGE_KEY = 'unes_zoom_clases_demo_v1';
  const $ = id => document.getElementById(id);
  const readClasses = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const saveClasses = items => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const showForm = show => { $('zoomClassFormWrap').style.display = show ? 'block' : 'none'; };
  function render() {
    const items = readClasses().sort((a,b) => (a.startAt || '').localeCompare(b.startAt || ''));
    $('zoomClassCount').textContent = items.length + (items.length === 1 ? ' clase' : ' clases');
    $('zoomClassList').innerHTML = items.length ? items.map(item => {
      const date = new Date(item.startAt);
      const dateLabel = Number.isNaN(date.getTime()) ? item.startAt : date.toLocaleString('es-VE',{dateStyle:'medium',timeStyle:'short'});
      return `<article class="zoom-class-item">
        <div><h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.unit || 'Sesión académica')} · ${escapeHtml(dateLabel)} · ${escapeHtml(item.duration)} min</p>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}</div>
        <div class="zoom-class-actions"><a class="zoom-join" href="${escapeHtml(item.joinUrl)}" target="_blank" rel="noopener noreferrer">Unirse a Zoom ↗</a>
        <button type="button" class="btn-user" data-delete-class="${escapeHtml(item.id)}">Eliminar</button></div>
      </article>`;
    }).join('') : '<div class="zoom-empty">Aún no hay clases programadas. Pulsa «Programar clase» para crear la primera.</div>';
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!$('view-clases')) return;
    $('btnNuevaClase').addEventListener('click', () => showForm(true));
    $('btnCancelarClase').addEventListener('click', () => { showForm(false); $('formZoomClase').reset(); });
    $('btnAbrirZoom').addEventListener('click', () => {
      const url = 'https://zoom.us/meeting/schedule';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    $('formZoomClase').addEventListener('submit', event => {
      event.preventDefault();
      const title = $('zoomTitulo').value.trim();
      const date = $('zoomFecha').value;
      const time = $('zoomHora').value;
      const joinUrl = $('zoomJoinUrl').value.trim();
      if (!title || !date || !time || !/^https:\/\/(?:[\w-]+\.)?zoom\.us\//i.test(joinUrl)) {
        alert('Completa el título, fecha, hora y un enlace válido de Zoom (https://zoom.us/...).');
        return;
      }
      const startAt = new Date(date + 'T' + time).toISOString();
      const items = readClasses();
      items.push({
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        title, unit:$('zoomUnidad').value.trim(), startAt,
        duration:Number($('zoomDuracion').value),
        description:$('zoomDescripcion').value.trim(), joinUrl
      });
      saveClasses(items);
      $('formZoomClase').reset();
      showForm(false);
      render();
      alert('Clase guardada en este navegador. Para que todos los estudiantes la vean, falta conectar el backend y Zoom API.');
    });
    $('zoomClassList').addEventListener('click', event => {
      const button = event.target.closest('[data-delete-class]');
      if (!button) return;
      if (!confirm('¿Eliminar esta clase de la lista?')) return;
      saveClasses(readClasses().filter(item => item.id !== button.dataset.deleteClass));
      render();
    });
    render();
  });
})();
