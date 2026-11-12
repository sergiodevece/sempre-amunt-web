const normalize = value => value.toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "");
const menu = document.querySelector(".menu-button");
const navigation = document.querySelector("#nav-principal");
menu?.addEventListener("click", () => {
  const expanded = navigation.classList.toggle("expanded");
  menu.setAttribute("aria-expanded", String(expanded));
});

const dialog = document.querySelector("#buscador");
const query = document.querySelector("#buscar");
const status = document.querySelector(".search-status");
const results = document.querySelector(".search-results");
let searchIndex;
let openButton;

function drawSearch() {
  if (!searchIndex) return;
  const terms = normalize(query.value).trim().split(/\s+/).filter(Boolean);
  const matches = searchIndex.filter(entry => {
    const haystack = normalize(entry.title + " " + entry.description);
    return terms.every(term => haystack.includes(term));
  });
  results.replaceChildren();
  status.textContent = terms.length
    ? matches.length === 1 ? "1 resultado" : `${matches.length} resultados`
    : "Secciones y noticias";
  for (const entry of matches.slice(0, 12)) {
    const item = document.createElement("li");
    const anchor = document.createElement("a");
    const title = document.createElement("strong");
    const summary = document.createElement("span");
    title.textContent = entry.title;
    summary.textContent = entry.description;
    anchor.href = entry.url;
    anchor.append(title, summary);
    item.append(anchor);
    results.append(item);
  }
}

document.querySelector("[data-search-open]")?.addEventListener("click", async event => {
  openButton = event.currentTarget;
  dialog.showModal();
  query.focus();
  if (searchIndex) return drawSearch();
  status.textContent = "Cargando búsqueda…";
  try {
    const response = await fetch("/assets/busqueda.json");
    if (!response.ok) throw new Error("No se ha cargado el índice");
    searchIndex = await response.json();
    drawSearch();
  } catch {
    status.textContent = "La búsqueda no está disponible. Puedes navegar desde el menú.";
  }
});
dialog?.addEventListener("close", () => openButton?.focus());
query?.addEventListener("input", drawSearch);

for (const group of document.querySelectorAll("[data-filter-group]")) {
  const rows = [...group.querySelectorAll("[data-kind]")];
  const select = group.querySelector("[data-kind-select]");
  const order = group.querySelector("[data-order-select]");
  const input = group.querySelector("[data-name-input]");
  const count = group.querySelector(".filter-count");
  const empty = group.querySelector(".empty-state");

  function applyFilters() {
    const name = normalize(input?.value.trim() || "");
    const kind = select?.value;
    let visible = 0;
    for (const row of rows) {
      row.hidden = Boolean((kind && kind !== row.dataset.kind) || (name && !normalize(row.dataset.name || "").includes(name)));
      if (!row.hidden) visible++;
    }
    count.textContent = `${visible} de ${rows.length}`;
    if (empty) empty.hidden = visible !== 0;
  }

  select?.addEventListener("change", applyFilters);
  input?.addEventListener("input", applyFilters);
  order?.addEventListener("change", () => {
    const field = order.value;
    const sorted = [...rows].sort((a,b) => field === "dorsal"
      ? Number(a.dataset.dorsal) - Number(b.dataset.dorsal)
      : Number(b.dataset[field]) - Number(a.dataset[field]) || Number(a.dataset.dorsal) - Number(b.dataset.dorsal));
    rows[0]?.parentElement.append(...sorted);
  });
  applyFilters();
}

const loginError = document.querySelector(".login-error");
const access = new URLSearchParams(location.search).get("acceso");
if (loginError && access) {
  loginError.hidden = false;
  loginError.textContent = access === "incorrecto"
    ? "El código no coincide. Comprueba que lo has escrito correctamente."
    : "El acceso de prueba aún no está configurado.";
  document.querySelector("#codigo")?.focus();
}

for (const button of document.querySelectorAll("[data-interest]")) {
  const key = "sempre-amunt:" + button.dataset.interest;
  const feedback = button.parentElement.querySelector(".interest-status");
  const initialLabel = button.textContent;
  let saved = false;
  try { saved = localStorage.getItem(key) === "1"; } catch { /* The browser may block local storage. */ }

  function render() {
    button.setAttribute("aria-pressed", String(saved));
    button.textContent = saved ? "Quitar selección" : initialLabel;
    feedback.textContent = saved ? "Guardado en este navegador." : "";
  }
  button.addEventListener("click", () => {
    try {
      if (saved) localStorage.removeItem(key);
      else localStorage.setItem(key, "1");
      saved = !saved;
      render();
    } catch {
      feedback.textContent = "Este navegador impide guardar la selección.";
    }
  });
  render();
}
