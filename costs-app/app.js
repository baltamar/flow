/* ============================================================
   دفتر الحسابات — مصاريف ومرتبات المحل
   تخزين محلي بالكامل (localStorage). لا يوجد خادم أو نقل بيانات.
   ============================================================ */
"use strict";

var STORAGE = {
  expenses: "costs.expenses.v1",
  employees: "costs.employees.v1",
  payments: "costs.salaryPayments.v1",
  categories: "costs.categories.v1",
  settings: "costs.settings.v1"
};

var DEFAULT_CATEGORIES = [
  "إيجار المحل",
  "كهرباء وماء",
  "صيانة وإصلاح",
  "نقل وشحن",
  "تسويق وإعلان",
  "مستلزمات مكتبية",
  "اتصالات وإنترنت",
  "ضرائب ورسوم",
  "أخرى"
];

var DEFAULT_SETTINGS = {
  shopName: "محل الكهربائيات المنزلية",
  currency: "د.ل"
};

var PAYMENT_METHOD_LABELS = {
  cash: "نقداً",
  bank: "تحويل بنكي",
  card: "بطاقة",
  other: "أخرى"
};

/* ---------------------------------------------------------------
   Storage helpers
   --------------------------------------------------------------- */

function loadJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (!raw) return fallback;
    var parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    console.warn("[costs] تعذّرت قراءة", key, err);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("[costs] تعذّر الحفظ", key, err);
    toast("تعذّر حفظ البيانات — تحقق من مساحة التخزين", "error");
  }
}

var state = {
  expenses: loadJSON(STORAGE.expenses, []),
  employees: loadJSON(STORAGE.employees, []),
  payments: loadJSON(STORAGE.payments, []),
  categories: loadJSON(STORAGE.categories, DEFAULT_CATEGORIES.slice()),
  settings: Object.assign({}, DEFAULT_SETTINGS, loadJSON(STORAGE.settings, {}))
};

function persist(part) {
  saveJSON(STORAGE[part], state[part]);
}

/* ---------------------------------------------------------------
   Utilities
   --------------------------------------------------------------- */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function currentMonthKey(date) {
  var d = date || new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function todayISO() {
  var d = new Date();
  var tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function formatCurrency(amount) {
  var n = Number(amount) || 0;
  var formatted = n.toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatted + " " + state.settings.currency;
}

function formatDate(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ar-LY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function monthLabel(monthKey) {
  var parts = monthKey.split("-");
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return d.toLocaleDateString("ar-LY", { month: "long", year: "numeric" });
}

function escapeHTML(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function debounce(fn, wait) {
  var t;
  return function () {
    var args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(ctx, args); }, wait);
  };
}

/* ---------------------------------------------------------------
   Toast + confirm dialog
   --------------------------------------------------------------- */

function toast(message, type) {
  var host = document.getElementById("toastHost");
  var el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = message;
  host.appendChild(el);
  setTimeout(function () {
    el.style.opacity = "0";
    el.style.transition = "opacity .2s ease";
    setTimeout(function () { el.remove(); }, 220);
  }, 2200);
}

function confirmDialog(message) {
  return new Promise(function (resolve) {
    var dialog = document.getElementById("confirmDialog");
    document.getElementById("confirmMessage").textContent = message;
    dialog.hidden = false;
    function cleanup(result) {
      dialog.hidden = true;
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
      resolve(result);
    }
    var yesBtn = document.getElementById("confirmYes");
    var noBtn = document.getElementById("confirmNo");
    function onYes() { cleanup(true); }
    function onNo() { cleanup(false); }
    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

/* ---------------------------------------------------------------
   Router / tabs
   --------------------------------------------------------------- */

var currentView = "dashboard";

function setView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach(function (v) {
    v.classList.toggle("active", v.dataset.view === view);
  });
  document.querySelectorAll(".tab").forEach(function (t) {
    var active = t.dataset.view === view;
    t.toggleAttribute("aria-current", active);
    if (active) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  render();
}

/* ---------------------------------------------------------------
   Derived data
   --------------------------------------------------------------- */

function getMonthKey() {
  return document.getElementById("monthPicker").value || currentMonthKey();
}

function expensesForMonth(monthKey) {
  return state.expenses.filter(function (e) { return e.date && e.date.slice(0, 7) === monthKey; });
}

function ensurePaymentsForMonth(monthKey) {
  var activeEmployees = state.employees.filter(function (emp) { return emp.active !== false; });
  var changed = false;
  activeEmployees.forEach(function (emp) {
    var exists = state.payments.some(function (p) { return p.employeeId === emp.id && p.month === monthKey; });
    if (!exists) {
      state.payments.push({
        id: uid(),
        employeeId: emp.id,
        month: monthKey,
        baseSalary: emp.baseSalary,
        bonus: 0,
        deductions: 0,
        paid: false,
        paidDate: null
      });
      changed = true;
    }
  });
  if (changed) persist("payments");
}

function paymentsForMonth(monthKey) {
  return state.payments.filter(function (p) { return p.month === monthKey; });
}

function netPayment(p) {
  return (Number(p.baseSalary) || 0) + (Number(p.bonus) || 0) - (Number(p.deductions) || 0);
}

/* ---------------------------------------------------------------
   Rendering: Dashboard
   --------------------------------------------------------------- */

function renderDashboard() {
  var monthKey = getMonthKey();
  var monthExpenses = expensesForMonth(monthKey);
  ensurePaymentsForMonth(monthKey);
  var monthPayments = paymentsForMonth(monthKey);

  var totalExpenses = monthExpenses.reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
  var totalSalaries = monthPayments.reduce(function (s, p) { return s + netPayment(p); }, 0);
  var grandTotal = totalExpenses + totalSalaries;
  var paidCount = monthPayments.filter(function (p) { return p.paid; }).length;

  var kpiGrid = document.getElementById("kpiGrid");
  kpiGrid.innerHTML = [
    kpiCard("مصاريف تشغيلية", formatCurrency(totalExpenses), "is-danger"),
    kpiCard("مرتبات الشهر", formatCurrency(totalSalaries), ""),
    kpiCard("الإجمالي العام", formatCurrency(grandTotal), "is-success"),
    kpiCard("مرتبات مدفوعة", paidCount + " من " + monthPayments.length, "")
  ].join("");

  var byCategory = {};
  monthExpenses.forEach(function (e) {
    byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.amount) || 0);
  });
  var rows = Object.keys(byCategory).map(function (cat) { return { cat: cat, amount: byCategory[cat] }; });
  rows.sort(function (a, b) { return b.amount - a.amount; });
  var max = rows.length ? rows[0].amount : 0;

  var breakdown = document.getElementById("categoryBreakdown");
  if (!rows.length) {
    breakdown.innerHTML = '<p class="empty-state">لا توجد مصاريف لهذا الشهر بعد.</p>';
  } else {
    breakdown.innerHTML = rows.map(function (r) {
      var pct = max ? Math.max(4, Math.round((r.amount / max) * 100)) : 0;
      return (
        '<div class="bar-row">' +
        '<span>' + escapeHTML(r.cat) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="bar-value">' + formatCurrency(r.amount) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  var activity = monthExpenses.map(function (e) {
    return { type: "expense", date: e.date, label: e.category, note: e.note, amount: -(Number(e.amount) || 0) };
  }).concat(monthPayments.filter(function (p) { return p.paid; }).map(function (p) {
    var emp = state.employees.find(function (x) { return x.id === p.employeeId; });
    return { type: "salary", date: p.paidDate || monthKey + "-01", label: "راتب " + (emp ? emp.name : "موظف محذوف"), note: "", amount: -netPayment(p) };
  }));
  activity.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
  activity = activity.slice(0, 8);

  var recent = document.getElementById("recentActivity");
  if (!activity.length) {
    recent.innerHTML = '<p class="empty-state">لا توجد حركات مسجلة بعد.</p>';
  } else {
    recent.innerHTML = activity.map(function (a) {
      return (
        '<div class="tx-row"><div class="tx-main"><span>' + escapeHTML(a.label) +
        '</span><small>' + formatDate(a.date) + (a.note ? " — " + escapeHTML(a.note) : "") + "</small></div>" +
        '<span class="tx-amount ' + (a.type === "expense" ? "expense" : "salary") + '">' + formatCurrency(a.amount) + "</span></div>"
      );
    }).join("");
  }
}

function kpiCard(label, value, extraClass) {
  return (
    '<div class="kpi-card ' + (extraClass || "") + '">' +
    '<div class="kpi-label">' + label + "</div>" +
    '<div class="kpi-value">' + value + "</div>" +
    "</div>"
  );
}

/* ---------------------------------------------------------------
   Rendering: Expenses
   --------------------------------------------------------------- */

function populateCategorySelects() {
  var selects = [document.getElementById("expenseCategory"), document.getElementById("expenseCategoryFilter")];
  selects.forEach(function (sel, idx) {
    var keepValue = sel.value;
    var options = state.categories.map(function (c) {
      return '<option value="' + escapeHTML(c) + '">' + escapeHTML(c) + "</option>";
    }).join("");
    sel.innerHTML = idx === 1 ? '<option value="">كل التصنيفات</option>' + options : options;
    if (keepValue && state.categories.indexOf(keepValue) !== -1) sel.value = keepValue;
  });
}

function renderExpenses() {
  var monthKey = getMonthKey();
  var search = (document.getElementById("expenseSearch").value || "").trim().toLowerCase();
  var catFilter = document.getElementById("expenseCategoryFilter").value;

  var list = expensesForMonth(monthKey).filter(function (e) {
    if (catFilter && e.category !== catFilter) return false;
    if (search) {
      var hay = (e.category + " " + (e.note || "")).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });
  list.sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || b.createdAt - a.createdAt; });

  var body = document.getElementById("expensesList");
  var emptyState = document.getElementById("expensesEmptyState");
  if (!list.length) {
    body.innerHTML = "";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    body.innerHTML = list.map(function (e) {
      var meta = formatDate(e.date) + " · " + (PAYMENT_METHOD_LABELS[e.paymentMethod] || e.paymentMethod || "") +
        (e.note ? " — " + escapeHTML(e.note) : "");
      return (
        '<div class="expense-row">' +
        '<div class="tx-main"><span>' + escapeHTML(e.category) + "</span>" +
        "<small>" + meta + "</small></div>" +
        '<div class="expense-row-end">' +
        '<span class="tx-amount expense">' + formatCurrency(e.amount) + "</span>" +
        '<div class="row-actions">' +
        '<button class="icon-action" data-action="edit-expense" data-id="' + e.id + '" aria-label="تعديل">✎</button>' +
        '<button class="icon-action danger" data-action="delete-expense" data-id="' + e.id + '" aria-label="حذف">✕</button>' +
        "</div></div></div>"
      );
    }).join("");
  }

  var total = list.reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
  document.getElementById("expensesTotal").textContent = formatCurrency(total);
}

function resetExpenseForm() {
  document.getElementById("expenseForm").reset();
  document.getElementById("expenseId").value = "";
  document.getElementById("expenseDate").value = todayISO();
  document.getElementById("expenseSubmitBtn").textContent = "إضافة المصروف";
  document.getElementById("expenseCancelEdit").hidden = true;
}

/* ---------------------------------------------------------------
   Rendering: Salaries
   --------------------------------------------------------------- */

function renderSalaries() {
  var monthKey = getMonthKey();
  ensurePaymentsForMonth(monthKey);
  document.getElementById("salaryMonthLabel").textContent = "— " + monthLabel(monthKey);

  var rows = paymentsForMonth(monthKey).map(function (p) {
    var emp = state.employees.find(function (x) { return x.id === p.employeeId; });
    return { payment: p, employee: emp };
  }).filter(function (r) { return r.employee; });
  rows.sort(function (a, b) { return a.employee.name.localeCompare(b.employee.name, "ar"); });

  var host = document.getElementById("salariesList");
  var emptyState = document.getElementById("salariesEmptyState");
  if (!rows.length) {
    host.innerHTML = "";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    host.innerHTML = rows.map(function (r) {
      var p = r.payment, emp = r.employee;
      return (
        '<div class="salary-card">' +
        '<div class="salary-card-head">' +
        '<div class="who"><strong>' + escapeHTML(emp.name) + "</strong>" +
        (emp.role ? "<small>" + escapeHTML(emp.role) + "</small>" : "") + "</div>" +
        (p.paid ? '<span class="badge badge-success">مدفوع</span>' : '<span class="badge badge-warning">غير مدفوع</span>') +
        "</div>" +
        '<div class="salary-card-fields">' +
        '<label>الراتب الأساسي<input type="number" class="salary-field" data-field="baseSalary" data-id="' + p.id + '" value="' + p.baseSalary + '" min="0" step="0.01"></label>' +
        '<label>مكافأة<input type="number" class="salary-field" data-field="bonus" data-id="' + p.id + '" value="' + p.bonus + '" min="0" step="0.01"></label>' +
        '<label>خصم<input type="number" class="salary-field" data-field="deductions" data-id="' + p.id + '" value="' + p.deductions + '" min="0" step="0.01"></label>' +
        "</div>" +
        '<div class="salary-card-footer">' +
        '<span>الصافي: <strong>' + formatCurrency(netPayment(p)) + "</strong></span>" +
        '<button class="btn btn-sm ' + (p.paid ? "btn-ghost" : "btn-primary") + '" data-action="toggle-paid" data-id="' + p.id + '">' + (p.paid ? "إلغاء الدفع" : "تحديد كمدفوع") + "</button>" +
        "</div></div>"
      );
    }).join("");
  }

  var total = rows.reduce(function (s, r) { return s + netPayment(r.payment); }, 0);
  document.getElementById("salariesTotal").textContent = formatCurrency(total);
}

/* ---------------------------------------------------------------
   Rendering: Employees
   --------------------------------------------------------------- */

function renderEmployees() {
  var list = state.employees.slice().sort(function (a, b) {
    if ((a.active === false) !== (b.active === false)) return a.active === false ? 1 : -1;
    return a.name.localeCompare(b.name, "ar");
  });
  var host = document.getElementById("employeesList");
  var emptyState = document.getElementById("employeesEmptyState");
  if (!list.length) {
    host.innerHTML = "";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    host.innerHTML = list.map(function (emp) {
      return (
        '<div class="employee-card ' + (emp.active === false ? "inactive" : "") + '">' +
        '<div class="who"><strong>' + escapeHTML(emp.name) + "</strong><small>" +
        escapeHTML(emp.role || "بدون مسمى وظيفي") + (emp.phone ? " · " + escapeHTML(emp.phone) : "") +
        (emp.active === false ? " · غير نشط" : "") + "</small></div>" +
        '<span class="amount">' + formatCurrency(emp.baseSalary) + "</span>" +
        '<div class="row-actions">' +
        '<button class="icon-action" data-action="edit-employee" data-id="' + emp.id + '" aria-label="تعديل">✎</button>' +
        '<button class="icon-action" data-action="toggle-active-employee" data-id="' + emp.id + '" aria-label="تفعيل/تعطيل">' + (emp.active === false ? "↺" : "⏸") + "</button>" +
        '<button class="icon-action danger" data-action="delete-employee" data-id="' + emp.id + '" aria-label="حذف">✕</button>' +
        "</div></div>"
      );
    }).join("");
  }
}

function resetEmployeeForm() {
  document.getElementById("employeeForm").reset();
  document.getElementById("employeeId").value = "";
  document.getElementById("employeeFormTitle").textContent = "إضافة موظف";
  document.getElementById("employeeSubmitBtn").textContent = "إضافة الموظف";
  document.getElementById("employeeCancelEdit").hidden = true;
}

/* ---------------------------------------------------------------
   Rendering: Settings
   --------------------------------------------------------------- */

function renderSettings() {
  document.getElementById("settingShopName").value = state.settings.shopName;
  document.getElementById("settingCurrency").value = state.settings.currency;
  document.getElementById("shopNameLabel").textContent = state.settings.shopName || "دفتر الحسابات";

  document.getElementById("categoriesList").innerHTML = state.categories.map(function (c) {
    return (
      '<span class="chip">' + escapeHTML(c) +
      '<button data-action="delete-category" data-name="' + escapeHTML(c) + '" aria-label="حذف التصنيف">✕</button></span>'
    );
  }).join("");
}

/* ---------------------------------------------------------------
   Master render
   --------------------------------------------------------------- */

function render() {
  populateCategorySelects();
  if (currentView === "dashboard") renderDashboard();
  else if (currentView === "expenses") renderExpenses();
  else if (currentView === "salaries") renderSalaries();
  else if (currentView === "employees") renderEmployees();
  else if (currentView === "settings") renderSettings();
}

/* ---------------------------------------------------------------
   CSV export
   --------------------------------------------------------------- */

function downloadFile(filename, content, mime) {
  var blob = new Blob([content], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function toCSV(rows) {
  return rows.map(function (row) {
    return row.map(function (cell) {
      var s = String(cell == null ? "" : cell).replace(/"/g, '""');
      return /[",\n]/.test(s) ? '"' + s + '"' : s;
    }).join(",");
  }).join("\r\n");
}

function exportExpensesCSV() {
  var monthKey = getMonthKey();
  var list = expensesForMonth(monthKey);
  var rows = [["التاريخ", "التصنيف", "المبلغ", "طريقة الدفع", "ملاحظات"]];
  list.forEach(function (e) {
    rows.push([e.date, e.category, e.amount, PAYMENT_METHOD_LABELS[e.paymentMethod] || e.paymentMethod, e.note || ""]);
  });
  downloadFile("مصاريف-" + monthKey + ".csv", "﻿" + toCSV(rows), "text/csv;charset=utf-8");
}

function exportSalariesCSV() {
  var monthKey = getMonthKey();
  var rows = [["الموظف", "الراتب الأساسي", "مكافأة", "خصم", "الصافي", "الحالة"]];
  paymentsForMonth(monthKey).forEach(function (p) {
    var emp = state.employees.find(function (x) { return x.id === p.employeeId; });
    rows.push([emp ? emp.name : "", p.baseSalary, p.bonus, p.deductions, netPayment(p), p.paid ? "مدفوع" : "غير مدفوع"]);
  });
  downloadFile("مرتبات-" + monthKey + ".csv", "﻿" + toCSV(rows), "text/csv;charset=utf-8");
}

/* ---------------------------------------------------------------
   Backup / restore
   --------------------------------------------------------------- */

function exportBackup() {
  var payload = {
    exportedAt: new Date().toISOString(),
    app: "costs-app",
    version: 1,
    data: {
      expenses: state.expenses,
      employees: state.employees,
      payments: state.payments,
      categories: state.categories,
      settings: state.settings
    }
  };
  downloadFile("نسخة-احتياطية-" + todayISO() + ".json", JSON.stringify(payload, null, 2), "application/json");
}

function importBackup(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var payload = JSON.parse(reader.result);
      var data = payload && payload.data ? payload.data : payload;
      if (!data || !Array.isArray(data.expenses) || !Array.isArray(data.employees)) {
        throw new Error("ملف غير صالح");
      }
      state.expenses = data.expenses || [];
      state.employees = data.employees || [];
      state.payments = data.payments || [];
      state.categories = data.categories && data.categories.length ? data.categories : DEFAULT_CATEGORIES.slice();
      state.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
      ["expenses", "employees", "payments", "categories", "settings"].forEach(persist);
      render();
      toast("تم استيراد النسخة الاحتياطية بنجاح", "success");
    } catch (err) {
      toast("تعذّر قراءة ملف النسخة الاحتياطية", "error");
    }
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------
   Event wiring
   --------------------------------------------------------------- */

function init() {
  var monthPicker = document.getElementById("monthPicker");
  monthPicker.value = currentMonthKey();
  monthPicker.addEventListener("change", render);

  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () { setView(btn.dataset.view); });
  });

  resetExpenseForm();
  populateCategorySelects();

  document.getElementById("expenseForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var id = document.getElementById("expenseId").value;
    var amount = parseFloat(document.getElementById("expenseAmount").value);
    if (!amount || amount <= 0) { toast("أدخل مبلغاً صحيحاً", "error"); return; }
    var record = {
      id: id || uid(),
      category: document.getElementById("expenseCategory").value,
      amount: amount,
      date: document.getElementById("expenseDate").value || todayISO(),
      paymentMethod: document.getElementById("expensePaymentMethod").value,
      note: document.getElementById("expenseNote").value.trim(),
      createdAt: id ? (state.expenses.find(function (e) { return e.id === id; }) || {}).createdAt || Date.now() : Date.now()
    };
    if (id) {
      var idx = state.expenses.findIndex(function (e) { return e.id === id; });
      if (idx !== -1) state.expenses[idx] = record;
    } else {
      state.expenses.push(record);
    }
    persist("expenses");
    resetExpenseForm();
    render();
    toast(id ? "تم تعديل المصروف" : "تمت إضافة المصروف", "success");
  });

  document.getElementById("expenseCancelEdit").addEventListener("click", resetExpenseForm);
  document.getElementById("expenseSearch").addEventListener("input", debounce(renderExpenses, 150));
  document.getElementById("expenseCategoryFilter").addEventListener("change", renderExpenses);
  document.getElementById("exportExpensesBtn").addEventListener("click", exportExpensesCSV);

  document.getElementById("expensesList").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    var id = btn.dataset.id;
    if (btn.dataset.action === "edit-expense") {
      var e = state.expenses.find(function (x) { return x.id === id; });
      if (!e) return;
      document.getElementById("expenseId").value = e.id;
      document.getElementById("expenseCategory").value = e.category;
      document.getElementById("expenseAmount").value = e.amount;
      document.getElementById("expenseDate").value = e.date;
      document.getElementById("expensePaymentMethod").value = e.paymentMethod || "cash";
      document.getElementById("expenseNote").value = e.note || "";
      document.getElementById("expenseSubmitBtn").textContent = "حفظ التعديلات";
      document.getElementById("expenseCancelEdit").hidden = false;
      document.getElementById("expenseForm").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (btn.dataset.action === "delete-expense") {
      confirmDialog("هل تريد حذف هذا المصروف؟").then(function (ok) {
        if (!ok) return;
        state.expenses = state.expenses.filter(function (x) { return x.id !== id; });
        persist("expenses");
        render();
        toast("تم حذف المصروف", "success");
      });
    }
  });

  document.getElementById("salariesList").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-action='toggle-paid']");
    if (!btn) return;
    var p = state.payments.find(function (x) { return x.id === btn.dataset.id; });
    if (!p) return;
    p.paid = !p.paid;
    p.paidDate = p.paid ? todayISO() : null;
    persist("payments");
    renderSalaries();
    if (currentView === "dashboard") renderDashboard();
    toast(p.paid ? "تم تسجيل الدفع" : "تم إلغاء تسجيل الدفع", "success");
  });

  document.getElementById("salariesList").addEventListener("change", function (ev) {
    var input = ev.target.closest(".salary-field");
    if (!input) return;
    var p = state.payments.find(function (x) { return x.id === input.dataset.id; });
    if (!p) return;
    var val = parseFloat(input.value);
    p[input.dataset.field] = isNaN(val) ? 0 : val;
    persist("payments");
    renderSalaries();
  });

  document.getElementById("exportSalariesBtn").addEventListener("click", exportSalariesCSV);

  document.getElementById("employeeForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var id = document.getElementById("employeeId").value;
    var name = document.getElementById("employeeName").value.trim();
    var salary = parseFloat(document.getElementById("employeeSalary").value);
    if (!name) { toast("أدخل اسم الموظف", "error"); return; }
    if (!salary || salary < 0) { toast("أدخل راتباً صحيحاً", "error"); return; }
    if (id) {
      var emp = state.employees.find(function (x) { return x.id === id; });
      if (emp) {
        emp.name = name;
        emp.role = document.getElementById("employeeRole").value.trim();
        emp.baseSalary = salary;
        emp.phone = document.getElementById("employeePhone").value.trim();
      }
    } else {
      state.employees.push({
        id: uid(),
        name: name,
        role: document.getElementById("employeeRole").value.trim(),
        baseSalary: salary,
        phone: document.getElementById("employeePhone").value.trim(),
        active: true
      });
    }
    persist("employees");
    resetEmployeeForm();
    render();
    toast(id ? "تم تعديل بيانات الموظف" : "تمت إضافة الموظف", "success");
  });

  document.getElementById("employeeCancelEdit").addEventListener("click", resetEmployeeForm);

  document.getElementById("employeesList").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    var id = btn.dataset.id;
    var emp = state.employees.find(function (x) { return x.id === id; });
    if (!emp) return;
    if (btn.dataset.action === "edit-employee") {
      document.getElementById("employeeId").value = emp.id;
      document.getElementById("employeeName").value = emp.name;
      document.getElementById("employeeRole").value = emp.role || "";
      document.getElementById("employeeSalary").value = emp.baseSalary;
      document.getElementById("employeePhone").value = emp.phone || "";
      document.getElementById("employeeFormTitle").textContent = "تعديل بيانات موظف";
      document.getElementById("employeeSubmitBtn").textContent = "حفظ التعديلات";
      document.getElementById("employeeCancelEdit").hidden = false;
      document.getElementById("employeeForm").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (btn.dataset.action === "toggle-active-employee") {
      emp.active = emp.active === false ? true : false;
      persist("employees");
      renderEmployees();
      toast(emp.active ? "تم تفعيل الموظف" : "تم تعطيل الموظف (لن تُنشأ له مرتبات جديدة)", "success");
    } else if (btn.dataset.action === "delete-employee") {
      confirmDialog("سيتم حذف الموظف وكل سجلات مرتباته. هل أنت متأكد؟").then(function (ok) {
        if (!ok) return;
        state.employees = state.employees.filter(function (x) { return x.id !== id; });
        state.payments = state.payments.filter(function (x) { return x.employeeId !== id; });
        persist("employees");
        persist("payments");
        render();
        toast("تم حذف الموظف", "success");
      });
    }
  });

  document.getElementById("settingsForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    state.settings.shopName = document.getElementById("settingShopName").value.trim() || DEFAULT_SETTINGS.shopName;
    state.settings.currency = document.getElementById("settingCurrency").value.trim() || DEFAULT_SETTINGS.currency;
    persist("settings");
    render();
    toast("تم حفظ الإعدادات", "success");
  });

  document.getElementById("categoryForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var input = document.getElementById("newCategoryName");
    var name = input.value.trim();
    if (!name) return;
    if (state.categories.indexOf(name) !== -1) { toast("هذا التصنيف موجود مسبقاً", "error"); return; }
    state.categories.push(name);
    persist("categories");
    input.value = "";
    render();
    toast("تمت إضافة التصنيف", "success");
  });

  document.getElementById("categoriesList").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button[data-action='delete-category']");
    if (!btn) return;
    var name = btn.dataset.name;
    var inUse = state.expenses.some(function (e) { return e.category === name; });
    var proceed = inUse
      ? confirmDialog('هذا التصنيف مستخدم في مصاريف مسجلة. الحذف لن يؤثر على السجلات الحالية. متابعة؟')
      : Promise.resolve(true);
    proceed.then(function (ok) {
      if (!ok) return;
      state.categories = state.categories.filter(function (c) { return c !== name; });
      persist("categories");
      render();
    });
  });

  document.getElementById("exportBackupBtn").addEventListener("click", exportBackup);
  document.getElementById("importBackupInput").addEventListener("change", function (ev) {
    var file = ev.target.files && ev.target.files[0];
    if (file) importBackup(file);
    ev.target.value = "";
  });

  document.getElementById("resetDataBtn").addEventListener("click", function () {
    confirmDialog("سيتم حذف جميع البيانات نهائياً من هذا الجهاز. هل أنت متأكد؟").then(function (ok) {
      if (!ok) return;
      state.expenses = [];
      state.employees = [];
      state.payments = [];
      state.categories = DEFAULT_CATEGORIES.slice();
      state.settings = Object.assign({}, DEFAULT_SETTINGS);
      ["expenses", "employees", "payments", "categories", "settings"].forEach(persist);
      render();
      toast("تم حذف جميع البيانات", "success");
    });
  });

  setView("dashboard");
}

document.addEventListener("DOMContentLoaded", init);

/* ---------------------------------------------------------------
   Service worker registration
   --------------------------------------------------------------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function (err) {
      console.warn("[costs] تعذّر تسجيل Service Worker", err);
    });
  });
}
