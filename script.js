// App State
const state = {
  employees: [],
  shifts: [],
  currentWeekDate: new Date(),
  currentPage: 'employees',
  editingEmployee: null,
  editingShift: null,
  selectedDay: null,
  selectedShiftType: null
};

// DOM Elements
const employeesList = document.getElementById('employee-list');
const shiftTable = document.getElementById('shift-table');
const weekDisplay = document.getElementById('week-display');
const employeeModal = document.getElementById('employee-modal');
const employeeModalTitle = document.getElementById('employee-modal-title');
const employeeForm = document.getElementById('employee-form');
const employeeIdInput = document.getElementById('employee-id');
const employeeNameInput = document.getElementById('employee-name');
const employeePositionInput = document.getElementById('employee-position');
const employeePhoneInput = document.getElementById('employee-phone');
const employeeEmailInput = document.getElementById('employee-email');
const shiftModal = document.getElementById('shift-modal');
const shiftDayDisplay = document.getElementById('shift-day-display');
const shiftTypeDisplay = document.getElementById('shift-type-display');
const shiftEmployeeSelect = document.getElementById('shift-employee');
const shiftForm = document.getElementById('shift-form');
const shiftIdInput = document.getElementById('shift-id');
const shiftDayInput = document.getElementById('shift-day');
const shiftTypeInput = document.getElementById('shift-type');
const paymentModal = document.getElementById('payment-modal');
const paymentModalTitle = document.getElementById('payment-modal-title');
const paymentMonthSelect = document.getElementById('payment-month');
const paymentYearSelect = document.getElementById('payment-year');
const paymentPeriodDisplay = document.getElementById('payment-period');
const paymentLoading = document.getElementById('payment-loading');
const paymentEmpty = document.getElementById('payment-empty');
const paymentData = document.getElementById('payment-data');
const overlay = document.querySelector('.overlay');

// Constants
const SHIFT_TYPES = {
  morning: 'Mattina',
  afternoon: 'Pomeriggio',
  night: 'Notte'
};

const DAYS_OF_WEEK = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica'
];

const MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre'
];

const SHIFT_RATES = {
  morning: 50,
  afternoon: 40,
  night: 70
};

// Helper Functions
function formatCurrency(value) {
  return '€' + value.toFixed(2);
}

function getWeekId(date) {
  const year = date.getFullYear();
  const weekNumber = getWeekNumber(date);
  return `${year}-${weekNumber}`;
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekDates(date) {
  const result = [];
  // Find Monday (1) of the current week
  const day = date.getDay() || 7; // Convert Sunday (0) to 7
  const diff = date.getDate() - day + 1; // adjust to Monday
  const monday = new Date(date);
  monday.setDate(diff);
  
  // Get all days of the week
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    result.push(currentDay);
  }
  return result;
}

function formatWeekRange(date) {
  const weekDates = getWeekDates(date);
  const startDate = weekDates[0].getDate();
  const endDate = weekDates[6].getDate();
  const month = MONTHS[weekDates[0].getMonth()];
  const year = weekDates[0].getFullYear();
  
  return `${startDate}-${endDate} ${month} ${year}`;
}

function formatDateForCalendar(date) {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

// UI Functions
function updateUI() {
  if (state.currentPage === 'employees') {
    renderEmployees();
  } else if (state.currentPage === 'calendar') {
    renderCalendar();
  }
}

function renderEmployees() {
  employeesList.innerHTML = '';
  
  if (state.employees.length === 0) {
    employeesList.innerHTML = '<div class="empty-state">Nessun dipendente disponibile. Aggiungi un nuovo dipendente per iniziare.</div>';
    return;
  }
  
  state.employees.forEach(employee => {
    // Count shifts for this employee in the current week
    const weekId = getWeekId(state.currentWeekDate);
    const shiftsCount = state.shifts.filter(shift => 
      shift.employeeId === employee.id && 
      shift.weekId === weekId
    ).length;
    
    const availableShifts = 5 - shiftsCount;
    
    const employeeCard = document.createElement('div');
    employeeCard.className = 'employee-card';
    employeeCard.innerHTML = `
      <div class="employee-header">
        <div>
          <h3 class="employee-name">${employee.name}</h3>
          <div class="employee-position">${employee.position}</div>
        </div>
        <span class="shift-badge">Turni: ${availableShifts}/5</span>
      </div>
      <div class="employee-info">
        <div class="info-item">
          <i class="fas fa-phone"></i>
          <span>${employee.phone}</span>
        </div>
        <div class="info-item">
          <i class="fas fa-envelope"></i>
          <span>${employee.email}</span>
        </div>
      </div>
      <div class="employee-actions">
        <button class="action-btn edit-employee" data-id="${employee.id}">
          <i class="fas fa-pen"></i> Modifica
        </button>
        <button class="action-btn btn-credit-card view-payments" data-id="${employee.id}">
          <i class="fas fa-credit-card"></i> Pagamenti
        </button>
        <button class="action-btn btn-danger delete-employee" data-id="${employee.id}">
          <i class="fas fa-trash"></i> Elimina
        </button>
      </div>
    `;
    
    employeesList.appendChild(employeeCard);
    
    // Add event listeners
    employeeCard.querySelector('.edit-employee').addEventListener('click', () => openEditEmployeeModal(employee));
    employeeCard.querySelector('.delete-employee').addEventListener('click', () => deleteEmployee(employee.id));
    employeeCard.querySelector('.view-payments').addEventListener('click', () => openPaymentModal(employee));
  });
}

function renderCalendar() {
  // Update week display
  weekDisplay.textContent = `Settimana ${formatWeekRange(state.currentWeekDate)}`;
  
  // Get days of the current week
  const weekDates = getWeekDates(state.currentWeekDate);
  const weekId = getWeekId(state.currentWeekDate);
  
  // Clear table body
  const tableBody = shiftTable.querySelector('tbody');
  tableBody.innerHTML = '';
  
  // Create rows for each day
  weekDates.forEach((date, index) => {
    const dayNumber = index + 1; // 1-7 for Monday-Sunday
    const row = document.createElement('tr');
    
    // Day cell
    const dayCell = document.createElement('td');
    dayCell.innerHTML = `
      <div class="day-cell">
        ${DAYS_OF_WEEK[index]}
        <span class="day-date">${formatDateForCalendar(date)}</span>
      </div>
    `;
    row.appendChild(dayCell);
    
    // Shift cells (Morning, Afternoon, Night)
    Object.keys(SHIFT_TYPES).forEach(shiftType => {
      const cell = document.createElement('td');
      
      // Find if there's an assigned shift for this day and type
      const shift = state.shifts.find(s => 
        s.weekId === weekId && 
        s.day === dayNumber && 
        s.type === shiftType
      );
      
      const employee = shift ? state.employees.find(e => e.id === shift.employeeId) : null;
      
      let cellClass = `shift-cell ${shiftType}`;
      if (shift) {
        cellClass += ' assigned';
      }
      
      cell.innerHTML = `
        <div class="${cellClass}" data-day="${dayNumber}" data-type="${shiftType}">
          ${employee ? `
            <div class="shift-employee">${employee.name}</div>
            <div class="shift-time">${SHIFT_TYPES[shiftType]}</div>
          ` : `
            <div class="shift-empty">
              <i class="fas fa-plus-circle"></i>
              <div>Assegna ${SHIFT_TYPES[shiftType]}</div>
            </div>
          `}
        </div>
      `;
      
      row.appendChild(cell);
      
      // Add event listener to open shift assignment modal
      cell.querySelector('.shift-cell').addEventListener('click', () => {
        openShiftModal(dayNumber, shiftType, shift);
      });
    });
    
    tableBody.appendChild(row);
  });
}

function populateShiftEmployeeSelect() {
  shiftEmployeeSelect.innerHTML = '<option value="">Seleziona un dipendente</option>';
  
  // Get employees with available shifts for the current week
  const weekId = getWeekId(state.currentWeekDate);
  
  state.employees.forEach(employee => {
    // Count existing shifts for this employee in current week
    const shiftsCount = state.shifts.filter(shift => 
      shift.employeeId === employee.id && 
      shift.weekId === weekId
    ).length;
    
    // Only add employees with less than 5 shifts
    if (shiftsCount < 5 || (state.editingShift && state.editingShift.employeeId === employee.id)) {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = employee.name;
      
      if (state.editingShift && state.editingShift.employeeId === employee.id) {
        option.selected = true;
      }
      
      shiftEmployeeSelect.appendChild(option);
    }
  });
}

// Modal Functions
function openAddEmployeeModal() {
  state.editingEmployee = null;
  employeeModalTitle.textContent = 'Nuovo Dipendente';
  employeeForm.reset();
  employeeIdInput.value = '';
  openModal(employeeModal);
}

function openEditEmployeeModal(employee) {
  state.editingEmployee = employee;
  employeeModalTitle.textContent = 'Modifica Dipendente';
  employeeIdInput.value = employee.id;
  employeeNameInput.value = employee.name;
  employeePositionInput.value = employee.position;
  employeePhoneInput.value = employee.phone;
  employeeEmailInput.value = employee.email;
  openModal(employeeModal);
}

function openShiftModal(day, type, shift = null) {
  state.selectedDay = day;
  state.selectedShiftType = type;
  state.editingShift = shift;
  
  // Set form values
  shiftIdInput.value = shift ? shift.id : '';
  shiftDayInput.value = day;
  shiftTypeInput.value = type;
  
  // Update modal title and descriptions
  const dayName = DAYS_OF_WEEK[day - 1];
  const shiftName = SHIFT_TYPES[type];
  document.getElementById('shift-modal-title').textContent = shift ? 'Modifica Turno' : 'Assegna Turno';
  shiftDayDisplay.textContent = `Giorno: ${dayName}`;
  shiftTypeDisplay.textContent = `Turno: ${shiftName}`;
  
  // Populate employee select
  populateShiftEmployeeSelect();
  
  openModal(shiftModal);
}

function openPaymentModal(employee) {
  paymentModalTitle.textContent = `Pagamenti Mensili - ${employee.name}`;
  
  // Set current month/year in selectors
  const currentDate = new Date();
  paymentMonthSelect.value = currentDate.getMonth() + 1;
  paymentYearSelect.value = currentDate.getFullYear();
  
  // Show loading state
  paymentLoading.classList.remove('hidden');
  paymentEmpty.classList.add('hidden');
  paymentData.classList.add('hidden');
  
  // Calculate monthly data for the employee
  calculateMonthlyPayment(employee.id);
  
  // Add event listeners for month/year changes
  paymentMonthSelect.addEventListener('change', () => calculateMonthlyPayment(employee.id));
  paymentYearSelect.addEventListener('change', () => calculateMonthlyPayment(employee.id));
  
  openModal(paymentModal);
}

function calculateMonthlyPayment(employeeId) {
  const month = parseInt(paymentMonthSelect.value);
  const year = parseInt(paymentYearSelect.value);
  
  // Update period display
  paymentPeriodDisplay.textContent = `${MONTHS[month - 1]} ${year}`;
  
  // Show loading for a moment
  paymentLoading.classList.remove('hidden');
  paymentEmpty.classList.add('hidden');
  paymentData.classList.add('hidden');
  
  // Simulate API call with setTimeout
  setTimeout(() => {
    // Find shifts for this employee in the selected month
    const shifts = state.shifts.filter(shift => {
      // Extract date from the weekId and check if it falls in the selected month/year
      const [shiftYear, weekNum] = shift.weekId.split('-');
      
      // Basic approximation for demo purposes - not exact
      if (parseInt(shiftYear) === year) {
        const weekDate = new Date(year, 0, (weekNum - 1) * 7 + 1);
        const month = weekDate.getMonth() + 1;
        return shift.employeeId === employeeId && month === parseInt(paymentMonthSelect.value);
      }
      return false;
    });
    
    // If no shifts found
    if (shifts.length === 0) {
      paymentLoading.classList.add('hidden');
      paymentEmpty.classList.remove('hidden');
      return;
    }
    
    // Calculate counts and payments
    const counts = {
      morning: 0,
      afternoon: 0,
      night: 0,
      total: 0
    };
    
    const payments = {
      morning: 0,
      afternoon: 0,
      night: 0,
      total: 0
    };
    
    shifts.forEach(shift => {
      counts[shift.type]++;
      counts.total++;
      
      payments[shift.type] += SHIFT_RATES[shift.type];
      payments.total += SHIFT_RATES[shift.type];
    });
    
    // Update UI with the calculated data
    document.getElementById('count-morning').textContent = counts.morning;
    document.getElementById('count-afternoon').textContent = counts.afternoon;
    document.getElementById('count-night').textContent = counts.night;
    document.getElementById('count-total').textContent = counts.total;
    
    document.getElementById('pay-morning').textContent = formatCurrency(payments.morning);
    document.getElementById('pay-afternoon').textContent = formatCurrency(payments.afternoon);
    document.getElementById('pay-night').textContent = formatCurrency(payments.night);
    document.getElementById('pay-total').textContent = formatCurrency(payments.total);
    
    // Hide loading, show data
    paymentLoading.classList.add('hidden');
    paymentEmpty.classList.add('hidden');
    paymentData.classList.remove('hidden');
  }, 800);
}

function openModal(modal) {
  modal.classList.add('active');
  overlay.classList.add('active');
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => modal.classList.remove('active'));
  overlay.classList.remove('active');
}

// Data Operations
function saveEmployee() {
  const formData = {
    name: employeeNameInput.value,
    position: employeePositionInput.value,
    phone: employeePhoneInput.value,
    email: employeeEmailInput.value
  };
  
  if (state.editingEmployee) {
    // Update existing employee
    const employeeId = parseInt(employeeIdInput.value);
    const index = state.employees.findIndex(e => e.id === employeeId);
    
    if (index !== -1) {
      state.employees[index] = {
        ...state.employees[index],
        ...formData
      };
    }
  } else {
    // Create new employee
    const newId = state.employees.length > 0 
      ? Math.max(...state.employees.map(e => e.id)) + 1 
      : 1;
      
    state.employees.push({
      id: newId,
      ...formData
    });
  }
  
  // Close modal and update UI
  closeAllModals();
  updateUI();
}

function deleteEmployee(id) {
  if (confirm('Sei sicuro di voler eliminare questo dipendente?')) {
    // Remove employee
    state.employees = state.employees.filter(e => e.id !== id);
    
    // Remove all shifts assigned to this employee
    state.shifts = state.shifts.filter(s => s.employeeId !== id);
    
    // Update UI
    updateUI();
  }
}

function saveShift() {
  const employeeId = parseInt(shiftEmployeeSelect.value);
  const day = parseInt(shiftDayInput.value);
  const type = shiftTypeInput.value;
  const weekId = getWeekId(state.currentWeekDate);
  
  if (!employeeId) {
    alert('Seleziona un dipendente');
    return;
  }
  
  if (state.editingShift) {
    // Update existing shift
    const shiftId = parseInt(shiftIdInput.value);
    const index = state.shifts.findIndex(s => s.id === shiftId);
    
    if (index !== -1) {
      state.shifts[index] = {
        ...state.shifts[index],
        employeeId
      };
    }
  } else {
    // Check if a shift already exists for this day and type
    const existingShift = state.shifts.find(s => 
      s.weekId === weekId && 
      s.day === day && 
      s.type === type
    );
    
    if (existingShift) {
      // Update the existing shift instead of creating a new one
      existingShift.employeeId = employeeId;
    } else {
      // Create new shift
      const newId = state.shifts.length > 0 
        ? Math.max(...state.shifts.map(s => s.id)) + 1 
        : 1;
        
      state.shifts.push({
        id: newId,
        weekId,
        day,
        type,
        employeeId
      });
    }
  }
  
  // Close modal and update UI
  closeAllModals();
  updateUI();
}

// Navigation Functions
function changePage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(`${pageName}-page`).classList.add('active');
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add('active');
  
  // Update current page in state
  state.currentPage = pageName;
  
  // Update UI for the new page
  updateUI();
}

function goToPrevWeek() {
  const prevWeek = new Date(state.currentWeekDate);
  prevWeek.setDate(prevWeek.getDate() - 7);
  state.currentWeekDate = prevWeek;
  renderCalendar();
}

function goToNextWeek() {
  const nextWeek = new Date(state.currentWeekDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  state.currentWeekDate = nextWeek;
  renderCalendar();
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('expanded');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      changePage(item.dataset.page);
    });
  });
  
  // Week navigation
  document.getElementById('prev-week').addEventListener('click', goToPrevWeek);
  document.getElementById('next-week').addEventListener('click', goToNextWeek);
  
  // Employee actions
  document.getElementById('add-employee-btn').addEventListener('click', openAddEmployeeModal);
  document.getElementById('save-employee').addEventListener('click', saveEmployee);
  
  // Shift actions
  document.getElementById('save-shift').addEventListener('click', saveShift);
  
  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Close modal when clicking overlay
  overlay.addEventListener('click', closeAllModals);
  
  // Mobile menu
  document.getElementById('mobile-menu-toggle').addEventListener('click', toggleMobileMenu);
  
  // Initial data load (for demo purposes)
  loadDemoData();
  
  // Initialize UI
  updateUI();
});

// Demo Data
function loadDemoData() {
  // Demo employees
  state.employees = [
    {
      id: 1,
      name: 'Marco Rossi',
      position: 'Cameriere',
      phone: '+39 123 456 7890',
      email: 'marco.rossi@esempio.it'
    },
    {
      id: 2,
      name: 'Laura Bianchi',
      position: 'Chef',
      phone: '+39 234 567 8901',
      email: 'laura.bianchi@esempio.it'
    },
    {
      id: 3,
      name: 'Antonio Verdi',
      position: 'Operatore',
      phone: '+39 345 678 9012',
      email: 'antonio.verdi@esempio.it'
    },
    {
      id: 4,
      name: 'Giulia Neri',
      position: 'Receptionist',
      phone: '+39 456 789 0123',
      email: 'giulia.neri@esempio.it'
    }
  ];
  
  // Demo shifts
  const currentWeekId = getWeekId(state.currentWeekDate);
  state.shifts = [
    {
      id: 1,
      weekId: currentWeekId,
      day: 1, // Monday
      type: 'morning',
      employeeId: 1
    },
    {
      id: 2,
      weekId: currentWeekId,
      day: 1, // Monday
      type: 'afternoon',
      employeeId: 2
    },
    {
      id: 3,
      weekId: currentWeekId,
      day: 2, // Tuesday
      type: 'morning',
      employeeId: 3
    },
    {
      id: 4,
      weekId: currentWeekId,
      day: 3, // Wednesday
      type: 'night',
      employeeId: 4
    },
    {
      id: 5,
      weekId: currentWeekId,
      day: 5, // Friday
      type: 'afternoon',
      employeeId: 1
    }
  ];
}
