// ===== SESSION RESET (MORNING / EVENING) =====
const MORNING_START = 10;   // 9 AM
const MORNING_END = 13;    // 1 PM
const EVENING_START = 16;  // 4 PM
const EVENING_END = 20;    // 8 PM

function getCurrentSession() {
  const now = new Date();
  const hour = now.getHours();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD

  if (hour >= MORNING_START && hour < MORNING_END) {
    return `${date}-morning`;
  }

  if (hour >= EVENING_START && hour < EVENING_END) {
    return `${date}-evening`;
  }

  return `${date}-closed`;
}

const activeSession = getCurrentSession();
const storedSession = localStorage.getItem("session");

// 🔁 RESET QUEUE WHEN SESSION CHANGES
if (storedSession !== activeSession) {
  localStorage.setItem("session", activeSession);
  localStorage.removeItem("queue");
  localStorage.removeItem("myTokenId");
}
// ===== CONFIG =====
const SERVICE_TIME = 10;

// ===== STORAGE =====
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let queue = JSON.parse(localStorage.getItem("queue")) || [];

// ===== PROTECT DASHBOARD =====
if (!currentUser && location.pathname.includes("dashboard")) {
  location.href = "index.html";
}

// ===== AUTH =====
function signup() {
  if (users.find(u => u.username === username.value && u.role === role.value)) {
    alert("User already exists");
    return;
  }

  users.push({ username: username.value, password: password.value, role: role.value });
  localStorage.setItem("users", JSON.stringify(users));
  alert("Signup successful");
}

function login() {
  const user = users.find(
    u => u.username === username.value &&
         u.password === password.value &&
         u.role === role.value
  );

  if (!user) {
    alert("Invalid login");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("myTokenId");
  location.href = "index.html";
}

// ===== ROLE UI =====
if (currentUser?.role === "user") {
  adminBtn.remove();
  showPage("book");
}

if (currentUser?.role === "admin") {
  bookBtn.remove();
  liveBtn.remove();
  showPage("admin");
}

// ===== NAV =====
function showPage(page) {
  ["book","admin","live"].forEach(p =>
    document.getElementById(p)?.classList.add("hidden")
  );
  document.getElementById(page)?.classList.remove("hidden");
  render();
}

// ===== QUEUE =====
function saveQueue() {
  localStorage.setItem("queue", JSON.stringify(queue));
}

function getToken() {
  const name = nameInput.value.trim();
  const purpose = purposeInput.value;

  if (!name) {
    alert("Enter your name");
    return;
  }

  // BLOCK same name + same purpose
  const exists = queue.find(
    q =>
      q.name.toLowerCase() === name.toLowerCase() &&
      q.purpose === purpose &&
      q.status !== "done"
  );

  if (exists) {
    alert(`You already have a token for ${purpose}`);
    return;
  }

  const token = {
    id: queue.length + 1,
    name,
    purpose,
    status: "waiting"
  };

  queue.push(token);
  saveQueue();

  // ⭐ STORE TOKEN ID
  localStorage.setItem("myTokenId", token.id);

  tokenInfo.innerText = `Your token number is #${token.id}`;
  render();
}

function serveNext() {
  const current = queue.find(q => q.status === "serving");
  if (current) current.status = "done";

  const next = queue.find(q => q.status === "waiting");
  if (next) next.status = "serving";

  saveQueue();
  render();
}

// ===== RENDER =====
function render() {
  queue = JSON.parse(localStorage.getItem("queue")) || [];

  const waiting = queue.filter(q => q.status === "waiting");
  const serving = queue.find(q => q.status === "serving");
  const completed = queue.filter(q => q.status === "done");

  // Admin stats
  waitingCount && (waitingCount.innerText = waiting.length);
  servingCount && (servingCount.innerText = serving ? 1 : 0);
  completedCount && (completedCount.innerText = completed.length);

  // Admin list
  queueList && (queueList.innerHTML =
    waiting.length
      ? waiting.map(q => `#${q.id} — ${q.name} (${q.purpose})`).join("<br>")
      : "No one waiting"
  );

  // Live queue
  nowServing && (nowServing.innerText = serving ? `#${serving.id}` : "—");

  // ⭐ CORRECT WAITING TIME
  if (waitTime) {
    const myTokenId = Number(localStorage.getItem("myTokenId"));
    const my = queue.find(q => q.id === myTokenId);

    if (!serving) {
      waitTime.innerText = "Waiting will start soon";
    } else if (my && my.status === "waiting") {
      const pos = waiting.findIndex(q => q.id === my.id);
      waitTime.innerText = `${(pos + 1) * SERVICE_TIME} min`;
    } else {
      waitTime.innerText = "—";
    }
  }
}