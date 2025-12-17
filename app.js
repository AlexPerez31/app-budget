// ================== REFERENCIAS DOM ==================
const navButtons = document.querySelectorAll('.nav-btn[data-target]');
const views = document.querySelectorAll('.view');

const txForm = document.getElementById('transactionForm');
const txCategorySelect = document.getElementById('txCategory');
const txAmountInput = document.getElementById('txAmount');
const txDescriptionInput = document.getElementById('txDescription');
const saveTxBtn = document.getElementById('saveTxBtn');
const recordsList = document.getElementById('recordsList');

const openModalBtn = document.getElementById('openCategoryModal');
const closeModalBtn = document.getElementById('closeCategoryModal');
const modal = document.getElementById('categoryModal');
const categoryMaxAmountInput = document.getElementById('categoryMaxAmount');

const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const categoryTypeSelect = document.getElementById('categoryType');
const categoryList = document.getElementById('categoryList');

const categoryDueDateInput = document.getElementById('categoryDueDate');
const categoryDueDateWrapper = document.getElementById('categoryDueDateWrapper');
const categoryAmountWrapper = document.getElementById('categoryAmountWrapper');


const filterMonthInput = document.getElementById('filterMonth');
const filterFromInput = document.getElementById('filterFrom');
const filterToInput = document.getElementById('filterTo');
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');

const editForm = document.getElementById('editTransactionForm');
const editTxAmountInput = document.getElementById('editTxAmount');
const editTxDescriptionInput = document.getElementById('editTxDescription');
const editTxCategorySelect = document.getElementById('editTxCategory');
const editTxDateInput = document.getElementById('editTxDate');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const reportFilterMonthInput = document.getElementById('reportFilterMonth');
const reportFilterFromInput = document.getElementById('reportFilterFrom');
const reportFilterToInput = document.getElementById('reportFilterTo');
const reportApplyFilterBtn = document.getElementById('reportApplyFilter');
const reportClearFilterBtn = document.getElementById('reportClearFilter');
const reportTitle = document.getElementById('reportTitle');
const reportTableBody = document.querySelector('#reportTable tbody');
const reportTableFoot = document.querySelector('#reportTable tfoot');
const exportReportBtn = document.getElementById('exportReportBtn');
let filteredReportTransactions = null;
exportReportBtn.disabled = true;

const txFlowSelect = document.getElementById('txFlow');
const editTxFlowSelect = document.getElementById('editTxFlow');


// ================== PERFIL / MI ESTADO ==================
const statusImage = document.getElementById('statusImage');
const statusMessage = document.getElementById('statusMessage');
const statusList = document.getElementById('statusList');



function formatCOP(amount) {
  return '$' + amount.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}



// ================== ESTADO ==================
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

let editingTransactionId = null;
let editingCategoryId = null;
let filteredTransactions = null;

let totalsEgresosGlobal = {};




// ================== RENDER ==================
function renderCategories() {
  categoryList.innerHTML = '';

  const order = {
    expense: 1,
    income: 2,
    goal: 3
  };

  const sortedCategories = [...categories].sort(
    (a, b) => order[a.type] - order[b.type]
  );

  sortedCategories.forEach(cat => {
    const li = document.createElement('li');
    li.className = `list-item ${cat.type}`;

    let typeLabel = 'Egreso';
    if (cat.type === 'income') typeLabel = 'Ingreso';
    if (cat.type === 'goal') typeLabel = 'Ahorro';

    li.innerHTML = `
      <span style="display: flex; flex-direction: column;">
        <span style="font-size: 16px; font-weight: bold;">${cat.name}</span>
        <span style="font-size: 12px; color: #888888;">${typeLabel}</span>
      </span>
      <small>
        ${cat.amount ? ` ${formatCOP(cat.amount)}` : ''}
        ${cat.type === 'goal' && cat.dueDate
          ? ` - Límite: ${new Date(cat.dueDate).toLocaleDateString('es-CO')}`
          : ''}
      </small>
      <div class="actions">
        <button onclick="editCategory(${cat.id})">✏️</button>
        <button onclick="deleteCategory(${cat.id})">🗑️</button>
      </div>
    `;

    categoryList.appendChild(li);
  });

  renderCategorySelect();
}


function renderCategorySelect() {
  txCategorySelect.innerHTML = '';

  if (categories.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'Crea una categoría primero';
    option.disabled = true;
    option.selected = true;
    txCategorySelect.appendChild(option);
    saveTxBtn.disabled = true;
    return;
  }

  const order = { expense: 1, income: 2, goal: 3 };

  const sorted = [...categories].sort(
    (a, b) => order[a.type] - order[b.type]
  );

  sorted.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    type_n = ""
    if (cat.type === 'expense') type_n = 'Egreso';
    if (cat.type === 'income') type_n = 'Ingreso';
    if (cat.type === 'goal') type_n = 'Ahorro';
    option.textContent = cat.name + " - " + type_n;
    option.dataset.type = cat.type;
    txCategorySelect.appendChild(option);
  });

  saveTxBtn.disabled = false;
}


function renderRecords() {
  recordsList.innerHTML = '';

  const list = filteredTransactions || transactions;

  list.slice().reverse().forEach(tx => {
    const category = categories.find(c => c.id === tx.categoryId);
    const date = new Date(tx.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const li = document.createElement('li');

    let recordClasses = 'record';
    if (category && category.type === 'goal') {
      recordClasses += ' goal';

      if (tx.type === 'income') {
        recordClasses += ' goal-in';
      } else {
        recordClasses += ' goal-out';
      }
    } else {
      recordClasses += ` ${tx.type}`;
    }
    li.className = recordClasses;


    li.innerHTML = `
      <div class="record-info">
        <strong>${category ? category.name : 'Sin categoría'}</strong>
        ${tx.description ? `<small>${tx.description}</small>` : ''}
        <small>${formattedDate}</small>
      </div>
      <div class="record-actions">
        <span class="record-amount">${tx.type === 'income' ? '+' : '-'}${formatCOP(tx.amount)}</span>
        <button onclick="editTransaction(${tx.id})">✏️</button>
        <button onclick="deleteTransaction(${tx.id})">🗑️</button>
      </div>
    `;

    recordsList.appendChild(li);
  });
}


function renderReport() {
  reportTableBody.innerHTML = '';
  reportTableFoot.innerHTML = '';

  const list = filteredReportTransactions || transactions;

  // Orden ascendente
  const sorted = list.slice().sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const totalsByCategory = {};
  let totalIncome = 0;
  let totalExpense = 0;

  // 🔹 separar normales vs ahorros
  const normalTx = [];
  const goalTx = [];

  sorted.forEach(tx => {
    const cat = categories.find(c => c.id === tx.categoryId);
    if (cat?.type === 'goal') {
      goalTx.push({ tx, cat });
    } else {
      normalTx.push({ tx, cat });
    }
  });

  // ================== TRANSACCIONES NORMALES ==================
  normalTx.forEach(({ tx, cat }) => {
    const date = new Date(tx.createdAt);
    const formattedDate =
      date.toLocaleDateString() + ' ' +
      date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

    const sign = tx.type === 'income' ? '+' : '-';
    const color = tx.type === 'income' ? 'green' : 'red';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${cat ? cat.name : 'Sin categoría'}</td>
      <td>${tx.description || ''}</td>
      <td style="color:${color}">
        ${sign}$${tx.amount.toLocaleString('es-CO')}
      </td>
    `;
    reportTableBody.appendChild(tr);

    if (cat) {
      if (!totalsByCategory[cat.id]) {
        totalsByCategory[cat.id] = {
          name: cat.name,
          type: cat.type,
          amount: 0
        };
      }
      totalsByCategory[cat.id].amount += tx.amount;
    }

    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpense += tx.amount;
  });

  // ================== TOTALES POR CATEGORÍA (NO AHORROS) ==================
  Object.values(totalsByCategory).forEach(cat => {
    const color = cat.type === 'income' ? 'green' : 'red';
    const sign = cat.type === 'income' ? '+' : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="3">Total ${cat.name}</td>
      <td style="color:${color}">
        ${sign}$${cat.amount.toLocaleString('es-CO')}
      </td>
    `;
    reportTableFoot.appendChild(tr);
  });

  // ================== TOTALES GENERALES ==================
  const trTotalExpense = document.createElement('tr');
  trTotalExpense.classList.add('total-row', 'total-expense');
  trTotalExpense.innerHTML = `
    <td colspan="3">TOTAL INGRESOS</td>
    <td style="color:green">+$${totalIncome.toLocaleString('es-CO')}</td>
  `;
  reportTableFoot.appendChild(trTotalExpense);

  const trTotalIncome = document.createElement('tr');
  trTotalIncome.classList.add('total-row', 'total-income');
  trTotalIncome.innerHTML = `
    <td colspan="3">TOTAL EGRESOS</td>
    <td style="color:red">-$${totalExpense.toLocaleString('es-CO')}</td>
  `;
  reportTableFoot.appendChild(trTotalIncome);

  const trBalance = document.createElement('tr');
  trBalance.classList.add('total-row', 'total-balance');
  const balance = totalIncome - totalExpense;
  const balanceColor = balance >= 0 ? 'green' : 'red';
  trBalance.innerHTML = `
    <td colspan="3">BALANCE</td>
    <td style="color:${balanceColor}">
      $${balance.toLocaleString('es-CO')}
    </td>
  `;
  reportTableFoot.appendChild(trBalance);

  // ================== SECCIÓN AHORROS ==================
  if (goalTx.length > 0) {

    const trSpacer = document.createElement('tr');
    trSpacer.innerHTML = `
      <td colspan="4" style="background-color: white; height: 20px;"></td>
    `;
    reportTableFoot.appendChild(trSpacer);

    const trTitle = document.createElement('tr');
    trTitle.innerHTML = `
      <td colspan="4" style="
        text-align:center;
        background:#eef4ff;
        color:#2563eb;
        font-weight:bold;
      ">
        Ahorros
      </td>
    `;
    reportTableFoot.appendChild(trTitle);

    const savingsTotals = {};

    goalTx.forEach(({ tx, cat }) => {
      const date = new Date(tx.createdAt);
      const formattedDate =
        date.toLocaleDateString() + ' ' +
        date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

      const sign = tx.type === 'income' ? '+' : '-';
      const color = tx.type === 'income' ? 'green' : 'red';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td>${cat.name}</td>
        <td>${tx.description || ''}</td>
        <td style="color:${color}">
          ${sign}$${tx.amount.toLocaleString('es-CO')}
        </td>
      `;
      reportTableFoot.appendChild(tr);

      if (!savingsTotals[cat.id]) {
        savingsTotals[cat.id] = { name: cat.name, total: 0 };
      }

      savingsTotals[cat.id].total +=
        tx.type === 'income' ? tx.amount : -tx.amount;
    });

    Object.values(savingsTotals).forEach(s => {
      const color = s.total >= 0 ? 'green' : 'red';
      const sign = s.total >= 0 ? '+' : '-';

      const tr = document.createElement('tr');
      tr.classList.add('total-row', 'total-savings');
      tr.innerHTML = `
        <td colspan="3">Total ahorro ${s.name}</td>
        <td style="color:${color}">
          ${sign}$${Math.abs(s.total).toLocaleString('es-CO')}
        </td>
      `;
      reportTableFoot.appendChild(tr);
    });
  }

  exportReportBtn.disabled = list.length === 0;
}


exportReportBtn.addEventListener('click', () => {
  const table = document.getElementById('reportTable');
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table, {
    raw: true
  });

  Object.keys(ws).forEach(cell => {
  if (cell.startsWith('D') && cell !== 'D1') {
    ws[cell].t = 's'; // fuerza string
  }
});


  XLSX.utils.book_append_sheet(wb, ws, "Reporte");

  // Usamos el título como nombre del archivo
  const filename = reportTitle.textContent.replace(/\s+/g, '_') + ".xlsx";
  XLSX.writeFile(wb, filename);
});



function renderProfileStatus() {
  statusList.innerHTML = '';

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  //Egresos del mes actual
  const monthExpenses = transactions.filter(tx => {
    const d = new Date(tx.createdAt);
    return tx.type === 'expense' && d >= startOfMonth && d <= now;
  });

  //Sumar por categoría
  const expenseTotals = {};
  monthExpenses.forEach(tx => {
    expenseTotals[tx.categoryId] =
      (expenseTotals[tx.categoryId] || 0) + tx.amount;
  });

  //Verificar límites
  const exceededCategories = [];

  categories.forEach(cat => {
    if (
      cat.type === 'expense' &&
      cat.amount &&
      (expenseTotals[cat.id] || 0) > cat.amount
    ) {
      exceededCategories.push({
        name: cat.name,
        spent: expenseTotals[cat.id],
        limit: cat.amount
      });
    }
  });


  //Render visual
  if (exceededCategories.length === 0) {
    statusImage.src = 'img/feliz.png';
    statusMessage.textContent =
      '¡Felicidades! No has superado tus egresos este mes.';
  } else {
    statusImage.src = 'img/triste.png';
    statusMessage.textContent =
      'Has superado el límite en las siguientes categorías:';

    exceededCategories.forEach(cat => {
      const li = document.createElement('li');
      li.textContent =
        `${cat.name} — $${cat.spent.toLocaleString('es-CO')} / ` +
        `$${cat.limit.toLocaleString('es-CO')}`;
      statusList.appendChild(li);
    });
  }
}


function renderSavingsStatus() {
  const savingsList = document.getElementById('savingsList');
  savingsList.innerHTML = '';

  const savings = categories.filter(c => c.type === 'goal');
  if (savings.length === 0) return;

  savings.forEach(goal => {
    // transacciones del ahorro
    const relatedTx = transactions.filter(tx => tx.categoryId === goal.id);

    let saved = 0;
    relatedTx.forEach(tx => {
      saved += tx.type === 'income' ? tx.amount : -tx.amount;
    });

    const target = goal.amount;
    const remaining = Math.max(target - saved, 0);
    const progress = Math.min((saved / target) * 100, 100);

    const card = document.createElement('div');
    card.className = 'saving-card';

    card.innerHTML = `
      <div class="saving-header">
        <h3>
          ${goal.name} - ${formatCOP(goal.amount)}
        </h3>
        <span class="saving-meta">
          ${goal.dueDate ? `⏳ ${formatDate(goal.dueDate)}` : ''}
        </span>
      </div>

      <div class="saving-values">
        <span>Ahorrado: ${formatCOP(saved)}</span>
        <span>Falta: ${formatCOP(remaining)}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
    `;

    savingsList.appendChild(card);
  });
}


function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}


// ================== ACCIONES ==================
function deleteTransaction(id) {
  if (!confirm('¿Eliminar este registro?')) return;

  transactions = transactions.filter(tx => tx.id !== id);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  renderRecords();
}

function renderEditCategorySelect(selectedCategoryId) {
  editTxCategorySelect.innerHTML = '';

  const orderedCategories = [
    ...categories.filter(c => c.type === 'expense'),
    ...categories.filter(c => c.type === 'income'),
    ...categories.filter(c => c.type === 'goal')
  ];

  orderedCategories.forEach(cat => {
    type_n = ""
    if (cat.type == "expense") type_n = "Egreso"
    if (cat.type === 'income') type_n = "Ingreso"
    if (cat.type === 'goal') type_n = "Ahorro"
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name + " - " + type_n;
    option.dataset.type = cat.type;

    if (cat.id === selectedCategoryId) {
      option.selected = true;
    }

    editTxCategorySelect.appendChild(option);
  });

  // 🔁 aplicar lógica de flujo según categoría
  handleEditCategoryChange();
}


function handleEditCategoryChange() {
  const selectedOption = editTxCategorySelect.selectedOptions[0];
  if (!selectedOption) return;

  const type = selectedOption.dataset.type;

  if (type === 'goal') {
    editTxFlowSelect.disabled = false;
  } else {
    editTxFlowSelect.disabled = true;
    editTxFlowSelect.value = '';
  }
}

editTxCategorySelect.addEventListener('change', handleEditCategoryChange);

function editTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingTransactionId = id;

  // 🔹 obtener categoría real
  const category = categories.find(c => c.id === tx.categoryId);
  if (!category) return;

  // cargar vista
  views.forEach(view => view.classList.remove('active'));
  document.querySelector('[data-view="edit"]').classList.add('active');
  navButtons.forEach(b => b.disabled = true);

  // cargar datos
  editTxDate.value = new Date(tx.createdAt).toLocaleString();
  editTxDescription.value = tx.description || '';
  editTxAmount.value = tx.amount;

  // cargar categorías
  renderEditCategorySelect(tx.categoryId);

  // 🔹 flujo SOLO para ahorro
  if (category.type === 'goal') {
    editTxFlowSelect.disabled = false;
    editTxFlowSelect.value = tx.type; // income | expense
  } else {
    editTxFlowSelect.disabled = true;
    editTxFlowSelect.value = '';
  }
}


editingTransactionId = null;  
saveTxBtn.textContent = 'Guardar';
document.querySelector('section[data-view="add"] h1').textContent = 'Nuevo movimiento';  


function deleteCategory(id) {
  const used = transactions.some(tx => tx.categoryId === id);

  if (used) {
    alert('No puedes eliminar una categoría que tiene registros.');
    return;
  }

  if (!confirm('¿Eliminar esta categoría?')) return;

  categories = categories.filter(cat => cat.id !== id);
  localStorage.setItem('categories', JSON.stringify(categories));
  renderCategories();
  renderCategorySelect();
}

function editCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  editingCategoryId = id;

  categoryNameInput.value = cat.name;
  categoryTypeSelect.value = cat.type;
  categoryMaxAmountInput.value = cat.amount || '';
  categoryDueDateInput.value = cat.dueDate || '';

  categoryTypeSelect.dispatchEvent(new Event('change'));

  modal.classList.remove('hidden');
}


function applyFilter() {
  const month = filterMonthInput.value;
  const from = filterFromInput.value;
  const to = filterToInput.value;

  if (month) {
    const [year, monthNum] = month.split('-');

    filteredTransactions = transactions.filter(tx => {
      const d = new Date(tx.createdAt);
      return (
        d.getFullYear() == year &&
        d.getMonth() + 1 == monthNum
      );
    });
  } else if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    filteredTransactions = transactions.filter(tx => {
      const d = new Date(tx.createdAt);
      return d >= fromDate && d <= toDate;
    });
  } else {
    filteredTransactions = null;
  }

  renderRecords();
}

function clearFilter() {
  filteredTransactions = null;
  filterMonthInput.value = '';
  filterFromInput.value = '';
  filterToInput.value = '';
  renderRecords();
}


const exportBackupBtn = document.getElementById('exportBackupBtn');
exportBackupBtn.addEventListener('click', () => {
  const backup = {
    meta: {
      app: 'Mi presupuesto',
      exportedAt: new Date().toISOString(),
      version: 1
    },
    categories,
    transactions
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  const now = new Date();
  localStorage.setItem('lastBackupAt', now.toISOString());

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const date = now.toISOString().slice(0, 10);
  const time = now
    .toTimeString()
    .split(' ')[0]
    .replace(/:/g, '-');

  a.href = url;
  a.download = `backup_presupuesto_${date}_${time}.json`;

  a.click();
  URL.revokeObjectURL(url);

  renderLastBackupInfo();
});



const importBackupBtn = document.getElementById('importBackupBtn');
const importBackupInput = document.getElementById('importBackupInput');
importBackupBtn.addEventListener('click', () => {
  importBackupInput.click();
});


function renderLastBackupInfo() {
  const lastBackupText = document.getElementById('lastBackupText');
  if (!lastBackupText) return;

  const lastBackup = localStorage.getItem('lastBackupAt');

  if (!lastBackup) {
    lastBackupText.textContent = 'Aún no has creado un respaldo';
    return;
  }

  const date = new Date(lastBackup);
  lastBackupText.textContent =
    `Último respaldo: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}



importBackupInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const cleanText = reader.result.replace(/^\uFEFF/, '');
      const backup = JSON.parse(cleanText);
      importBackupData(backup);
    } catch (err) {
      console.error(err);
      alert('Archivo inválido');
    }
  };

  reader.readAsText(file);
  importBackupInput.value = '';
});


categoryTypeSelect.addEventListener('change', () => {
  const type = categoryTypeSelect.value;

  categoryMaxAmountInput.value = '';
  categoryDueDateInput.value = '';

  if (type === 'income') {
    categoryAmountWrapper.classList.add('hidden');
    categoryDueDateWrapper.classList.add('hidden');
  }

  if (type === 'expense') {
    categoryAmountWrapper.classList.remove('hidden');
    categoryDueDateWrapper.classList.add('hidden');
  }

  if (type === 'goal') {
    categoryAmountWrapper.classList.remove('hidden');
    categoryDueDateWrapper.classList.remove('hidden');
  }
});




function importBackupData(backup) {
  if (
    !backup ||
    !Array.isArray(backup.categories) ||
    !Array.isArray(backup.transactions)
  ) {
    alert('Backup inválido o incompleto');
    return;
  }

  // 🔹 1. MERGE CATEGORÍAS (por id)
  const existingCategoryIds = new Set(categories.map(c => c.id));
  let newCategories = 0;

  backup.categories.forEach(cat => {
    if (!existingCategoryIds.has(cat.id)) {
      categories.push(cat);
      newCategories++;
    }
  });

  // 🔹 2. MERGE TRANSACCIONES (por createdAt exacto)
  const existingDates = new Set(transactions.map(t => t.createdAt));

  let importedCount = 0;
  let skippedCount = 0;

  backup.transactions.forEach(tx => {
    if (existingDates.has(tx.createdAt)) {
      skippedCount++;
    } else {
      transactions.push(tx);
      importedCount++;
    }
  });

  // 🔹 3. Guardar en storage (solo lo que exista)
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('categories', JSON.stringify(categories));


  // 🔹 4. Refrescar vistas
  renderRecords();
  renderCategories(); // ← IMPORTANTE
  renderReport();

  alert(
    `Importación completada:\n\n` +
    `📂 Categorías nuevas: ${newCategories}\n` +
    `✔ Transacciones nuevas: ${importedCount}\n` +
    `⏭ Omitidas (duplicadas): ${skippedCount}`
  );
}



// ================== NAVEGACIÓN ==================
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;

    // Activar botón
    navButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    // Cambiar vista
    views.forEach(view => {
      view.classList.toggle('active', view.dataset.view === target);
    });

    // Vista ADD
    if (target === 'add' && editingTransactionId === null) {
      txForm.reset();
      saveTxBtn.textContent = 'Guardar';
      document.querySelector(
        'section[data-view="add"] h1'
      ).textContent = 'Nuevo movimiento';
    }

    // ✅ VISTA PERFIL / MI ESTADO
    if (target === 'profile') {
      renderProfileStatus();
      renderSavingsStatus();
      renderLastBackupInfo();
    }
  });
});


reportApplyFilterBtn.addEventListener('click', applyReportFilter);
reportClearFilterBtn.addEventListener('click', clearReportFilter);


// ================== MODALES ==================
openModalBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.add('hidden');
});

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');     
  editingCategoryId = null;        
  categoryForm.reset();   
});

modal.addEventListener('click', e => {
  if (e.target === modal) {     
    modal.classList.add('hidden');  
    editingCategoryId = null;
    categoryForm.reset();    
  }
});



// ================== FORM CATEGORÍAS ==================
categoryForm.addEventListener('submit', e => {
  e.preventDefault();

  const name = categoryNameInput.value.trim();
  const type = categoryTypeSelect.value;

  const amount =
    type !== 'income' && categoryMaxAmountInput.value
      ? Number(categoryMaxAmountInput.value)
      : null;

  const dueDate =
    type === 'goal' && categoryDueDateInput.value
      ? categoryDueDateInput.value
      : null;

  if (!name) {
    alert('La categoría debe tener un nombre');
    return;
  }

  if (type === 'goal' && !categoryMaxAmountInput.value) {
    alert('El ahorro debe tener un monto objetivo');
    return;
  }

  const normalizedName = name.toLowerCase();

  const duplicated = categories.some(cat => {
    if (editingCategoryId && cat.id === editingCategoryId) return false;
    return cat.name.toLowerCase() === normalizedName;
  });

  if (duplicated) {
    alert('Ya existe una categoría con ese nombre');
    return;
  }

  if (editingCategoryId) {
    const category = categories.find(c => c.id === editingCategoryId);
    if (!category) return;
    console.log(amount)
    category.name = name;
    category.type = type;
    category.amount = amount;
    category.dueDate = dueDate;

    editingCategoryId = null;
  } else {
    categories.push({
      id: Date.now(),
      name,
      type,
      amount,
      dueDate,
      createdAt: new Date().toISOString()
    });
  }
  // =======================================================

  localStorage.setItem('categories', JSON.stringify(categories));
  categoryForm.reset();
  modal.classList.add('hidden');
  renderCategories();
});




// ================== FORM TRANSACCIONES ==================
txForm.addEventListener('submit', e => {
  e.preventDefault();

  const amount = Number(txAmountInput.value);
  const description = txDescriptionInput.value.trim();
  const selectedOption = txCategorySelect.selectedOptions[0];
  if (!amount || amount <= 0 || !selectedOption) return;

  const categoryType = selectedOption.dataset.type;
  let txType = categoryType;

  if (categoryType === 'goal') {
    if (!txFlowSelect.value) {
      alert('Define si el ahorro es entrada o salida');
      return;
    }
    txType = txFlowSelect.value;
  }

  transactions.push({
    id: Date.now(),
    amount,
    description,
    categoryId: Number(selectedOption.value),
    type: txType,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem('transactions', JSON.stringify(transactions));
  txForm.reset();

  renderRecords();
  renderSavingsStatus();
});


txCategorySelect.addEventListener('change', () => {
  const selected = txCategorySelect.selectedOptions[0];
  if (!selected) return;

  const type = selected.dataset.type;

  if (type === 'goal') {
    txFlowSelect.disabled = false;
    txFlowSelect.value = '';
  } else {
    txFlowSelect.disabled = true;
    txFlowSelect.value = '';
  }
});


// ================== FORM EDITAR TRANSACCIONES ==================
editForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!editingTransactionId) return;

  const tx = transactions.find(t => t.id === editingTransactionId);
  if (!tx) return;

  const amount = Number(editTxAmountInput.value);
  if (!amount || amount <= 0) return;

  const description = editTxDescriptionInput.value.trim();
  const categoryId = Number(editTxCategorySelect.value);

  // 🔹 obtener la categoría real
  const category = categories.find(c => c.id === categoryId);
  if (!category) return;

  // 🔒 validación: ahorro debe definir flujo
  if (category.type === 'goal' && !editTxFlowSelect.value) {
    alert('Debes definir si el ahorro es entrada o salida');
    return;
  }

  // 🔹 actualizar datos
  tx.amount = amount;
  tx.description = description;
  tx.categoryId = categoryId;

  // 🔹 tipo final de la transacción
  tx.type =
    category.type === 'goal'
      ? editTxFlowSelect.value   
      : category.type;           


  localStorage.setItem('transactions', JSON.stringify(transactions));

  views.forEach(view => view.classList.remove('active'));
  document.querySelector('[data-view="records"]').classList.add('active');
  navButtons.forEach(b => b.disabled = false);

  renderRecords();
  editingTransactionId = null;
  renderSavingsStatus();
});



cancelEditBtn.addEventListener('click', () => {
  editingTransactionId = null;
  views.forEach(view => view.classList.remove('active'));
  document.querySelector('[data-view="records"]').classList.add('active');
  navButtons.forEach(b => b.disabled = false);
});



// ================== FILTROS ==================
applyFilterBtn.addEventListener('click', applyFilter);
clearFilterBtn.addEventListener('click', clearFilter);


function applyReportFilter() {
  const month = reportFilterMonthInput.value;
  const from = reportFilterFromInput.value;
  const to = reportFilterToInput.value;

  if (month) {
    const [year, monthNum] = month.split('-');
    filteredReportTransactions = transactions.filter(tx => {
      const d = new Date(tx.createdAt);
      return d.getFullYear() == year && (d.getMonth()+1) == monthNum;
    });
    reportTitle.textContent = `Reporte presupuestal - Mes: ${month}`;
  } else if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23,59,59,999);

    filteredReportTransactions = transactions.filter(tx => {
      const d = new Date(tx.createdAt);
      return d >= fromDate && d <= toDate;
    });
    reportTitle.textContent = `Reporte presupuestal - Rango: ${from} a ${to}`;
  } else {
    filteredReportTransactions = null;
    reportTitle.textContent = 'Reporte presupuestal - Todo';
  }

  renderReport();
}

function clearReportFilter() {
  filteredReportTransactions = null;
  reportFilterMonthInput.value = '';
  reportFilterFromInput.value = '';
  reportFilterToInput.value = '';
  reportTitle.textContent = 'Reporte presupuestal - Todo';
  renderReport();
}



// ========================= BORRAR TODO ====================


clearAllDataBtn.addEventListener('click', () => {
  const confirmation = confirm(
    '⚠️ ESTA ACCIÓN ES IRREVERSIBLE.\n\n¿Seguro que quieres continuar? Primero crea un BACKUP'
  );

  if (!confirmation) return;

  const password = prompt(
    'Para confirmar, escribe "BORRAR TODO":'
  );

  if (password !== 'BORRAR TODO') {
    alert('❌ Contraseña incorrecta. No se borró nada.');
    return;
  }

  // 🔥 BORRADO TOTAL SOLO SI PASA TODO
  localStorage.clear();

  alert('✅ Todos los datos fueron eliminados correctamente.');

  location.reload(); // recarga la app limpia
});



// ================== INICIALIZACIÓN ==================
renderCategories();
renderCategorySelect();
renderRecords();


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .then(() => console.log('Service Worker registrado'))
      .catch(err => console.error('SW error', err));
  });
}
