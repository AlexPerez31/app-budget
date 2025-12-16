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

  categories.forEach(cat => {
    const li = document.createElement('li');
    li.className = `list-item ${cat.type}`;
    li.innerHTML = `
      <span>${cat.name}</span>
      <small>${cat.type === 'income' ? 'Ingreso' : 'Egreso'}${cat.maxAmount ? ` - Máx: ${formatCOP(cat.maxAmount)}` : ''}</small>
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

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    option.dataset.type = cat.type;
    txCategorySelect.appendChild(option);
  });

  saveTxBtn.disabled = false;
}

function renderRecords() {
  recordsList.innerHTML = '';

  const list = filteredTransactions || transactions;

  // Orden inverso (última transacción arriba)
  list.slice().reverse().forEach(tx => {
    const category = categories.find(c => c.id === tx.categoryId);
    const date = new Date(tx.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const li = document.createElement('li');
    li.className = `record ${tx.type}`;

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
  const sorted = list.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  const totalsByCategory = {}; // 🔹 key = cat.id
  let totalIncome = 0;
  let totalExpense = 0;

  // 1️⃣ Filas individuales y totales
  sorted.forEach(tx => {
    const cat = categories.find(c => c.id === tx.categoryId);
    const date = new Date(tx.createdAt);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

    const amountSign = tx.type === 'income' ? '+' : '-';
    const color = tx.type === 'income' ? 'green' : 'red';

    // Fila individual
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${cat ? cat.name : 'Sin categoría'}</td>
      <td>${tx.description || ''}</td>
      <td style="color:${color}">${amountSign}$${tx.amount.toLocaleString('es-CO')}</td>
    `;
    reportTableBody.appendChild(tr);

    // Totales por categoría usando id
    if (cat) {
      if (!totalsByCategory[cat.id]) {
        totalsByCategory[cat.id] = { name: cat.name, type: cat.type, amount: 0 };
      }
      totalsByCategory[cat.id].amount += tx.amount;
    }

    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpense += tx.amount;
  });

  // 2️⃣ Filas de totales por categoría
  const totalsEgresos = {};
  Object.values(totalsByCategory).forEach(cat => {
    const color = cat.type === 'income' ? 'green' : 'red';
    const sign = cat.type === 'income' ? '+' : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="3">Total ${cat.name}</td>
      <td style="color:${color}">${sign}$${cat.amount.toLocaleString('es-CO')}</td>
    `;
    reportTableFoot.appendChild(tr);

    if (cat.type === 'expense') totalsEgresos[cat.name] = cat.amount;
  });

  // 3️⃣ Totales generales
  const trTotal = document.createElement('tr');
  trTotal.innerHTML = `<td colspan="3">TOTAL INGRESOS</td><td style="color:green">+$${totalIncome.toLocaleString('es-CO')}</td>`;
  reportTableFoot.appendChild(trTotal);

  const trTotalExp = document.createElement('tr');
  trTotalExp.innerHTML = `<td colspan="3">TOTAL EGRESOS</td><td style="color:red">-$${totalExpense.toLocaleString('es-CO')}</td>`;
  reportTableFoot.appendChild(trTotalExp);

  const trBalance = document.createElement('tr');
  const balance = totalIncome - totalExpense;
  const balanceColor = balance >=0 ? 'green' : 'red';
  trBalance.innerHTML = `<td colspan="3">BALANCE</td><td style="color:${balanceColor}">$${balance.toLocaleString('es-CO')}</td>`;
  reportTableFoot.appendChild(trBalance);

  if ((filteredReportTransactions || transactions).length > 0) {
    exportReportBtn.disabled = false;
  } else {
    exportReportBtn.disabled = true;
  }

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

  // 1️⃣ Egresos del mes actual
  const monthExpenses = transactions.filter(tx => {
    const d = new Date(tx.createdAt);
    return tx.type === 'expense' && d >= startOfMonth && d <= now;
  });

  // 2️⃣ Sumar por categoría
  const expenseTotals = {};
  monthExpenses.forEach(tx => {
    expenseTotals[tx.categoryId] =
      (expenseTotals[tx.categoryId] || 0) + tx.amount;
  });

  // 3️⃣ Verificar límites
  const exceededCategories = [];

  categories.forEach(cat => {
    if (
      cat.type === 'expense' &&
      cat.maxAmount &&
      expenseTotals[cat.id] > cat.maxAmount
    ) {
      exceededCategories.push({
        name: cat.name,
        spent: expenseTotals[cat.id],
        limit: cat.maxAmount
      });
    }
  });

  // 4️⃣ Render visual
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


// ================== ACCIONES ==================
function deleteTransaction(id) {
  if (!confirm('¿Eliminar este registro?')) return;

  transactions = transactions.filter(tx => tx.id !== id);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  renderRecords();
}

function editTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  editingTransactionId = id;

  // Mostrar fecha/hora original solo para info
  const date = new Date(tx.createdAt);
  const formatted = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  editTxDateInput.value = formatted;

  // Rellenar el resto de campos
  editTxAmountInput.value = tx.amount;
  editTxDescriptionInput.value = tx.description || '';
  editTxCategorySelect.innerHTML = '';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    option.selected = cat.id === tx.categoryId;
    editTxCategorySelect.appendChild(option);
  });

  // Mostrar la vista de edición
  views.forEach(view => view.classList.remove('active'));
  document.querySelector('[data-view="edit"]').classList.add('active');
  navButtons.forEach(b => b.disabled = true);
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
  categoryMaxAmountInput.value = cat.maxAmount != null ? cat.maxAmount : '';
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
  const maxAmount = categoryMaxAmountInput.value ? Number(categoryMaxAmountInput.value) : null;

  if (!name) return;

  if (editingCategoryId) {
    const cat = categories.find(c => c.id === editingCategoryId);
    cat.name = name;
    cat.type = type;
    cat.maxAmount = maxAmount;
    editingCategoryId = null;
  } else {
    categories.push({
      id: Date.now(),
      name,
      type,
      maxAmount
    });
  }

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

  if (editingTransactionId) {
    // Actualizar transacción
    const tx = transactions.find(t => t.id === editingTransactionId);
    tx.amount = amount;
    tx.description = description;
    tx.categoryId = Number(selectedOption.value);
    tx.type = selectedOption.dataset.type;

    editingTransactionId = null;

    // ✅ Volver automáticamente a la vista de registros
    views.forEach(view => {
      view.classList.toggle('active', view.dataset.view === 'records');
    });
    navButtons.forEach(b => b.classList.remove('active'));
    document.querySelector('.nav-btn[data-target="records"]').classList.add('active');
  } else {
    // Agregar nuevo
    transactions.push({
      id: Date.now(),
      amount,
      description,
      categoryId: Number(selectedOption.value),
      type: selectedOption.dataset.type,
      createdAt: new Date().toISOString()
    });
  }

  localStorage.setItem('transactions', JSON.stringify(transactions));
  txForm.reset();
  saveTxBtn.textContent = 'Guardar';
  document.querySelector('section[data-view="add"] h1').textContent = 'Nuevo movimiento';

  renderRecords();
});


// ================== FORM EDITAR TRANSACCIONES ==================
editForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!editingTransactionId) return;

  const tx = transactions.find(t => t.id === editingTransactionId);
  tx.amount = Number(editTxAmountInput.value);
  tx.description = editTxDescriptionInput.value.trim();
  tx.categoryId = Number(editTxCategorySelect.value);
  tx.type = categories.find(c => c.id === tx.categoryId).type;

  // 🔹 NO modificamos tx.createdAt

  localStorage.setItem('transactions', JSON.stringify(transactions));

  // Regresar a vista de registros
  views.forEach(view => view.classList.remove('active'));
  document.querySelector('[data-view="records"]').classList.add('active');
  navButtons.forEach(b => b.disabled = false);
  renderRecords();

  editingTransactionId = null;
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
