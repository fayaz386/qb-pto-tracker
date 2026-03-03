async function apiGet(url) {
  const r = await fetch(url);
  return r.json();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

let currentUser = null;
async function checkAuth() {
  const r = await apiGet("/api/auth/me");
  if (!r.ok) {
    if (window.location.pathname !== "/login.html") {
      window.location.href = "login.html";
    }
    return;
  }
  currentUser = r.user;
  const disp = document.getElementById("currentUserDisplay");
  if (disp) disp.textContent = `User: ${currentUser.username}`;

  const controls = document.querySelector(".userControls");
  if (controls) controls.style.display = "flex";

  if (currentUser.role === 'admin') {
    const btn = document.getElementById("tabUsers");
    if (btn) btn.style.display = "inline-block";
  }
}

function fmtDateTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch { return iso; }
}

function reportLabel(kind) {
  if (kind === "earnings") return "Employee Earnings Report";
  if (kind === "vac") return "Employee Vac Report";
  return kind || "";
}

// --- Sync History ---
async function loadSyncHistory() {
  const tbody = document.querySelector("#syncHistoryTable tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" class="muted">Loading...</td></tr>`;

  try {
    const r = await apiGet("/api/sync-history");
    if (!r.ok) {
      tbody.innerHTML = `<tr><td colspan="4" class="error">Error: ${r.error}</td></tr>`;
      return;
    }

    if (r.rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">No sync history found.</td></tr>`;
      return;
    }

    tbody.innerHTML = r.rows.map(row => {
      const statusClass = row.status === 'OK' ? 'pillOk' : 'pillError';
      return `
        <tr>
          <td>${esc(fmtDateTime(row.created_at))}</td>
          <td><strong>${esc(row.username || "system")}</strong></td>
          <td><span class="${statusClass}">${esc(row.status)}</span></td>
          <td class="muted">${esc(row.details)}</td>
        </tr>
      `;
    }).join("");

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="error">${e.message}</td></tr>`;
  }
}

const btnSyncRef = document.getElementById("refreshSyncHistoryBtn");
if (btnSyncRef) btnSyncRef.addEventListener("click", loadSyncHistory);

// Load on init
loadSyncHistory();

if (document.getElementById("importYear")) {
  document.getElementById("importYear").value = new Date().getFullYear();
}

/** Tabs */
const tabImport = document.getElementById("tabImport");
const tab2 = document.getElementById("tab2");
const tab3 = document.getElementById("tab3");
const tab4 = document.getElementById("tab4");
const tabReports = document.getElementById("tabReports");

const pageImport = document.getElementById("pageImport");
const pageTab2 = document.getElementById("pageTab2");
const pageEntry = document.getElementById("pageEntry");
const pageSettings = document.getElementById("pageSettings");
const pageReports = document.getElementById("pageReports");
const pageUsers = document.getElementById("pageUsers");

function showOnly(pageToShow) {
  [pageImport, pageTab2, pageEntry, pageSettings, pageReports, pageUsers].forEach(p => p && p.classList.add("hidden"));
  if (pageToShow) pageToShow.classList.remove("hidden");
}

function setActiveButton(btn) {
  [tabImport, tab2, tab3, tab4, tabReports, tabUsers].forEach(b => b && b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function setActiveTab(which) {
  if (which === "import") {
    setActiveButton(tabImport);
    showOnly(pageImport);
  } else if (which === "tab2") {
    setActiveButton(tab2);
    showOnly(pageTab2);
  } else if (which === "tab3") {
    setActiveButton(tab3);
    showOnly(pageEntry);
  } else if (which === "tab4") {
    setActiveButton(tab4);
    showOnly(pageSettings);
  } else if (which === "tabReports") {
    setActiveButton(tabReports);
    showOnly(pageReports);
  } else if (which === "tabUsers") {
    setActiveButton(tabUsers);
    showOnly(pageUsers);
    loadUsers();
  }

  // Persist State
  localStorage.setItem("activeTab", which);
}

tabImport.addEventListener("click", () => setActiveTab("import"));
tab2.addEventListener("click", () => setActiveTab("tab2"));
tab3.addEventListener("click", () => setActiveTab("tab3"));
tab4.addEventListener("click", () => setActiveTab("tab4"));
if (tabReports) tabReports.addEventListener("click", () => setActiveTab("tabReports"));
const tabUsers = document.getElementById("tabUsers");
if (tabUsers) tabUsers.addEventListener("click", () => setActiveTab("tabUsers"));

// Wire Refresh Button
const btnRefresh = document.getElementById("globalRefreshBtn");
if (btnRefresh) {
  btnRefresh.addEventListener("click", () => window.location.reload());
}

// Restore Tab
const savedTab = localStorage.getItem("activeTab");
if (savedTab) setActiveTab(savedTab);
else setActiveTab("import");

checkAuth();

const documentRef = null; // Removed refreshImports listener


/** Employee Details (Tab2) */
const tab2Hotel = document.getElementById("tab2Hotel");
const tab2Employee = document.getElementById("tab2Employee");
const tab2Hint = document.getElementById("tab2Hint");
const detailsWrap = document.getElementById("employeeDetailsWrap");
const detailsSub = document.getElementById("detailsSub");


function prettyReportType(v) {
  const s = String(v || "").toLowerCase();
  if (s === "earnings" || s === "payroll") return "Payroll Summary Report";
  if (s === "vacation") return "Employee Vac Report";
  return v || "";
}
function formatNum(x) {
  if (x === null || x === undefined || x === "") return "";
  const n = Number(x);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function renderEmployeeDetailsTable(payload) {
  const latest = payload.latest || null;
  const history = payload.history || [];
  const emp = payload.employee || {};

  const html = [];

  // 1. Balance Cards (New Layout)
  html.push(`
    <style>
      .balance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .balanceCard { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .balanceCard.negative { border-color: #d00; background: #fff5f5; } 
      .balanceCard.positive { border-color: #2db34a; background: #f0fff4; }
      .balanceCard.zero { border-color: #eee; background: #fafafa; }
      
      .balanceCard.max-warning { border: 2px solid #d32f2f !important; background: #ffebee !important; }
      .balanceCard.max-warning .num { color: #c62828 !important; }
    </style>

    <div class="balance-grid">
      <!-- Left Column: Vacation -->
      <div>
        <div class="balanceCard" id="vacCardWrapper">
           <div id="vacBalance">Loading...</div>
        </div>
      </div>

      <!-- Right Column: Sick + Bereavement -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div class="balanceCard" id="sickCardWrapper">
           <div id="sickBalance">Loading...</div>
        </div>
        <div class="balanceCard" id="bereavCardWrapper">
           <div id="bereavBalance">Loading...</div>
        </div>
      </div>
    </div>
  `);

  // 2. Profile Section
  html.push(`
    <style>
      .profile-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 4px; }
      .profile-item { display: flex; flex-direction: column; }
      .profile-item label { font-size: 0.75rem; color: #666; font-weight: bold; text-transform: uppercase; }
      .profile-item span { font-size: 1rem; color: #333; }
    </style>
    <div class="profile-grid">
      <div class="profile-item"><label>Job Title</label><span>${esc(emp.job_title || "—")}</span></div>
      <div class="profile-item"><label>Date Hired</label><span>${esc(emp.hired_date || "—")}</span></div>
      <div class="profile-item"><label>Date of Birth</label><span>${esc(emp.birth_date || "—")}</span></div>
      <div class="profile-item"><label>Phone</label><span>${esc(emp.phone || "—")}</span></div>
      <div class="profile-item"><label>Email</label><span>${esc(emp.email || "—")}</span></div>
      <div class="profile-item" style="grid-column: span 2;"><label>Address</label><span>${esc(emp.address || "—")}</span></div>
    </div>
  `);

  if (!latest && history.length === 0) {
    html.push(`<div class="muted">No history data found for this employee.</div>`);
    return html.join("");
  }

  function reportLabel(kind) {
    const s = String(kind || "").toLowerCase();
    if (s === "earnings" || s === "payroll") return "Payroll Summary Report";
    if (s === "vacation") return "Employee Vac Report";
    return kind || "";
  }

  // Latest (optional)
  if (latest) {
    html.push(`<table class="table" style="min-width: 900px;">
      <thead>
        <tr><th colspan="6">LATEST BALANCE</th></tr>
        <tr>
          <th>Employee</th><th>Hotel</th><th>Import Date</th><th>Report Type</th>
          <th class="num">Vacation</th><th class="num">Sick</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(latest.employee || payload.employee || "")}</td>
          <td>${esc(latest.hotel || payload.hotel || "")}</td>
          <td>${esc(fmtDateTime(latest.import_date))}</td>
          <td>${esc(reportLabel(latest.report_kind || latest.report_type))}</td>
          <td class="num">${esc(latest.vacation_hours ?? "")}</td>
          <td class="num">${esc(latest.sick_hours ?? "")}</td>
        </tr>
      </tbody>
    </table>`);
  }

  // History (always show Manual Entries now)
  html.push(`<div style="height:12px;"></div>`);
  html.push(`<div class="cardHead"><h2>History (Manual Entries)</h2></div>`);
  html.push(`<div class="tableWrap"><table class="table" id="detailsHistoryTable" style="min-width: 900px;">
      <thead>
        <tr>
          <th>Date Range</th>
          <th>Type</th>
          <th>Days</th>
          <th>Note</th>
          <th style="width:100px;">Actions</th>
        </tr>
      </thead>
      <tbody>`);

  const manualOnly = history.filter(h => h.source === 'Manual');
  if (manualOnly.length === 0) {
    html.push(`<tr><td colspan="5" class="muted">No manual entries found.</td></tr>`);
  } else {
    const isAdmin = (currentUser && (currentUser.role === 'admin' || currentUser.isAdmin));
    html.push(renderManualEntryRows(manualOnly, isAdmin));
  }

  html.push(`</tbody></table></div>`);

  // Defer resizing init slightly to ensure DOM insertion (though synchronous HTML return usually implies caller inserts it next)
  // Actually renderEmployeeDetailsTable RETURNS html string. The caller inserts it.
  // So we must init resizing in the caller (loadEmployeeDetails).

  return html.join("");
}

// Helper for rendering manual entry rows
function renderManualEntryRows(list, isAdmin) {
  return list.map(h => {
    const canEdit = isAdmin;
    return `
            <tr>
                <td>${h.date_range}</td>
                <td>${h.type}</td>
                <td>${h.days}</td>
                <td><div style="max-width:300px; white-space:pre-wrap;" title="${esc(h.note)}">${esc(h.note || '-')}</div></td>
                <td>
                    ${canEdit ? `<button class="btn smallBtn" onclick="editEntry(${h.id})">Edit</button>
                    <button class="btnDangerSmall smallBtn" onclick="deleteEntry(${h.id})">Del</button>` : '<span class="muted">Locked</span>'}
                </td>
            </tr>
        `}).join("");
}

async function loadEmployeesForHotel(hotel) {


  tab2Employee.innerHTML = `<option value="">Select employee...</option>`;
  tab2Employee.disabled = true;
  detailsWrap.innerHTML = `<div class="muted">Choose hotel + employee.</div>`;
  detailsSub.textContent = "Choose hotel + employee.";

  if (!hotel) {
    tab2Hint.textContent = "Select a hotel to load employees.";
    return;
  }

  tab2Hint.textContent = "Loading employees...";
  const data = await apiGet(`/api/employees?hotel=${encodeURIComponent(hotel)}`);

  if (!data.ok) {
    tab2Hint.textContent = `Error: ${data.error}`;
    return;
  }

  const employees = data.employees || [];

  if (employees.length === 0) {
    tab2Hint.textContent = "No employees found for this hotel yet (import first).";
    return;
  }

  // Grouping
  const active = [];
  const inactive = [];

  for (const emp of employees) {
    // Check if simple string (legacy) or object
    const name = typeof emp === "string" ? emp : emp.name;
    const isActive = typeof emp === "string" ? true : emp.isActive;

    if (isActive) active.push(name);
    else inactive.push(name);
  }

  if (active.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = "Active Employees";
    active.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      grp.appendChild(opt);
    });
    tab2Employee.appendChild(grp);
  }

  if (inactive.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = "Inactive Employees";
    inactive.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      grp.appendChild(opt);
    });
    tab2Employee.appendChild(grp);
  }

  tab2Employee.disabled = false;
  tab2Hint.textContent = "Select an employee to view details.";

  // Also load warnings for this hotel
  loadAllEmployeeWarnings(hotel);
}

async function loadEmployeeDetails(hotel, employee) {
  detailsWrap.innerHTML = `<div class="muted">Loading...</div>`;
  detailsSub.textContent = `${employee} — ${hotel}`;

  // Fetch Settings (Types) and Details in parallel
  const [detailsData, settingsData] = await Promise.all([
    apiGet(`/api/employee-details?hotel=${encodeURIComponent(hotel)}&employee=${encodeURIComponent(employee)}`),
    apiGet("/api/settings/types") // returns {ok:true, rows:[{name, max_allowed}]}
  ]);

  if (!detailsData.ok) {
    detailsWrap.innerHTML = `<div class="error">Error: ${esc(detailsData.error)}</div>`;
    return;
  }

  // Parse Settings
  let maxSick = 0;
  let maxBereav = 0;
  if (settingsData.ok && settingsData.rows) {
    const fs = (n) => settingsData.rows.find(r => r.name.toLowerCase() === n.toLowerCase());
    const s = fs("Sick");
    const b = fs("Bereavement");
    if (s && s.max_allowed) maxSick = Number(s.max_allowed);
    if (b && b.max_allowed) maxBereav = Number(b.max_allowed);
  }

  detailsWrap.innerHTML = renderEmployeeDetailsTable(detailsData);
  enableColumnResizing('detailsHistoryTable');
  const employeeId = detailsData.employee?.id;

  // Update Current Balance cards
  const vacEl = document.getElementById("vacBalance");
  const sickEl = document.getElementById("sickBalance");

  function parseNum(x) {
    if (x === null || x === undefined) return null;
    if (typeof x === "number") return Number.isFinite(x) ? x : null;
    const s = String(x).trim();
    if (!s) return null;
    const cleaned = s.replace(/[$,]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  const historyRows = detailsData.history || [];
  const cb = detailsData.current_balance || {};

  // Vacation
  const currentYear = historyRows.reduce((max, r) => (r.year && r.year > max ? r.year : max), new Date().getFullYear());
  const vacUsedVal = (cb.vacation_used != null) ? Number(cb.vacation_used) : parseNum(cb.vacation_hours);
  const vacAmtVal = parseNum(cb.vacation_amount);

  if (vacEl) {
    if (vacAmtVal == null && vacUsedVal == null) {
      vacEl.textContent = "—";
    } else {
      const hrsStr = vacUsedVal != null ? "$" + Number(vacUsedVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
      const amtStr = vacAmtVal != null ? "$" + Number(vacAmtVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

      const vacManualRows = historyRows.filter(r => r.source === 'Manual' && r.type === 'Vacation');
      const vacManualSum = vacManualRows.reduce((sum, r) => sum + Number(r.days || 0), 0);
      const vacManualStr = vacManualSum.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });

      vacEl.innerHTML = `
        <div style="display:flex; flex-direction:row; align-items:center; justify-content:space-around; width:100%;">
          <div style="text-align:center; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Vacation Pay Available</div>
            <div style="font-weight:bold; font-size:1.4rem;">${amtStr}</div>
          </div>
          <div style="text-align:center; padding:0 8px; border-left:1px solid #ccc;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Vacation Used in ${currentYear}</div>
            <div style="font-weight:bold; font-size:1.4rem;">${hrsStr}</div>
          </div>
          <div style="text-align:center; padding:0 8px; border-left:1px solid #ccc;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Vac Days Input</div>
            <div style="font-weight:bold; font-size:1.4rem;">${vacManualStr}</div>
          </div>
        </div>
      `;
    }
    // Vacation Color Logic (Positive/Negative)
    const card = vacEl.closest(".balanceCard");
    if (card) {
      card.classList.remove("positive", "negative", "zero");
      if (vacAmtVal > 0) card.classList.add("positive");
      else if (vacAmtVal < 0) card.classList.add("negative");
      else card.classList.add("zero");
    }
  }

  // Sick Hours
  const sickHrsVal = (cb.sick_used_hours != null) ? Number(cb.sick_used_hours) : (parseNum(cb.sick_hours) || 0);
  const sickDaysVal = (cb.sick_days_used != null) ? Number(cb.sick_days_used) : (sickHrsVal / 8);
  const sickAmtVal = (cb.sick_used != null) ? Number(cb.sick_used) : (parseNum(cb.sick_amount) || 0);

  const hrsStr = sickHrsVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const daysStr = sickDaysVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amtStr = "$" + sickAmtVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (sickEl) {
    sickEl.innerHTML = `
        <div style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; width:100%;">
          <div style="flex:1; text-align:center; border-right:1px solid #ccc; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Sick Hours Used</div>
            <div style="font-weight:bold; font-size:1.4rem;">${hrsStr}</div>
            ${maxSick > 0 ? `<div style="font-size:0.7rem; color:#888;">Max: ${maxSick.toFixed(2)}</div>` : ''}
          </div>
          <div style="flex:1; text-align:center; border-right:1px solid #ccc; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Days Used</div>
            <div style="font-weight:bold; font-size:1.4rem;">${daysStr}</div>
          </div>
          <div style="flex:1; text-align:center; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Amount Paid</div>
            <div style="font-weight:bold; font-size:1.4rem;">${amtStr}</div>
          </div>
        </div>
      `;

    const card = sickEl.closest(".balanceCard");
    if (card) {
      card.classList.remove("positive", "negative", "zero", "max-warning");
      // Validation: If Used >= Max
      if (maxSick > 0 && sickHrsVal >= maxSick) {
        card.classList.add("max-warning");
      } else {
        if (sickAmtVal > 0) card.classList.add("positive"); // Usually sick paid is positive? actually it's "used" so neutral? Leaving as is or neutral
        else card.classList.add("zero");
      }
    }
  }

  // Bereavement Card
  const bereavEl = document.getElementById("bereavBalance");
  const bereavHrs = (cb.bereavement_used_hours != null) ? Number(cb.bereavement_used_hours) : 0;
  const bereavAmt = (cb.bereavement_used_amount != null) ? Number(cb.bereavement_used_amount) : 0;
  const bereavDays = (cb.bereavement_days_used != null) ? Number(cb.bereavement_days_used) : (bereavHrs / 8);

  const bHrsStr = bereavHrs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bDaysStr = bereavDays.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bAmtStr = "$" + bereavAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (bereavEl) {
    bereavEl.innerHTML = `
        <div style="font-size:0.75rem; text-transform:uppercase; color:#666; font-weight:bold; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;">Bereavement Pay</div>
        <div style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; width:100%;">
          <div style="flex:1; text-align:center; border-right:1px solid #ccc; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Hours Used</div>
            <div style="font-weight:bold; font-size:1.4rem;">${bHrsStr}</div>
            ${maxBereav > 0 ? `<div style="font-size:0.7rem; color:#888;">Max: ${maxBereav.toFixed(2)}</div>` : ''}
          </div>
          <div style="flex:1; text-align:center; border-right:1px solid #ccc; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Days Used</div>
            <div style="font-weight:bold; font-size:1.4rem;">${bDaysStr}</div>
          </div>
          <div style="flex:1; text-align:center; padding:0 8px;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:#666; margin-bottom:4px;">Amount Paid</div>
            <div style="font-weight:bold; font-size:1.4rem;">${bAmtStr}</div>
          </div>
        </div>
     `;

    const bCard = bereavEl.closest(".balanceCard");
    if (bCard) {
      bCard.classList.remove("positive", "negative", "zero", "max-warning");
      if (maxBereav > 0 && bereavHrs >= maxBereav) {
        bCard.classList.add("max-warning");
      } else {
        bCard.classList.add("zero");
      }
    }
  }
}

async function loadAllEmployeeWarnings(hotel) {
  const side = document.getElementById("warningSidebar"); // Fixed ID
  const list = document.getElementById("warningList");
  if (!side || !list) return;

  if (!hotel) {
    side.style.display = "block";
    list.innerHTML = `<div style="color:#666; font-style:italic;">Select a hotel to view notifications.</div>`;
    return;
  }

  // Fetch Summary & Settings (Use V2 for live sync data)
  const [repData, settData] = await Promise.all([
    apiGet(`/api/reports/summary-v2?hotel=${encodeURIComponent(hotel)}`),
    apiGet(`/api/settings/types?hotel=${encodeURIComponent(hotel)}`)
  ]);

  if (!repData.ok) {
    list.innerHTML = `<div style="color:red;">Error loading data.</div>`;
    return;
  }

  // Parse Settings
  let maxSick = 0;
  let maxBereav = 0;
  if (settData.ok && settData.rows) {
    const fs = (n) => settData.rows.find(r => r.name.toLowerCase() === n.toLowerCase());
    const s = fs("Sick");
    const b = fs("Bereavement");
    if (s && s.max_allowed) maxSick = Number(s.max_allowed);
    if (b && b.max_allowed) maxBereav = Number(b.max_allowed);
  }

  // Collect warnings
  const warnings = [];
  const rows = repData.rows || [];

  for (const r of rows) {
    const emp = r.employee;
    const sickHrs = Number(r.sick_hours || 0);
    const berHrs = Number(r.bereavement_hours || 0);

    // Check Sick
    if (maxSick > 0 && sickHrs >= maxSick) {
      const isOver = sickHrs > maxSick;
      const days = (sickHrs / 8).toFixed(1).replace(".0", "");
      warnings.push({
        emp,
        type: 'Sick',
        msg: isOver ? `OVER MAX used (${days} days)` : `MAX used (${days} days)`,
        sortName: emp.toLowerCase(),
        excess: sickHrs - maxSick,
        isOver
      });
    }

    // Check Bereavement
    if (maxBereav > 0 && berHrs >= maxBereav) {
      const isOver = berHrs > maxBereav;
      const days = (berHrs / 8).toFixed(1).replace(".0", "");
      warnings.push({
        emp,
        type: 'Bereavement',
        msg: isOver ? `OVER MAX used (${days} days)` : `MAX used (${days} days)`,
        sortName: emp.toLowerCase(),
        excess: berHrs - maxBereav,
        isOver
      });
    }
  }

  // Sort by Excess Descending, then Name
  warnings.sort((a, b) => {
    // Primary: Excess (Highest first)
    const diff = b.excess - a.excess;
    if (Math.abs(diff) > 0.01) return diff;
    // Secondary: Name
    return a.sortName.localeCompare(b.sortName);
  });

  side.style.display = "block";

  if (warnings.length > 0) {
    list.innerHTML = warnings.map(w => `
      <div class="listRow" style="padding:8px 10px;">
        <div style="flex:1;">
           <div><span style="font-weight:600;">${esc(w.emp)}</span> <span class="badge ${w.type === 'Sick' ? 'badge-yellow' : 'badge-blue'}" style="margin-left:6px;font-size:0.75em;padding:2px 6px;">${w.type}</span></div>
           <div class="${w.isOver ? 'flash-severe' : 'flash-warning'}" style="margin-top:4px; font-size:0.9em; font-weight:500; padding:2px 4px; display:inline-block;">${esc(w.msg)}</div>
        </div>
      </div>
    `).join("");
  } else {
    list.innerHTML = `<div style="color:#666;">No notifications found for this hotel.</div>`;
  }

}

tab2Hotel.addEventListener("change", () => {
  const hotel = tab2Hotel.value;
  loadEmployeesForHotel(hotel);
  loadAllEmployeeWarnings(hotel);
});

tab2Employee.addEventListener("change", () => {
  const hotel = tab2Hotel.value;
  const employee = tab2Employee.value;
  if (!hotel || !employee) return;
  loadEmployeeDetails(hotel, employee);
});


/** Settings + Input Entry (v1.1) */
async function loadSettingsAll() {
  const status = document.getElementById("settingsStatus");
  if (status) status.textContent = "";

  const data = await apiGet("/api/settings/all");
  if (!data.ok) {
    if (status) status.textContent = data.error || "Failed to load settings.";
    return null;
  }
  return data;
}

function fillSelect(selectEl, values, placeholder) {
  if (!selectEl) return;
  const current = selectEl.value;
  selectEl.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder || "Select...";
  selectEl.appendChild(opt0);

  (values || []).forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    selectEl.appendChild(o);
  });

  // restore if possible
  if (current && (values || []).includes(current)) selectEl.value = current;
}

function renderList(containerId, values, kind) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!values || values.length === 0) {
    el.innerHTML = '<div class="muted" style="padding:10px 12px;">No items yet.</div>';
    return;
  }

  el.innerHTML = values.map(v => `
    <div class="listRow">
      <div class="name mono">${esc(v)}</div>
      <button class="btn smallBtn" data-edit="${esc(v)}" data-kind="${kind}">Edit</button>
      <button class="btnDangerSmall smallBtn" data-del="${esc(v)}" data-kind="${kind}">Delete</button>
    </div>
  `).join("");

  el.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-del");
      const k = btn.getAttribute("data-kind");
      if (!confirm(`Delete "${value}"?\n\nIf this was used before, the system will block the deletion.`)) return;
      const r = await fetch(`/api/settings/${encodeURIComponent(k)}/${encodeURIComponent(value)}`, { method: "DELETE" });
      const out = await r.json().catch(() => ({ ok: false, error: "Delete failed." }));
      const status = document.getElementById("settingsStatus");
      if (!out.ok) {
        if (status) status.textContent = out.warning || out.error || "Delete blocked.";
      } else {
        if (status) status.textContent = "Deleted.";
      }
      await refreshSettingsUI();
    });
  });

  el.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const oldValue = btn.getAttribute("data-edit");
      const k = btn.getAttribute("data-kind");
      const newValue = prompt(`Rename "${oldValue}" to:`, oldValue);
      if (!newValue) return;
      if (newValue.trim() === oldValue.trim()) return;

      const r = await fetch(`/api/settings/${encodeURIComponent(k)}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldValue, newValue })
      });
      const out = await r.json().catch(() => ({ ok: false, error: "Rename failed." }));
      const status = document.getElementById("settingsStatus");
      if (!out.ok) {
        if (status) status.textContent = out.warning || out.error || "Rename blocked.";
      } else {
        if (status) status.textContent = "Renamed.";
      }
      await refreshSettingsUI();
    });
  });
}

async function refreshSettingsUI() {
  const data = await loadSettingsAll();
  if (!data) return;

  // Fill hotel selects across pages
  fillSelect(document.getElementById("hotelSelect"), data.hotels, "Select hotel...");
  fillSelect(document.getElementById("tab2Hotel"), data.hotels, "Select hotel...");
  fillSelect(document.getElementById("entryHotel"), data.hotels, "Select hotel...");
  fillSelect(document.getElementById("settingsOpeningHotel"), data.hotels, "Select hotel...");

  // Types Hotel Selector - Preserve Value
  const typeHotelSel = document.getElementById("settingsTypesHotel");
  const currentTypeHotel = typeHotelSel ? typeHotelSel.value : "";
  fillSelect(typeHotelSel, data.hotels, "Select hotel...");
  if (typeHotelSel && currentTypeHotel) typeHotelSel.value = currentTypeHotel;

  // Entry dropdowns
  fillSelect(document.getElementById("entryYear"), (data.years || []).map(y => String(y)), "Select year...");

  // Fetch Types Filtered by Selected Hotel
  const selectedHotel = typeHotelSel ? typeHotelSel.value : "";
  let typesList = []; // Default empty if no hotel selected
  if (selectedHotel) {
    const tRes = await apiGet(`/api/settings/types?hotel=${encodeURIComponent(selectedHotel)}`);
    if (tRes.ok) typesList = tRes.rows || [];
  }

  // Legacy global types for Entry? 
  // Ideally Entry should also filter by chosen hotel, but entryHotel change listener handles loading Employees.
  // entryType is filled from data.types (names only).
  // If we want detailed validation, we need full objects.
  // For now, allow selection of any Type name known globally (data.types)
  fillSelect(document.getElementById("entryType"), (data.types || []), "Select type...");

  // Lists
  renderList("hotelsList", data.hotels, "hotels");
  renderList("yearsList", (data.years || []).map(y => String(y)), "years");
  renderTypeList(typesList); // Render filtered list
  renderVacOptionsList(data.vacation_options || []);
}

// Add buttons for settings
function wireSettingsButtons() {
  const addHotelBtn = document.getElementById("addHotelBtn");
  const addYearBtn = document.getElementById("addYearBtn");
  const addTypeBtn = document.getElementById("addTypeBtn");
  const addVacBtn = document.getElementById("addVacBtn");

  if (addHotelBtn) addHotelBtn.addEventListener("click", async () => {
    const v = (document.getElementById("newHotel")?.value || "").trim();
    if (!v) return;
    await fetch(`/api/settings/hotels`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: v }) });
    document.getElementById("newHotel").value = "";
    await refreshSettingsUI();
  });

  if (addYearBtn) addYearBtn.addEventListener("click", async () => {
    const v = (document.getElementById("newYear")?.value || "").trim();
    if (!v) return;
    await fetch(`/api/settings/years`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: v }) });
    document.getElementById("newYear").value = "";
    await refreshSettingsUI();
  });

  if (addTypeBtn) addTypeBtn.addEventListener("click", async () => {
    const v = (document.getElementById("newType")?.value || "").trim();
    const hotel = (document.getElementById("settingsTypesHotel")?.value || "").trim();
    const maxStr = (document.getElementById("newTypeMax")?.value || "").trim();
    const minStr = (document.getElementById("newTypeMin")?.value || "").trim();

    if (!v) return;
    if (!hotel) { alert("Please select a hotel first."); return; }

    const max_allowed = maxStr ? Number(maxStr) : null;
    const min_allowed = minStr ? Number(minStr) : null;

    await fetch(`/api/settings/types/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: v, hotel, min_allowed, max_allowed })
    });

    document.getElementById("newType").value = "";
    if (document.getElementById("newTypeMax")) document.getElementById("newTypeMax").value = "";
    if (document.getElementById("newTypeMin")) document.getElementById("newTypeMin").value = "";
    await refreshSettingsUI();
  });

  const settingsTypesHotel = document.getElementById("settingsTypesHotel");
  if (settingsTypesHotel) {
    settingsTypesHotel.addEventListener("change", () => refreshSettingsUI());
  }
}

// Input Entry logic
async function wireEntryPage() {
  const entryHotel = document.getElementById("entryHotel");
  const entryEmployee = document.getElementById("entryEmployee");
  const entryHint = document.getElementById("entryHint");
  const saveBtn = document.getElementById("saveEntryBtn");
  const status = document.getElementById("entryStatus");

  if (entryHotel) entryHotel.addEventListener("change", async () => {
    const hotel = entryHotel.value;
    if (!hotel) {
      entryEmployee.innerHTML = '<option value="">Select employee...</option>';
      entryEmployee.disabled = true;
      document.getElementById("entryType").innerHTML = '<option value="">Select type...</option>';
      if (entryHint) entryHint.textContent = "Select a hotel to load employees.";
      document.querySelector("#entryHistoryTable tbody").innerHTML = '<tr><td colspan="5" class="muted">Select an employee to view history.</td></tr>';
      return;
    }

    if (entryHint) entryHint.textContent = "Loading employees & types...";
    entryEmployee.disabled = true;

    // Load Types for this hotel
    const tRes = await apiGet(`/api/settings/types?hotel=${encodeURIComponent(hotel)}`);
    const types = tRes.ok ? tRes.rows : [];
    fillSelect(document.getElementById("entryType"), types.map(t => t.name), "Select type...");

    // Load Employees
    const data = await apiGet(`/api/employees?hotel=${encodeURIComponent(hotel)}`);
    if (!data.ok) {
      if (entryHint) entryHint.textContent = `Error: ${data.error}`;
      return;
    }
    entryEmployee.innerHTML = '<option value="">Select employee...</option>';
    fillEmployeesSelect(entryEmployee, data.employees || []);
    entryEmployee.disabled = false;
    if (entryHint) entryHint.textContent = "Select an employee.";
  });

  if (entryEmployee) entryEmployee.addEventListener("change", () => {
    const hotel = entryHotel.value;
    const emp = entryEmployee.value;
    if (hotel && emp) loadEntryHistory(hotel, emp);
  });

  // Trigger warnings when hotel picked in Entry tab too?
  if (entryHotel) entryHotel.addEventListener("change", () => {
    const hotel = entryHotel.value;
    // Don't duplicate if already loaded by tab logic, but better safe.
    // However, warnings container is usually in sidebar?
    // User says "notifications should be based on the hotel chosen".
    // If user is on Tab 3 (Input), they verify warnings there.
    if (hotel) loadAllEmployeeWarnings(hotel);
  });

  if (saveBtn) saveBtn.addEventListener("click", async () => {
    if (status) status.textContent = "";
    const hotel = document.getElementById("entryHotel")?.value || "";
    const employee = document.getElementById("entryEmployee")?.value || "";
    const year = String(new Date().getFullYear());
    const type = document.getElementById("entryType")?.value || "";
    const hours = document.getElementById("entryHours")?.value || "";
    const note = document.getElementById("entryNote")?.value || "";
    const from_date = document.getElementById("entryFrom")?.value || "";
    const to_date = document.getElementById("entryTo")?.value || "";
    const days = document.getElementById("entryDays")?.value || "";

    if (!hotel || !employee || !type) {
      if (status) status.textContent = "Hotel, employee, year, and type are required.";
      return;
    }

    const payload = {
      hotel, employee, year: Number(year), type, hours: hours ? Number(hours) : null, note: note || null,
      from_date: from_date || null,
      to_date: to_date || null,
      days: days ? Number(days) : null
    };
    const r = await fetch("/api/manual-entry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const out = await r.json().catch(() => ({ ok: false, error: "Save failed." }));
    if (!out.ok) {
      if (status) status.textContent = out.error || "Save failed.";
      return;
    }
    if (status) status.textContent = "Saved.";
    document.getElementById("entryHours").value = "";
    document.getElementById("entryNote").value = "";
    if (document.getElementById("entryFrom")) document.getElementById("entryFrom").value = "";
    if (document.getElementById("entryTo")) document.getElementById("entryTo").value = "";
    if (document.getElementById("entryDays")) document.getElementById("entryDays").value = "";
    if (document.getElementById("entryIncludeWeekends")) document.getElementById("entryIncludeWeekends").checked = false;

    // Refresh History
    await loadEntryHistory(hotel, employee);
  });
}

async function loadEntryHistory(hotel, employee) {
  const tbody = document.querySelector("#entryHistoryTable tbody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="muted">Loading...</td></tr>';

  try {
    // Added _t to bust cache
    const res = await apiGet(`/api/employee-details?hotel=${encodeURIComponent(hotel)}&employee=${encodeURIComponent(employee)}&_t=${Date.now()}`);
    if (!res.ok) throw new Error(res.error || "Failed");

    // Filter for Manual entries
    const history = (res.history || []).filter(h => h.source === 'Manual');

    if (history.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="muted">No manual entries found.</td></tr>';
      return;
    }

    const isAdmin = (currentUser && (currentUser.role === 'admin' || currentUser.isAdmin));
    tbody.innerHTML = renderManualEntryRows(history, isAdmin);

    // Init Resizing (safe due to idempotency)
    enableColumnResizing('entryHistoryTable');

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="error">${e.message}</td></tr>`;
  }
}

// Global scope for onclick
window.deleteEntry = async (id) => {
  if (!confirm("Delete this entry?")) return;
  const r = await apiDelete(`/api/manual-entry/${id}`);
  if (r.ok) {
    // Reload history (trick: trigger change or re-call)
    const hotel = document.getElementById("entryHotel").value;
    const emp = document.getElementById("entryEmployee").value;
    if (hotel && emp) loadEntryHistory(hotel, emp);
  } else {
    alert("Error: " + r.error);
  }
};

window.editEntry = async (id) => {
  const newDays = prompt("Update Days:", "");
  if (newDays === null) return;
  const n = Number(newDays);
  if (isNaN(n)) { alert("Invalid Number"); return; }

  const r = await apiPut(`/api/manual-entry/${id}`, { days: n });
  if (r.ok) {
    const hotel = document.getElementById("entryHotel").value;
    const emp = document.getElementById("entryEmployee").value;
    if (hotel && emp) loadEntryHistory(hotel, emp);
  } else {
    alert("Error: " + r.error);
  }
};

wireSettingsButtons();
wireEntryPage();
refreshSettingsUI();

function formatCurrency(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  const num = Number(n);
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (num < 0 ? "-$" : "$") + formatted;
}

function fillEmployeesSelect(selectEl, employees) {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">Select employee...</option>';

  if (!employees || employees.length === 0) return;

  const active = [];
  const inactive = [];

  // Sort helper
  const sorter = (a, b) => {
    const A = String(a || "").trim().toUpperCase();
    const B = String(b || "").trim().toUpperCase();
    if (A === "TOTAL" && B !== "TOTAL") return 1;
    if (A !== "TOTAL" && B === "TOTAL") return -1;
    return A.localeCompare(B);
  };

  for (const emp of employees) {
    const name = typeof emp === "string" ? emp : emp.name;
    const isActive = typeof emp === "string" ? true : emp.isActive;

    if (isActive) active.push(name);
    else inactive.push(name);
  }

  active.sort(sorter);
  inactive.sort(sorter);

  if (active.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = "Active Employees";
    active.forEach(name => {
      const o = document.createElement("option");
      o.value = name;
      o.textContent = name;
      if (String(name).trim().toUpperCase() === "TOTAL") o.style.fontWeight = "900";
      grp.appendChild(o);
    });
    selectEl.appendChild(grp);
  }

  if (inactive.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = "Inactive Employees";
    inactive.forEach(name => {
      const o = document.createElement("option");
      o.value = name;
      o.textContent = name;
      grp.appendChild(o);
    });
    selectEl.appendChild(grp);
  }
}

function renderTypeList(types) {
  const el = document.getElementById("typesList");
  if (!el) return;
  if (!types || types.length === 0) {
    el.innerHTML = '<div class="muted" style="padding:10px 12px;">No items yet.</div>';
    return;
  }
  el.innerHTML = types.map(t => `
    <div class="listRow">
      <div class="name mono">${esc(t.name)}</div>
      <div class="mono" style="opacity:.8;font-size:0.85em;">
         ${t.min_allowed != null ? "min: " + esc(String(t.min_allowed)) : ""}
         ${t.max_allowed != null ? (t.min_allowed != null ? ", " : "") + "max: " + esc(String(t.max_allowed)) : ""}
         ${t.min_allowed == null && t.max_allowed == null ? "—" : ""}
      </div>
      <button class="btn smallBtn" data-tedit="${esc(t.name)}">Edit</button>
      <button class="btnDangerSmall smallBtn" data-tdel="${esc(t.name)}">Delete</button>
    </div>
  `).join("");

  el.querySelectorAll("[data-tdel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const name = btn.getAttribute("data-tdel");
      const hotel = document.getElementById("settingsTypesHotel")?.value || "";
      if (!hotel) { alert("Hotel context missing."); return; }

      if (!confirm(`Delete type "${name}" from ${hotel}?\n\nIf used, delete will be blocked.`)) return;

      const r = await apiDelete(`/api/settings/types/${encodeURIComponent(name)}?hotel=${encodeURIComponent(hotel)}`);
      const status = document.getElementById("settingsStatus");
      if (!r.ok) status.textContent = r.warning || r.error || "Delete blocked.";
      else status.textContent = "Deleted.";
      await refreshSettingsUI();
    });
  });

  el.querySelectorAll("[data-tedit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const name = btn.getAttribute("data-tedit");
      const hotel = document.getElementById("settingsTypesHotel")?.value || "";
      if (!hotel) { alert("Hotel context missing."); return; }

      const item = (types || []).find(x => x.name === name); // find item to get current values

      const newName = prompt(`Rename type "${name}" to:`, name);
      if (newName == null) return;

      const currentMin = item ? item.min_allowed : "";
      const currentMax = item ? item.max_allowed : "";

      const minStr = prompt(`Set MIN allowed for "${newName}" (blank = no min):`, currentMin != null ? currentMin : "");
      if (minStr == null) return; // Cancel check

      const maxStr = prompt(`Set MAX allowed for "${newName}" (blank = no max):`, currentMax != null ? currentMax : "");
      if (maxStr == null) return; // Cancel check

      // rename (blocked if used)
      if (newName.trim() !== name.trim()) {
        const rr = await apiPost(`/api/settings/types/rename`, { oldValue: name, newValue: newName.trim(), hotel });
        const status = document.getElementById("settingsStatus");
        if (!rr.ok) { status.textContent = rr.warning || rr.error || "Rename blocked."; return; }
      }
      // update limits
      const min_allowed = minStr && minStr.trim() !== "" ? Number(minStr) : null;
      const max_allowed = maxStr && maxStr.trim() !== "" ? Number(maxStr) : null;

      await apiPost(`/api/settings/types/update`, { name: newName.trim(), hotel, min_allowed, max_allowed });
      document.getElementById("settingsStatus").textContent = "Updated.";
      await refreshSettingsUI();
    });
  });
}

function renderVacOptionsList(list) {
  const el = document.getElementById("vacList");
  if (!el) return;
  if (!list || list.length === 0) {
    el.innerHTML = '<div class="muted" style="padding:10px 12px;">No items yet.</div>';
    return;
  }
  el.innerHTML = list.map(v => `
    <div class="listRow">
      <div class="name mono">${esc(v.label)}</div>
      <div class="mono" style="opacity:.8;">max: ${esc(String(v.max_allowed))}</div>
      <button class="btn smallBtn" data-vedit="${v.id}">Edit</button>
      <button class="btnDangerSmall smallBtn" data-vdel="${v.id}">Delete</button>
    </div>
  `).join("");

  el.querySelectorAll("[data-vdel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-vdel");
      if (!confirm("Delete this vacation option?\n\nIf assigned to an employee, deletion will be blocked.")) return;
      const r = await apiDelete(`/api/settings/vacation_options/${encodeURIComponent(id)}`);
      const status = document.getElementById("settingsStatus");
      if (!r.ok) status.textContent = r.warning || r.error || "Delete blocked.";
      else status.textContent = "Deleted.";
      await refreshSettingsUI();
    });
  });

  el.querySelectorAll("[data-vedit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-vedit"));
      const item = (list || []).find(x => Number(x.id) === id);
      if (!item) return;
      const newLabel = prompt("Label:", item.label);
      if (newLabel == null) return;
      const newMax = prompt("Max allowed (number):", String(item.max_allowed));
      if (newMax == null) return;
      const max_allowed = Number(newMax);
      const r = await apiPost(`/api/settings/vacation_options/update`, { id, label: newLabel.trim(), max_allowed });
      const status = document.getElementById("settingsStatus");
      if (!r.ok) status.textContent = r.warning || r.error || "Update failed.";
      else status.textContent = "Updated.";
      await refreshSettingsUI();
    });
  });
}

async function apiPost(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  return r.json().catch(() => ({ ok: false, error: "Request failed." }));
}
async function apiDelete(url) {
  const r = await fetch(url, { method: "DELETE" });
  return r.json().catch(() => ({ ok: false, error: "Request failed." }));
}

function wireDaysCalc() {
  const f = document.getElementById("entryFrom");
  const t = document.getElementById("entryTo");
  const d = document.getElementById("entryDays");
  const incWeekend = document.getElementById("entryIncludeWeekends"); // New Checkbox

  if (!f || !t || !d) return;

  function recompute() {
    if (!f.value || !t.value) return;
    const start = new Date(f.value + "T00:00:00");
    const end = new Date(t.value + "T00:00:00");

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (end < start) return;

    let count = 0;
    let curr = new Date(start);

    while (curr <= end) {
      const day = curr.getDay();
      const isWeekend = (day === 0 || day === 6);
      if (incWeekend && incWeekend.checked) {
        count++;
      } else {
        if (!isWeekend) count++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    d.value = String(count);
  }

  f.addEventListener("change", recompute);
  t.addEventListener("change", recompute);
  if (incWeekend) incWeekend.addEventListener("change", recompute);
}
wireDaysCalc();

let globalReportData = []; // Store for export

async function wireReports() {
  const hotelSel = document.getElementById("reportsHotel");
  const runBtn = document.getElementById("reportsRunBtn");
  const refreshBtn = document.getElementById("reportsRefreshBtn");
  const status = document.getElementById("reportsStatus");
  const tbody = document.querySelector("#reportsTable tbody");

  // Export Btns
  const btnXls = document.getElementById("exportXlsBtn");
  const btnCsv = document.getElementById("exportCsvBtn");
  const btnPdf = document.getElementById("exportPdfBtn");

  if (!hotelSel || !runBtn || !tbody) return;

  async function loadInitData() {
    // Load Hotels
    const settings = await apiGet("/api/settings/all");
    if (settings.ok) {
      hotelSel.innerHTML = '<option value="">Select hotel...</option>' +
        (settings.hotels || []).map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join("");
    }

    // Load Years
    const years = await apiGet("/api/settings/years");
    if (years.ok) {
      const yearSel = document.getElementById("reportsYear");
      if (yearSel) {
        yearSel.innerHTML = '<option value="">All</option>' +
          (years.years || []).map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
      }
    }
  }

  // Initial Load
  loadInitData();

  function renderRows(rows, type) {
    globalReportData = rows;

    const thead = document.querySelector("#reportsTable thead");
    if (thead) {
      if (type === 'details') {
        // Report 2: Complete Details
        thead.innerHTML = `<tr>
           <th>Employee</th>
           <th>Title</th>
           <th>Email</th>
           <th>Phone</th>
           <th>Address</th>
           <th>Hired</th>
           <th>Active</th>
         </tr>`;
      } else {
        // Report 1: Vac/Sick/Brev
        thead.innerHTML = `<tr>
           <th>Employee</th>
           <th>Title</th>
           <th class="num">Vac Pay<br>Available ($)</th>
           <th class="num">Vac Pay<br>Used ($)</th>
           <th class="num">Vac Days<br>Input</th>
           <th class="num">Sick Hrs<br>Used</th>
           <th class="num">Sick Days<br>Used</th>
           <th class="num">Sick Amt<br>Paid ($)</th>
           <th class="num">Ber Hrs<br>Used</th>
           <th class="num">Ber Days<br>Used</th>
           <th class="num">Ber Amt<br>Paid ($)</th>
           <th>Notifications</th>
         </tr>`;
      }
    }

    tbody.innerHTML = "";
    (rows || []).forEach(r => {
      const tr = document.createElement("tr");

      const fmt = (n) => (n == null || n === "" || Number.isNaN(Number(n))) ? "0.00" : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtAmt = (n) => (n == null || n === "" || Number.isNaN(Number(n))) ? "$0.00" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      if (type === 'details') {
        tr.innerHTML = `
          <td>${esc(r.employee_key)}</td>
          <td>${esc(r.job_title)}</td>
          <td>${esc(r.email)}</td>
          <td>${esc(r.phone)}</td>
          <td>${esc(r.address)}</td>
          <td>${esc(fmtDate(r.hired_date))}</td>
          <td>${r.is_active ? "Yes" : "No"}</td>
        `;
      } else {
        tr.innerHTML = `
          <td><strong>${esc(r.employee)}</strong></td>
          <td>${esc(r.job_title)}</td>
          <td class="num">${fmtAmt(r.vac_available_amt)}</td>
          <td class="num">${fmtAmt(r.vac_pay_used)}</td>
          <td class="num">${fmt(r.vac_days_input)}</td>
          
          <td class="num">${fmt(r.sick_hrs_used)}</td>
          <td class="num">${fmt(r.sick_days_used)}</td>
          <td class="num">${fmtAmt(r.sick_amt_paid)}</td>
          
          <td class="num">${fmt(r.ber_hrs_used)}</td>
          <td class="num">${fmt(r.ber_days_used)}</td>
          <td class="num">${fmtAmt(r.ber_amt_paid)}</td>
          
          <td class="error" style="font-size:11px;">${esc(r.notifications)}</td>
        `;
      }
      tbody.appendChild(tr);
    });

    // Handle Admin Export Buttons
    const isAdm = (currentUser && currentUser.role === 'admin');
    const disp = isAdm ? 'inline-block' : 'none';
    if (btnXls) btnXls.style.display = disp;
    if (btnCsv) btnCsv.style.display = disp;
    if (btnPdf) btnPdf.style.display = disp;
  }

  async function run() {
    const hotel = hotelSel.value || "";
    const type = document.getElementById("reportsType").value;
    const year = document.getElementById("reportsYear").value;

    if (!hotel) { if (status) status.textContent = "Select a hotel."; return; }
    if (status) status.textContent = "Running...";

    // Pass type and year
    const qs = `?hotel=${encodeURIComponent(hotel)}&type=${encodeURIComponent(type)}` + (year ? `&year=${year}` : ``);

    const data = await apiGet(`/api/reports/data${qs}`);
    if (!data.ok) { if (status) status.textContent = data.error || "Report failed."; return; }

    renderRows(data.rows || [], type);
    if (status) status.textContent = "";
  }

  async function doExport(format) {
    if (!globalReportData || globalReportData.length === 0) {
      alert("No data to export. Run the report first.");
      return;
    }

    const hotel = hotelSel.value || "Report";
    const type = document.getElementById("reportsType").value;
    const title = `Report_${type}_${hotel.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}`;

    let columns = [];
    if (type === 'details') {
      columns = ["employee_key", "job_title", "email", "phone", "address", "hired_date", "is_active"];
    } else {
      columns = ["employee", "job_title", "vac_available_amt", "vac_pay_used", "vac_days_input", "sick_hrs_used", "sick_days_used", "sick_amt_paid", "ber_hrs_used", "ber_days_used", "ber_amt_paid", "notifications"];
    }

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: globalReportData, columns, format, title })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title}.${format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const j = await res.json();
        alert("Export failed: " + (j.message || "Unknown error"));
      }
    } catch (e) {
      alert("Export error: " + e.message);
    }
  }

  runBtn.addEventListener("click", run);
  if (refreshBtn) refreshBtn.addEventListener("click", run);

  if (btnXls) btnXls.addEventListener("click", () => doExport('xlsx'));
  if (btnCsv) btnCsv.addEventListener("click", () => doExport('csv'));
  if (btnPdf) btnPdf.addEventListener("click", () => doExport('pdf'));

  await loadHotels();
}

// Global: Edit Opening Balance
// Global: Edit Opening Balance (Modal Version)
let currentEditId = null;

function editOpeningBalance(empId, vacAmt, vacHrs, sickAmt, sickHrs, vacAllowed) {
  currentEditId = empId;

  // Populate fields
  document.getElementById("editVacAmt").value = vacAmt || "";
  document.getElementById("editVacHrs").value = vacHrs || "";
  document.getElementById("editVacAllowed").value = vacAllowed || "";
  document.getElementById("editSickAmt").value = sickAmt || "";
  document.getElementById("editSickHrs").value = sickHrs || "";

  // Show Modal
  document.getElementById("editModalOverlay").classList.add("active");
}

function wireEditModal() {
  const overlay = document.getElementById("editModalOverlay");
  const closeBtn = document.getElementById("modalCloseBtn");
  const cancelBtn = document.getElementById("modalCancelBtn");
  const saveBtn = document.getElementById("modalSaveBtn");

  if (!overlay) return;

  function closeModal() {
    overlay.classList.remove("active");
    currentEditId = null;
  }

  // Prevent clicks inside the modal from closing it
  const modalBox = overlay.querySelector(".modalBox");
  if (modalBox) {
    modalBox.addEventListener("click", (e) => e.stopPropagation());
  }

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", async () => {
    if (!currentEditId) return;

    const payload = {
      vacAmount: document.getElementById("editVacAmt").value,
      vacHours: document.getElementById("editVacHrs").value,
      vacDaysAllowed: document.getElementById("editVacAllowed").value,
      sickAmount: document.getElementById("editSickAmt").value,
      sickHours: document.getElementById("editSickHrs").value
    };

    try {
      const r = await fetch(`/api/employees/${currentEditId}/opening-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await r.json();

      if (!json.ok) {
        alert("Error saving: " + (json.error || "Unknown error"));
        return;
      }

      // Success
      closeModal();

      // Refresh Table
      const hotelSel = document.getElementById("settingsOpeningHotel");
      if (hotelSel && hotelSel.value) {
        loadOpeningBalances(hotelSel.value);
      }

    } catch (e) {
      alert("Request failed: " + e.message);
    }
  });

  // Close on outside click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}

wireEditModal();

wireReports();

// Opening Balances Manager
async function loadOpeningBalances(hotel) {
  const tbody = document.querySelector("#openingBalancesTable tbody");
  if (!tbody) return;

  if (!hotel) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted">Select a hotel.</td></tr>`;
    return;
  }

  tbody.innerHTML = `<tr><td colspan="6" class="muted">Loading...</td></tr>`;

  const res = await apiGet(`/api/settings/opening-balances?hotel=${encodeURIComponent(hotel)}`);
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="6" class="error">Error: ${esc(res.error)}</td></tr>`;
    return;
  }

  const rows = res.rows || [];
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">No employees found.</td></tr>`;
    return;
  }

  const formatCurrency = (n) => (n == null || n === "" || Number.isNaN(Number(n))) ? "—" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const active = [];
  const inactive = [];

  for (const r of rows) {
    if (r.isActive) active.push(r);
    else inactive.push(r);
  }

  const renderRow = (row) => {
    const vacAmt = (row.opening_vac_amount != null) ? row.opening_vac_amount : "";
    const vacHrs = (row.opening_vac_hours != null) ? row.opening_vac_hours : "";
    const vacDaysAllowed = (row.vacation_days_allowed != null) ? row.vacation_days_allowed : "";
    const sickAmt = (row.opening_sick_amount != null) ? row.opening_sick_amount : "";
    const sickHrs = (row.opening_sick_hours != null) ? row.opening_sick_hours : "";

    const isActive = row.isActive;
    const rowClass = isActive ? "" : "muted";
    const inactiveLabel = isActive ? "" : ' <span class="badge" style="background:#eee;color:#888;">Inactive</span>';

    return `
        <tr>
          <td class="${rowClass}">
            <strong>${esc(row.employee_key)}</strong>${inactiveLabel}
          </td>
          <td class="num ${rowClass}">${formatCurrency(vacAmt)}</td>
          <td class="num ${rowClass}">${esc(Number(vacHrs || 0).toFixed(2))}</td>
          <td class="num ${rowClass}">${esc(Number(vacDaysAllowed || 0).toFixed(2))}</td>
          <td class="num ${rowClass}">${formatCurrency(sickAmt)}</td>
          <td class="num ${rowClass}">${esc(Number(sickHrs || 0).toFixed(2))}</td>
          <td>
             <button class="btn smallBtn" onclick="editOpeningBalance(${row.id}, '${vacAmt}', '${vacHrs}', '${sickAmt}', '${sickHrs}', '${vacDaysAllowed}')">Edit</button>
          </td>
        </tr>
      `;
  };

  let html = "";

  if (active.length > 0) {
    html += `<tr style="background:#eee; font-weight:bold;"><td colspan="7">Active Employees</td></tr>`;
    html += active.map(renderRow).join("");
  }

  if (inactive.length > 0) {
    html += `<tr style="background:#eee; font-weight:bold;"><td colspan="7">Inactive Employees</td></tr>`;
    html += inactive.map(renderRow).join("");
  }

  tbody.innerHTML = html;
}


function wireOpeningBalances() {
  const sel = document.getElementById("settingsOpeningHotel");
  if (sel) {
    sel.addEventListener("change", () => {
      loadOpeningBalances(sel.value);
      loadAllEmployeeWarnings(sel.value);
    });
  }
}

wireOpeningBalances();

// Helper to get hotels list
async function loadHotels() {
  const settings = await apiGet("/api/settings/all");
  return settings.ok ? (settings.hotels || []) : [];
}

// QB Sync Logic
function wireQBSync() {
  const btnConnect = document.getElementById("qbConnectBtn");
  const btnSync = document.getElementById("qbSyncBtn");
  const output = document.getElementById("qbOutput");
  const status = document.getElementById("qbStatus");
  const importHotel = document.getElementById("importHotel");

  if (!btnConnect || !btnSync) return;

  // Sync History Logic
  const historyTbody = document.querySelector("#syncHistoryTable tbody");
  const historyBtn = document.getElementById("refreshSyncHistoryBtn");

  async function loadSyncHistory() {
    if (!historyTbody) return;
    historyTbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    const r = await apiGet("/api/sync-history");
    if (r.ok && r.rows) {
      if (r.rows.length === 0) {
        historyTbody.innerHTML = '<tr><td colspan="5" class="muted">No history found.</td></tr>';
        return;
      }
      historyTbody.innerHTML = r.rows.map(row => `
        <tr>
          <td>${new Date(row.created_at).toLocaleString()}</td>
          <td>${esc(row.username)}</td>
          <td>${esc(row.status)}</td>
             <td>${esc(row.hotel)}</td>
          <td>${esc(row.details)}</td>
        </tr>
      `).join("");
    } else {
      historyTbody.innerHTML = '<tr><td colspan="5" class="error">Failed to load history.</td></tr>';
    }
  }

  if (historyBtn) historyBtn.addEventListener("click", loadSyncHistory);
  loadSyncHistory(); // Load on init

  // Populate Hotel Dropdown
  if (importHotel) {
    loadHotels().then(hotels => {
      importHotel.innerHTML = `<option value="">Select a hotel...</option>` +
        hotels.map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join("");

      // Auto-select based on localStorage or previous?
      // For now, default to global or first?
      // Let's match typical default behavior if needed.
    });

    // Trigger Warnings when Hotel is selected on Import Page
    importHotel.addEventListener("change", () => {
      loadAllEmployeeWarnings(importHotel.value);
    });
  }

  async function showOutput(txt) {
    output.style.display = "block";
    output.textContent = txt;
  }

  btnConnect.addEventListener("click", async () => {
    status.textContent = "Connecting...";
    output.style.display = "none";
    try {
      const data = await apiGet("/api/qb/test");
      if (data.status === "ok") {
        status.textContent = "Connected! Version: " + (data.version || "Unknown");
        showOutput(JSON.stringify(data, null, 2)); // DEBUG: Show Report XML
      } else {
        status.textContent = "Connection Failed";
        showOutput(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      status.textContent = "Error";
      showOutput(e.message);
    }
  });

  btnSync.addEventListener("click", async () => {
    status.textContent = "Syncing Employees...";
    output.style.display = "none";

    const selectedHotel = importHotel ? importHotel.value : "";
    if (!selectedHotel) {
      status.textContent = "Error: Please select a hotel.";
      alert("Please select a hotel to sync.");
      return;
    }

    const qs = `?hotel=${encodeURIComponent(selectedHotel)}`;

    try {
      // Step 1: Sync Employee List (Names)
      const empData = await apiGet("/api/qb/employees" + qs);
      if (empData.status !== "ok") throw new Error(empData.message || "Employee Sync Failed");

      const count = (empData.employees || []).length;
      status.textContent = `Found ${count} employees. Fetching Vacation Reports (this takes time)...`;

      // Step 2: Sync Vacation Balances from Report
      const reportData = await apiGet("/api/qb/sync-vacation" + qs);

      if (reportData.status === "ok") {
        const stats = reportData.syncStats || {};
        status.textContent = `Synced. Employees: ${count}. Vacation Updates: ${stats.updated || 0}.`;

        // Show combined validation output
        if (stats.updated > 0) {
          showOutput(`Success! Updated vacation balances for ${stats.updated} employees based on Payroll Summary Report.`);
        } else {
          showOutput(`Sync Complete. No vacation balance updates found. Check logs.`);
        }
      } else {
        status.textContent = "Vacation Sync Failed";
        showOutput(JSON.stringify(reportData, null, 2));
      }

      // Refresh UI
      if (typeof loadSyncHistory === 'function') loadSyncHistory();

      // Refresh Details if Hotel Selected (in Tab 2)
      const t2h = document.getElementById("tab2Hotel");
      if (t2h && t2h.value) loadEmployeesForHotel(t2h.value);

    } catch (e) {
      status.textContent = "Error";
      showOutput(e.message);
    }
  });
}
wireQBSync();

// --- Auth & Users Logic ---

function wireAuth() {
  const btn = document.getElementById("logoutBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "login.html";
    });
  }
}

async function loadUsers() {
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="muted">Loading...</td></tr>`;

  try {
    const r = await apiGet("/api/users");
    if (!r.ok) {
      tbody.innerHTML = `<tr><td colspan="6" class="error">Error: ${r.error}</td></tr>`;
      return;
    }

    tbody.innerHTML = (r.users || []).map(u => `
      <tr>
        <td><strong>${esc(u.username)}</strong></td>
        <td>${esc(u.role)}</td>
        <td>${esc(u.first_name)}</td>
        <td>${esc(u.last_name)}</td>
        <td>${esc(fmtDateTime(u.created_at))}</td>
        <td>
          <button class="btn smallBtn" onclick="openUserModal(
            '${u.id}', '${u.username}', '${u.role}', '${u.first_name}', '${u.last_name}'
          )">Edit</button>
          ${u.username !== 'admin' && u.id !== currentUser.id ?
        `<button class="btnDangerSmall" onclick="deleteUser(${u.id})">Del</button>` : ''}
        </td>
      </tr>
    `).join("");

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="error">${e.message}</td></tr>`;
  }
}

async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function apiDelete(url) {
  const r = await fetch(url, { method: "DELETE" });
  return r.json();
}

async function apiPut(url, body) {
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

// === Move Employees Tool ===
function wireMoveTool() {
  const sourceSel = document.getElementById("moveSourceHotel");
  const targetSel = document.getElementById("moveTargetHotel");
  const listDiv = document.getElementById("moveEmployeeList");
  const btnMove = document.getElementById("moveEmployeesBtn");

  if (!sourceSel || !targetSel || !listDiv || !btnMove) return;

  // Load Hotels
  loadHotels().then(hotels => {
    const opts = `<option value="">Select Hotel...</option>` +
      hotels.map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join("");
    sourceSel.innerHTML = opts;
    targetSel.innerHTML = opts;
  });

  // Load Employees on Source Change
  sourceSel.addEventListener("change", async () => {
    const hotel = sourceSel.value;
    listDiv.innerHTML = "<p>Loading...</p>";
    if (!hotel) { listDiv.innerHTML = ""; return; }

    try {
      // Need endpoint to list employees for move. 
      // We can use the existing /api/employees ? Or reuse fetch logic
      // We'll trust the existing qb/employees or similar?
      // Wait, we don't have a simple "GET /api/employees?hotel=X" public endpoint that returns valid JSON list?
      // We do have /api/settings/opening-balances?hotel=X which returns list! Use that.
      const r = await apiGet(`/api/settings/opening-balances?hotel=${encodeURIComponent(hotel)}`);
      if (r.ok && r.rows) {
        if (r.rows.length === 0) {
          listDiv.innerHTML = "<p>No employees found.</p>";
          return;
        }

        // Render Checkboxes
        let html = `<div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">`;
        // Add "Select All"
        html += `<label style="display:block; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:5px;">
          <input type="checkbox" id="moveSelectAll" /> Select All (${r.rows.length})
        </label>`;

        html += r.rows.map(e => `
          <label style="display:block; padding: 2px 0;">
            <input type="checkbox" class="move-emp-check" value="${esc(e.employee_key)}" /> 
            ${esc(e.employee_key)}
          </label>
        `).join("");
        html += "</div>";
        listDiv.innerHTML = html;

        // Wire Select All
        const allCheck = document.getElementById("moveSelectAll");
        if (allCheck) {
          allCheck.addEventListener("change", (e) => {
            const checks = listDiv.querySelectorAll(".move-emp-check");
            checks.forEach(c => c.checked = e.target.checked);
          });
        }

      } else {
        listDiv.innerHTML = "<p>Error loading employees.</p>";
      }
    } catch (e) {
      listDiv.innerHTML = `<p>Error: ${esc(e.message)}</p>`;
    }
  });

  // Handle Move
  btnMove.addEventListener("click", async () => {
    const source = sourceSel.value;
    const target = targetSel.value;
    if (!source || !target) { alert("Please select both hotels."); return; }
    if (source === target) { alert("Source and Target must be different."); return; }

    const checks = listDiv.querySelectorAll(".move-emp-check:checked");
    if (checks.length === 0) { alert("No employees selected."); return; }

    const keys = Array.from(checks).map(c => c.value);

    if (!confirm(`Move ${keys.length} employees from "${source}" to "${target}"?`)) return;

    btnMove.disabled = true;
    btnMove.textContent = "Moving...";

    try {
      const r = await apiPost("/api/employees/move", {
        sourceHotel: source,
        targetHotel: target,
        employeeKeys: keys
      });

      if (r.ok) {
        alert(`Successfully moved ${r.count} employees.`);
        // Refresh list
        sourceSel.dispatchEvent(new Event("change"));
      } else {
        alert("Error: " + (r.error || "Failed"));
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      btnMove.disabled = false;
      btnMove.textContent = "Move Employees";
    }
  });
}

// User Modal Logic
function wireUsers() {
  document.getElementById("addUserBtn").addEventListener("click", () => openUserModal());
  document.getElementById("userModalClose").addEventListener("click", closeUserModal);
  document.getElementById("userModalCancel").addEventListener("click", closeUserModal);

  document.getElementById("userModalSave").addEventListener("click", async () => {
    const id = document.getElementById("userId").value;
    const body = {
      username: document.getElementById("userUsername").value,
      role: document.getElementById("userRole").value,
      first_name: document.getElementById("userFirstName").value,
      last_name: document.getElementById("userLastName").value,
      password: document.getElementById("userPassword").value
    };

    if (!body.username) { alert("Username required"); return; }

    const url = id ? `/api/users/${id}` : `/api/users`;
    const fn = id ? apiPut : apiPost;

    const r = await fn(url, body);
    if (r.ok) {
      closeUserModal();
      loadUsers();
    } else {
      alert("Error: " + (r.error || "Failed"));
    }
  });
}

function openUserModal(id, username, role, first, last) {
  document.getElementById("userModalOverlay").classList.add("active");
  document.getElementById("userId").value = id || "";
  document.getElementById("userUsername").value = username || "";
  document.getElementById("userRole").value = role || "user";
  document.getElementById("userFirstName").value = first || "";
  document.getElementById("userLastName").value = last || "";
  document.getElementById("userPassword").value = "";

  document.getElementById("userModalTitle").textContent = id ? "Edit User" : "Add User";
  document.getElementById("userUsername").disabled = !!id; // Cannot change username
  document.getElementById("pwdHint").style.display = id ? "inline" : "none";
}

function closeUserModal() {
  document.getElementById("userModalOverlay").classList.remove("active");
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  const r = await apiDelete(`/api/users/${id}`);
  if (r.ok) loadUsers();
  else alert("Error: " + r.error);
}

wireAuth();
wireUsers();

// Column Resizing Logic
// Column Resizing Logic
function enableColumnResizing(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const cols = table.querySelectorAll('th');
  cols.forEach((col, index) => {
    col.style.position = 'relative';

    // Prevent duplicate resizers
    if (col.querySelector('.resizer')) return;

    const key = `col_width_${tableId}_${index}`;

    // Restore saved width
    const saved = localStorage.getItem(key);
    if (saved) {
      col.style.width = saved;
    }

    const resizer = document.createElement('div');
    resizer.classList.add('resizer');
    col.appendChild(resizer);

    let x = 0;
    let w = 0;

    const mouseDownHandler = (e) => {
      x = e.clientX;
      const styles = window.getComputedStyle(col);
      w = parseInt(styles.width, 10);

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      resizer.classList.add('resizing');
    };

    const mouseMoveHandler = (e) => {
      const dx = e.clientX - x;
      col.style.width = `${w + dx}px`;
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      resizer.classList.remove('resizing');
      // Save new width
      localStorage.setItem(key, col.style.width);
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
  });
}

// Init Resizing for Opening Balances
enableColumnResizing('openingBalancesTable');