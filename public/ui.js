import { state, getSummary, getVisibleItems, escapeHtml, isSpaceOwner } from "./state.js";
import { resolveIconSvg } from "./icons.js";

const roomColorMap = {
  Genel: "#8B5CF6",
  Salon: "#FF8A3D",
  Mutfak: "#2BB673",
  "Yatak Odası": "#FF5FA2",
  Banyo: "#26B5E8",
  Balkon: "#A3D133",
  Antre: "#FFC93C",
};

function getHeroMessage() {
  const summary = getSummary();

  if (summary.total === 0)
    return "Evi düzenlemek için ilk adımı birlikte atalım!";
  if (summary.remaining > 10)
    return "Bugün birkaç işi halledersek evin hızla toparlanır!";
  if (summary.remaining > 0 && summary.remaining <= 3)
    return "Önce acil işlere bakalım. Ben listeyi tuttum!";
  if (summary.complete > 0 && summary.remaining === 0)
    return "Tebrikler! Artık burası gerçekten ev gibi. 🦒🏡";
  if (state.activeRoom !== "Genel")
    return `${state.activeRoom} modundayız! Bakalım burada neler eksik?`;
  return "Evi düzenlemek için ilk adımı birlikte atalım!";
}

function animateEyebrow(target) {
  const words = [
    "HOMMIE",
    "selam",
    "hey sen",
    "yine mi sen?",
    "baş belası",
    "kaos ustası",
    "ev halkı",
    "liste delisi",
    "koli kahramanı",
    "bugün olur mu?",
    "az kaldı",
    "sen yaparsın",
    "hadi bakalım",
    "bir tık daha",
    "oda oda",
    "zürafa onaylı",
    "kutular konuşuyor",
    "burası senin",
    "düzen geliyor",
    "neredeyse ev",
    "işte böyle",
    "devam et",
    "bak sen şuna",
    "fena değil",
    "eh işte",
    "yavaş yavaş",
    "bir gün biter",
    "ev olacak. 😏",
  ];

  let wordIndex = 0;
  let charIndex = 0;
  let timeoutId = null;

  const tick = () => {
    const currentWord = words[wordIndex];
    if (charIndex <= currentWord.length) {
      target.textContent = currentWord.slice(0, charIndex);
      charIndex += 1;
      timeoutId = window.setTimeout(tick, 90);
      return;
    }

    const nextDelay = wordIndex === words.length - 1 ? 1500 : 480;
    timeoutId = window.setTimeout(() => {
      wordIndex = (wordIndex + 1) % words.length;
      charIndex = 0;
      target.textContent = "";
      tick();
    }, nextDelay);
  };

  tick();

  return () => {
    if (timeoutId) window.clearTimeout(timeoutId);
  };
}

export function renderHero() {
  const hero = document.getElementById("hero");
  const summary = getSummary();

  if (!hero.querySelector(".hero-copy")) {
    hero.innerHTML = `
    <div class="hero-copy">
      
      <div class="eyebrow">
        <span class="eyebrow-word" aria-live="polite"></span>
      </div>
      <h1 class="hero-title">
        <span class="hero-line">Şimdilik dağınık.</span>
        <span class="hero-line">Yakında ev.</span>
      </h1>
      <p class="hero-subtitle"></p>
    </div>
    <div class="hero-visual">
      <img class="hero-giraffe" src="/assets/giraffe.png" alt="Hommie zürafa" />
    </div>
  `;

    const wordEl = hero.querySelector(".eyebrow-word");
    if (wordEl) {
      if (typeof wordEl._stopTyping === "function") wordEl._stopTyping();
      wordEl._stopTyping = animateEyebrow(wordEl);
    }
  }

  const message = hero.querySelector(".hero-subtitle");
  if (message) message.textContent = getHeroMessage();

  const progress = document.getElementById("progressStats");
  progress.innerHTML = `
    <div class="progress-label">${summary.complete} / ${summary.total} tamamlandı</div>
    <div class="progress-bar"><span class="progress-fill" style="width:${summary.percent}%"></span></div>
  `;
}

const roomIconMap = {
  Genel: "🏠",
  Salon: "🛋️",
  Mutfak: "🍳",
  "Yatak Odası": "🛏️",
  Banyo: "🛁",
  Balkon: "🪴",
  Antre: "🚪",
};

export function renderRoomFilters() {
  const container = document.getElementById("roomFilters");
  const rooms = Object.keys(roomIconMap);
  const counts = {};
  rooms.forEach((room) => {
    const roomItems = state.items.filter((item) =>
      room === "Genel" ? true : item.room === room,
    );
    counts[room] = roomItems.filter((item) => item.status !== "Tamam").length;
  });

  container.innerHTML = rooms
    .map(
      (room) => `
    <button type="button" class="room-pill ${state.activeRoom === room ? "active" : ""}" data-room="${room}">
      <span class="room-icon" aria-hidden="true">${roomIconMap[room]}</span>
      <span class="room-name">${escapeHtml(room)}</span>
      <span class="badge-count">${counts[room]}</span>
    </button>
  `,
    )
    .join("");
}

export function renderFilters() {
  const statusEl = document.getElementById("statusFilter");
  const priorityEl = document.getElementById("priorityFilter");
  const sortEl = document.getElementById("sortFilter");

  statusEl.value = state.statusFilter;
  priorityEl.value = state.priorityFilter;
  sortEl.value = state.sort;

  const totalEl = document.getElementById("filterTotal");
  if (totalEl) {
    totalEl.innerHTML = `Toplam <strong>${getVisibleItems().length}</strong> kayıt`;
  }
}

function renderNoteField(item) {
  return `
    <label class="note-field">
      <span>Not</span>
      <textarea
        data-action="note"
        data-id="${item.id}"
        placeholder="Yapılacaklar, notlar..."
        rows="2"
      >${escapeHtml(item.note || "")}</textarea>
    </label>
  `;
}

function itemImageMarkup(item) {
  const fallback = resolveIconSvg(item.name || "");
  const roomColor = roomColorMap[item.room] || "#1B1A3A";
  const imageSrc = item.image_url || "";
  const shouldShowImage = Boolean(imageSrc) && !imageSrc.includes("undefined");

  if (shouldShowImage) {
    return `
      <div class="card-image" data-room="${escapeHtml(item.room || "")}" style="background:${roomColor}">
        <img class="card-photo" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.name || "Öğe görseli")}" loading="lazy" />
        <div class="room-chip">${escapeHtml(item.room)}</div>
      </div>
    `;
  }

  return `
    <div class="card-image fallback" data-room="${escapeHtml(item.room || "")}" style="background:${roomColor}">
      <div class="fallback-icon">${fallback}</div>
      <div class="room-chip">${escapeHtml(item.room)}</div>
    </div>
  `;
}

export function renderCards() {
  const list = document.getElementById("cardList");
  const items = getVisibleItems();

  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>Henüz öğe yok.</h3>
        <p>İlk ekleyi yapıp ev listeni tamamlamaya başla.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
    <article class="item-card" data-id="${item.id}">
      ${itemImageMarkup(item)}
      <div class="card-body">
        <div class="card-header">
          <h3>${escapeHtml(item.name)}</h3>
          <button class="icon-button" data-action="delete" data-id="${item.id}" aria-label="${escapeHtml(item.name)} öğesini sil">×</button>
        </div>

        <div class="meta-row">
          <span class="pill type">${escapeHtml(item.type)}</span>
          <span class="pill priority priority-${item.priority || 3}">Öncelik ${item.priority || 3}</span>
        </div>

        <div class="meta-grid">
          <span>Oda: <strong>${escapeHtml(item.room)}</strong></span>
          <span>Durum: <strong>${escapeHtml(item.status)}</strong></span>
        </div>

        ${renderNoteField(item)}

        <div class="card-actions">
          <label class="compact-field">
            <span>Durum</span>
            <select data-action="status" data-id="${item.id}">
              <option value="Yapılmadı" ${item.status === "Yapılmadı" ? "selected" : ""}>Yapılmadı</option>
              <option value="Araştırılıyor" ${item.status === "Araştırılıyor" ? "selected" : ""}>Araştırılıyor</option>
              <option value="Sipariş verildi" ${item.status === "Sipariş verildi" ? "selected" : ""}>Sipariş verildi</option>
              <option value="Tamam" ${item.status === "Tamam" ? "selected" : ""}>Tamam</option>
            </select>
          </label>
          <button class="secondary-action" data-action="edit" data-id="${item.id}">Düzenle</button>
        </div>
      </div>
    </article>
  `,
    )
    .join("");

  document.querySelectorAll(".card-photo").forEach((img) => {
    img.addEventListener("error", () => {
      const root = img.closest(".card-image");
      if (root) {
        const fallback = resolveIconSvg(img.alt || "");
        root.classList.add("fallback");
        root.innerHTML = `<div class="fallback-icon">${fallback}</div><div class="room-chip">${escapeHtml(root.dataset.room || "")}</div>`;
      }
    });
  });
}

export function renderPhotoPanel() {
  const panel = document.getElementById("photoPanel");
  const roomSelect = document.getElementById("photoRoom");
  if (roomSelect) roomSelect.value = state.photoRoom;

  panel.hidden = state.activeView !== "photo";
}

export function renderPhotoSuggestions() {
  const list = document.getElementById("photoSuggestions");
  if (!list) return;

  if (!state.photoSuggestions.length) {
    list.innerHTML = `<p>Fotoğraf yükleyip <strong>${escapeHtml(state.photoStyle)}</strong> tarzında öneri al.</p>`;
    return;
  }

  list.innerHTML = state.photoSuggestions
    .map(
      (suggestion, index) => `
    <label class="suggestion-item">
      <input type="checkbox" value="${index}" data-photo-check="${index}" />
      <span>
        <strong>${escapeHtml(suggestion.name)}</strong>
        <small>${[suggestion.category, suggestion.room]
          .filter(Boolean)
          .map((part) => escapeHtml(part))
          .join(" • ")} • ${escapeHtml(suggestion.reason || "")}</small>
      </span>
    </label>
  `,
    )
    .join("");
}

export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

export function renderSpace() {
  const button = document.getElementById("spaceButton");
  const label = document.getElementById("spaceButtonLabel");
  if (!button || !label) return;

  button.hidden = !state.space;
  if (!state.space) return;
  label.textContent = state.space.name;

  const nameInput = document.getElementById("spaceNameInput");
  if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = state.space.name;
    nameInput.disabled = !isSpaceOwner();
  }

  const code = document.getElementById("inviteCode");
  if (code) code.textContent = state.space.invite_code;

  const list = document.getElementById("memberList");
  if (list) {
    list.innerHTML = state.members
      .map((member) => {
        const isSelf = member.id === state.memberId;
        const canRemove = isSpaceOwner() && !isSelf;
        return `
      <li class="member-row">
        <span class="member-name">${escapeHtml(member.name)}${isSelf ? " (sen)" : ""}</span>
        <span class="member-role">${escapeHtml(member.role)}</span>
        ${canRemove ? `<button type="button" class="mini-btn" data-remove-member="${member.id}">Çıkar</button>` : ""}
      </li>`;
      })
      .join("");
  }
}
