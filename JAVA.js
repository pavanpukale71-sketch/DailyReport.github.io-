(() => {
  // Hardcoded credentials for demo
  const VALID_CREDENTIALS = [
    { username: 'admin', password: 'password' },
    { username: 'Gotya', password: '7154' }
  ];

  // Sign-up credentials stored in localStorage
  let SIGNUP_CREDENTIALS = JSON.parse(localStorage.getItem('pavanSevaSignupCredentials')) || [];

  // Hardcoded Captain Names, sorted alphabetically
  const CAPTAIN_NAMES = [
    "chavan", "Jaya howale", "mahesh khapre", "Maruti kale", "pavan lokhande",
    "parshu padnekar", "samir howle", "Sambhaji kamble", "Vaibhav godse", "vinod gavas"
  ].sort();

  // Hardcoded Hall Names, sorted alphabetically, with special handling for "Outdoor"
  const HALL_NAMES = [
    "Main hall", "AC hall", "Conference hall", "Big garden", "small garden",
    "Table", "Priti Hotel", " Outdoor"
  ].sort();

  const loginSection = document.getElementById('loginSection');
  const signupSection = document.getElementById('signupSection');
  const appSection = document.getElementById('appSection');

  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginUsernameInput = document.getElementById('loginUsername');
  const loginPasswordInput = document.getElementById('loginPassword');

  const signupForm = document.getElementById('signupForm');
  const signupError = document.getElementById('signupError');
  const signupUsernameInput = document.getElementById('signupUsername');
  const signupPasswordInput = document.getElementById('signupPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const logoutBtn = document.getElementById('logoutBtn');

  // Calculator elements
  const calculatorBtn = document.getElementById('calculatorBtn');
  const calculatorModal = document.getElementById('calculatorModal');
  const closeCalc = document.getElementById('closeCalc');
  const calcDisplay = document.getElementById('calcDisplay');
  const calcButtons = document.querySelectorAll('.calc-btn');
  const useInAdvance = document.getElementById('useInAdvance');
  const useInDue = document.getElementById('useInDue');

  // Elements for app
  const form = document.getElementById('entryForm');
  const tableBody = document.getElementById('tableBody');
  const totalDayCell = document.getElementById('totalDay');
  const totalAdvanceCell = document.getElementById('totalAdvance');
  const totalDueCell = document.getElementById('totalDue');

  const advanceInput = document.getElementById('advance');
  const dueInput = document.getElementById('due');
  const dateInput = document.getElementById('date');
  const nameInput = document.getElementById('name');
  const captainNameSelect = document.getElementById('captainName');
  const hallSelect = document.getElementById('hall');

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const recycleBtn = document.getElementById('recycleBtn');
  const monthSelector = document.getElementById('monthSelector');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  // Entries data
  let entries = [];
  let filteredEntries = [];

  // Last deleted entry for recycle (scoped to the current month's data)
  let lastDeletedEntry = null;
  let lastDeletedIndex = null;

  // Calculator state
  let currentOperand = '0';
  let previousOperand = '';
  let operation = null;
  let shouldResetScreen = false;

  // Helper to get the localStorage key for a given date or the current month
  function getMonthStorageKey(dateString = null) {
    let date;
    if (dateString) {
      date = new Date(dateString);
    } else {
      date = new Date();
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `pavanSevaEntries_${year}-${month}`;
  }

  // Load entries for the currently selected month
  function loadEntriesForSelectedMonth() {
    const selectedMonth = monthSelector.value;
    const storageKey = getMonthStorageKey(selectedMonth + '-01');
    entries = JSON.parse(localStorage.getItem(storageKey)) || [];
    // Sort entries by date to ensure rowspan works correctly
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    filteredEntries = [...entries];
    renderTable();
  }

  // Check if user is logged in (simple flag in sessionStorage)
  function isLoggedIn() {
    return sessionStorage.getItem('pavanSevaLoggedIn') === 'true';
  }

  // Populate Captain Name dropdown
  function populateCaptainNames() {
    captainNameSelect.innerHTML = '<option value="" disabled selected>Select Captain</option>';
    CAPTAIN_NAMES.forEach(captain => {
      const option = document.createElement('option');
      option.value = captain;
      option.textContent = captain;
      captainNameSelect.appendChild(option);
    });
  }

  // Populate Hall dropdown
  function populateHallNames() {
    hallSelect.innerHTML = '<option value="" disabled selected>Select Hall</option>';
    HALL_NAMES.forEach(hall => {
      const option = document.createElement('option');
      option.value = hall;
      option.textContent = hall;
      hallSelect.appendChild(option);
    });
  }

  // Show login, signup, or app based on login state and current form
  function updateView(showForm = 'login') {
    if (isLoggedIn()) {
      loginSection.classList.add('hidden');
      signupSection.classList.add('hidden');
      appSection.classList.remove('hidden');
      // Set month selector to current month by default
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      monthSelector.value = currentMonth;
      dateInput.value = today.toISOString().split('T')[0]; // Set default date to today
      populateCaptainNames();
      populateHallNames();
      loadEntriesForSelectedMonth();
    } else {
      appSection.classList.add('hidden');
      if (showForm === 'login') {
        loginSection.classList.remove('hidden');
        signupSection.classList.add('hidden');
        loginError.classList.add('hidden');
        loginForm.reset();
      } else if (showForm === 'signup') {
        signupSection.classList.remove('hidden');
        loginSection.classList.add('hidden');
        signupError.classList.add('hidden');
        signupForm.reset();
      }
    }
  }

  // Calculator functions
  function openCalculator() {
    calculatorModal.classList.remove('hidden');
    resetCalculator();
  }

  function closeCalculator() {
    calculatorModal.classList.add('hidden');
  }

  function resetCalculator() {
    currentOperand = '0';
    previousOperand = '';
    operation = null;
    shouldResetScreen = false;
    updateCalcDisplay();
  }

  function appendNumber(number) {
    if (shouldResetScreen) {
      currentOperand = '';
      shouldResetScreen = false;
    }

    if (number === '.' && currentOperand.includes('.')) return;
    if (currentOperand === '0' && number !== '.') {
      currentOperand = number;
    } else {
      currentOperand += number;
    }
    updateCalcDisplay();
  }

  function chooseOperation(op) {
    if (currentOperand === '') return;

    if (previousOperand !== '') {
      compute();
    }

    operation = op;
    previousOperand = currentOperand;
    shouldResetScreen = true;
  }

  function compute() {
    let computation;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '*':
        computation = prev * current;
        break;
      case '/':
        computation = prev / current;
        break;
      default:
        return;
    }

    currentOperand = computation.toString();
    operation = null;
    previousOperand = '';
    shouldResetScreen = true;
    updateCalcDisplay();
  }

  function deleteNumber() {
    if (currentOperand.length === 1) {
      currentOperand = '0';
    } else {
      currentOperand = currentOperand.slice(0, -1);
    }
    updateCalcDisplay();
  }

  function updateCalcDisplay() {
    calcDisplay.value = currentOperand;
  }

  function useResultInField(field) {
    const result = parseFloat(currentOperand);
    if (!isNaN(result)) {
      field.value = result.toFixed(2);
      closeCalculator();
    }
  }

  // Calculator event listeners
  calculatorBtn.addEventListener('click', openCalculator);
  closeCalc.addEventListener('click', closeCalculator);

  calcButtons.forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-value');

      if (value === 'clear') {
        resetCalculator();
      } else if (value === 'backspace') {
        deleteNumber();
      } else if (value === '=') {
        compute();
      } else if (['+', '-', '*', '/'].includes(value)) {
        chooseOperation(value);
      } else if (value === '.') {
        appendNumber(value);
      } else {
        appendNumber(value);
      }
    });
  });

  useInAdvance.addEventListener('click', () => useResultInField(advanceInput));
  useInDue.addEventListener('click', () => useResultInField(dueInput));

  // Close calculator when clicking outside
  calculatorModal.addEventListener('click', (e) => {
    if (e.target === calculatorModal) {
      closeCalculator();
    }
  });

  // Login form submit handler
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    const validUser  = VALID_CREDENTIALS.some(
      cred => cred.username === username && cred.password === password
    ) || SIGNUP_CREDENTIALS.some(
      cred => cred.username === username && cred.password === password
    );

    if (validUser ) {
      sessionStorage.setItem('pavanSevaLoggedIn', 'true');
      updateView();
    } else {
      loginError.classList.remove('hidden');
    }
  });

  // Sign-up form submit handler
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
      signupError.textContent = 'Passwords do not match.';
      signupError.classList.remove('hidden');
      return;
    }

    if (VALID_CREDENTIALS.some(cred => cred.username === username) ||
        SIGNUP_CREDENTIALS.some(cred => cred.username === username)) {
      signupError.textContent = 'Username already taken.';
      signupError.classList.remove('hidden');
      return;
    }

    SIGNUP_CREDENTIALS.push({ username, password });
    localStorage.setItem('pavanSevaSignupCredentials', JSON.stringify(SIGNUP_CREDENTIALS));
    alert('Registration successful! Please log in.');
    updateView('login'); // Go back to login page
  });

  // Toggle between login and signup forms
  showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    updateView('signup');
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    updateView('login');
  });

  // Logout button handler
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('pavanSevaLoggedIn');
    updateView('login');
  });

  // Render table rows
  function renderTable() {
    tableBody.innerHTML = '';

    // Pre-process filteredEntries to determine rowspan for the Date column
    const processedEntries = [];
    for (let i = 0; i < filteredEntries.length; i++) {
        const currentEntry = filteredEntries[i];
        let rowspan = 1;
        // Count how many consecutive entries have the same date
        for (let j = i + 1; j < filteredEntries.length; j++) {
            if (filteredEntries[j].date === currentEntry.date) {
                rowspan++;
            } else {
                break;
            }
        }
        processedEntries.push({ ...currentEntry, rowspan: rowspan, isFirstInGroup: true });
        // Mark subsequent entries in the group as not the first, so their date cell is skipped
        for (let k = 1; k < rowspan; k++) {
            processedEntries.push({ ...filteredEntries[i + k], isFirstInGroup: false });
        }
        i += rowspan - 1; // Skip ahead to the last entry of this group
    }

    processedEntries.forEach((entry, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-indigo-50';

      const formattedDate = new Date(entry.date).toLocaleDateString('en-GB');

      let dateCellHtml = '';
      if (entry.isFirstInGroup) {
          dateCellHtml = `<td class="border border-gray-300 px-3 py-2 text-center" rowspan="${entry.rowspan}">${formattedDate}</td>`;
      }

      tr.innerHTML = `
        <td class="border border-gray-300 px-3 py-2 text-center">${index + 1}</td>
        ${dateCellHtml}
        <td class="border border-gray-300 px-3 py-2">${entry.name}</td>
        <td class="border border-gray-300 px-3 py-2 text-center">${entry.shift}</td>
        <td class="border border-gray-300 px-3 py-2 text-center">${entry.day}</td>
        <td class="border border-gray-300 px-3 py-2 text-left">${entry.captainName || ''}</td>
        <td class="border border-gray-300 px-3 py-2 text-left">${entry.hall || ''}</td>
        <td class="border border-gray-300 px-3 py-2 text-center">${parseFloat(entry.advance).toFixed(2)}</td>
        <td class="border border-gray-300 px-3 py-2 text-center">${parseFloat(entry.due).toFixed(2)}</td>
        <td class="border border-gray-300 px-3 py-2 text-center space-x-2 flex flex-wrap justify-center items-center gap-1">
          <button class="edit-btn text-indigo-600 hover:text-indigo-900 font-semibold text-rgb-hover" data-index="${index}" aria-label="Edit entry ${index + 1}">Edit</button>
          <button class="delete-btn text-red-600 hover:text-red-900 font-semibold text-rgb-hover" data-index="${index}" aria-label="Delete entry ${index + 1}">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    updateTotals();
  }

  // Update totals for day, advance, and due based on filtered entries
  function updateTotals() {
    const totalDay = filteredEntries.reduce((sum, e) => sum + parseFloat(e.day), 0);
    const totalAdvance = filteredEntries.reduce((sum, e) => sum + parseFloat(e.advance), 0);
    const totalDue = filteredEntries.reduce((sum, e) => sum + parseFloat(e.due), 0);

    totalDayCell.textContent = totalDay.toFixed(1);
    totalAdvanceCell.textContent = totalAdvance.toFixed(2);
    totalDueCell.textContent = totalDue.toFixed(2);
  }

  // Save entries to localStorage for the current month
  function saveEntries() {
    const storageKey = getMonthStorageKey(monthSelector.value + '-01');
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }

  // Clear form inputs
  function clearForm() {
    form.reset();
    nameInput.value = '';
    form.shift.selectedIndex = 0;
    form.day.selectedIndex = 0;
    captainNameSelect.selectedIndex = 0;
    hallSelect.selectedIndex = 0;
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Add or edit entry
  form.addEventListener('submit', e => {
    e.preventDefault();
    const addButton = form.querySelector('button[type="submit"]');
    const entryDate = new Date(form.date.value);
    const dayOfMonth = entryDate.getDate();

    if (dayOfMonth < 1 || dayOfMonth > 30) {
      alert('Entries can only be saved for days between the 1st and 30th of the month.');
      return;
    }

    const selectedMonth = monthSelector.value;
    const entryMonth = form.date.value.substring(0, 7);
    if (selectedMonth !== entryMonth) {
        alert(`The entry date (${form.date.value}) must be within the currently selected month (${selectedMonth}).`);
        return;
    }

    const names = nameInput.value.split(',').map(name => name.trim()).filter(name => name !== '');

    if (names.length === 0) {
        alert('Please enter at least one name.');
        return;
    }

    if (addButton.dataset.editIndex !== undefined) {
      const idx = +addButton.dataset.editIndex;
      entries[idx] = {
        date: form.date.value,
        name: names[0],
        shift: form.shift.value,
        day: form.day.value,
        captainName: captainNameSelect.value,
        hall: hallSelect.value,
        advance: form.advance.value.trim() === "" ? "0" : form.advance.value,
        due: form.due.value.trim() === "" ? "0" : form.due.value,
      };
      addButton.textContent = 'Add Entry';
      delete addButton.dataset.editIndex;
    } else {
      names.forEach(singleName => {
        const newEntry = {
          date: form.date.value,
          name: singleName,
          shift: form.shift.value,
          day: form.day.value,
          captainName: captainNameSelect.value,
          hall: hallSelect.value,
          advance: form.advance.value.trim() === "" ? "0" : form.advance.value,
          due: form.due.value.trim() === "" ? "0" : form.due.value,
        };
        entries.push(newEntry);
      });
    }

    saveEntries();
    loadEntriesForSelectedMonth(); // Re-load and re-render to ensure sorting and rowspan are applied
    clearForm();
  });

  // Handle edit, delete buttons using event delegation
  tableBody.addEventListener('click', e => {
    if (e.target.classList.contains('delete-btn')) {
      const idx = +e.target.dataset.index;
      if (confirm(`Delete entry #${idx + 1}?`)) {
        const entryToDelete = filteredEntries[idx];
        const originalIndex = entries.findIndex(en => en === entryToDelete);
        if (originalIndex > -1) {
          lastDeletedEntry = entries[originalIndex];
          lastDeletedIndex = originalIndex;

          entries.splice(originalIndex, 1);
          saveEntries();
          loadEntriesForSelectedMonth();
        }
      }
    } else if (e.target.classList.contains('edit-btn')) {
      const idx = +e.target.dataset.index;
      const entry = filteredEntries[idx];

      form.date.value = entry.date;
      nameInput.value = entry.name;
      form.shift.value = entry.shift;
      form.day.value = entry.day;
      captainNameSelect.value = entry.captainName || '';
      hallSelect.value = entry.hall || '';
      form.advance.value = entry.advance;
      form.due.value = entry.due;

      const addButton = form.querySelector('button[type="submit"]');
      addButton.textContent = 'Save';

      const originalIndex = entries.findIndex(en => en === entry);
      addButton.dataset.editIndex = originalIndex;

      form.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Search function
  function searchEntries() {
    const query = searchInput.value.trim().toLowerCase();
    if (query === '') {
      filteredEntries = [...entries];
    } else {
      filteredEntries = entries.filter(e =>
        e.name.toLowerCase().includes(query) ||
        (e.captainName && e.captainName.toLowerCase().includes(query)) ||
        (e.hall && e.hall.toLowerCase().includes(query.trim()))
      );
    }
    renderTable();
  }

  // Search button click
  searchBtn.addEventListener('click', () => {
    searchEntries();
  });

  // Clear search button click
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    filteredEntries = [...entries];
    renderTable();
  });

  // Optional: search on Enter key in search input
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchEntries();
    }
  });

  // Recycle button click - restores last deleted entry
  recycleBtn.addEventListener('click', () => {
    if (lastDeletedEntry !== null && lastDeletedIndex !== null) {
      entries.splice(lastDeletedIndex, 0, lastDeletedEntry);
      saveEntries();
      loadEntriesForSelectedMonth();

      lastDeletedEntry = null;
      lastDeletedIndex = null;
    } else {
      alert('No entry to recycle.');
    }
  });

  // Month selector change event
  monthSelector.addEventListener('change', () => {
    loadEntriesForSelectedMonth();
    searchInput.value = '';
  });

  // Export to PDF functionality
  exportPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const selectedMonthText = monthSelector.value;
    doc.setFontSize(18);
    doc.text(`Pavan Seva - Monthly Report (${selectedMonthText})`, 14, 22);

    const headers = [
      "Sr.No", "Date", "Name", "Shift", "Day", "Captain Name", "Hall", "Advance", "Due"
    ];

    let pdfData = [];

    // Pre-process filteredEntries for PDF to determine rowspan for the Date column
    const pdfProcessedEntries = [];
    for (let i = 0; i < filteredEntries.length; i++) {
        const currentEntry = filteredEntries[i];
        let rowspan = 1;
        for (let j = i + 1; j < filteredEntries.length; j++) {
            if (filteredEntries[j].date === currentEntry.date) {
                rowspan++;
            } else {
                break;
            }
        }
        pdfProcessedEntries.push({ ...currentEntry, rowspan: rowspan, isFirstInGroup: true });
        for (let k = 1; k < rowspan; k++) {
            pdfProcessedEntries.push({ ...filteredEntries[i + k], isFirstInGroup: false });
        }
        i += rowspan - 1;
    }

    pdfProcessedEntries.forEach((entry, index) => {
        const formattedDate = new Date(entry.date).toLocaleDateString('en-GB');
        const displayDate = entry.isFirstInGroup ? formattedDate : '';

        pdfData.push([
            index + 1,
            displayDate,
            entry.name,
            entry.shift,
            entry.day,
            entry.captainName || '',
            entry.hall || '',
            parseFloat(entry.advance).toFixed(2),
            parseFloat(entry.due).toFixed(2)
        ]);
    });

    const totalDay = filteredEntries.reduce((sum, e) => sum + parseFloat(e.day), 0).toFixed(1);
    const totalAdvance = filteredEntries.reduce((sum, e) => sum + parseFloat(e.advance), 0).toFixed(2);
    const totalDue = filteredEntries.reduce((sum, e) => sum + parseFloat(e.due), 0).toFixed(2);

    const totalsRow = ["", "", "", "", "", "", "Total:", totalDay, totalAdvance, totalDue];
    pdfData.push(totalsRow);

    doc.autoTable({
      startY: 30,
      head: [headers],
      body: pdfData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        halign: 'center'
      },
      headStyles: {
        fillColor: [237, 242, 255],
        textColor: [79, 70, 229],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'left', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'left', cellWidth: 25 },
        6: { halign: 'left', cellWidth: 25 },
        7: { halign: 'center', cellWidth: 20 },
        8: { halign: 'center', cellWidth: 20 }
      },
      didParseCell: function (data) {
        if (data.column.index === 1 && data.row.section === 'body') {
            const originalEntryIndex = data.row.index;
            if (originalEntryIndex < pdfProcessedEntries.length) {
                const entry = pdfProcessedEntries[originalEntryIndex];
                if (entry.isFirstInGroup && entry.rowspan > 1) {
                    data.cell.rowSpan = entry.rowspan;
                } else if (!entry.isFirstInGroup) {
                    data.cell.text = [''];
                }
            }
        }

        if (data.row.index === pdfData.length - 1 && data.column.index === 6) {
            data.cell.styles.halign = 'right';
        }
        if (data.row.index === pdfData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [237, 242, 255];
            data.cell.styles.textColor = [79, 70, 229];
        }
      }
    });

    doc.save(`Pavan_Seva_Report_${selectedMonthText}.pdf`);
  });

  // Initialize view on page load
  updateView('login'); // Start on the login page
})();
