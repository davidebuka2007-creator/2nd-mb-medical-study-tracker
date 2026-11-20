/* 2ndMBstudy — Accessible Toast Notification Component */

function escapeText(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export function showToast(message, { variant = 'info', durationMs = 4500, onUndo = null } = {}) {
  const region = document.getElementById('toast-region');
  if (!region) return;

  const toastEl = document.createElement('div');
  toastEl.className = `toast toast--${variant}`;
  toastEl.setAttribute('role', 'status');

  const msgSpan = document.createElement('span');
  msgSpan.innerHTML = escapeText(message);
  toastEl.appendChild(msgSpan);

  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'inline-actions';

  let timerId = null;
  const dismiss = () => {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  };

  if (typeof onUndo === 'function') {
    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'btn btn-secondary btn-xs';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', async () => {
      dismiss();
      try {
        await onUndo();
      } catch {
        // Handled by caller if needed
      }
    });
    actionsWrap.appendChild(undoBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-ghost btn-xs';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', dismiss);
  actionsWrap.appendChild(closeBtn);

  toastEl.appendChild(actionsWrap);
  region.appendChild(toastEl);

  if (durationMs > 0) {
    timerId = window.setTimeout(dismiss, durationMs);
  }

  return { dismiss };
}
