export function renderBilge(variant = 'dialog') {
  return `
    <div class="bilge-mascot" data-variant="${variant}">
      <span class="bilge-emoji" aria-hidden="true">🦒</span>
      <p class="bilge-text">Zürafa bakıyor, şifreni bekliyor.</p>
    </div>
  `;
}
