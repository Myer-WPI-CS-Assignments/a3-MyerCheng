const form = document.getElementById('grade-form');
const className = document.getElementById('class-name');
const grade = document.getElementById('grade');
const heading = document.getElementById('form-heading');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const statusMessage = document.getElementById('status');
const tableBody = document.getElementById('grades-body');
let editingId = null;

const resetForm = () => {
  form.reset();
  editingId = null;
  heading.textContent = 'Add a class';
  submitButton.textContent = 'Add class';
  cancelButton.hidden = true;
};

const renderGrades = (rows) => {
  const eligibleRows = rows.filter(row => row.letterGrade !== 'NR');
  document.getElementById('average-grade').textContent = eligibleRows.length
      ? (eligibleRows.reduce((sum, row) => sum + row.grade, 0) / eligibleRows.length).toFixed(2)
      : '—';
  tableBody.replaceChildren();
  document.getElementById('empty-message').hidden = rows.length !== 0;

  rows.forEach(row => {
    const tr = document.createElement('tr');
    [row.className, row.grade, row.letterGrade].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      tr.append(cell);
    });

    const actions = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.setAttribute('aria-label', 'Edit ' + row.className);
    editButton.addEventListener('click', () => {
      editingId = row.id;
      className.value = row.className;
      grade.value = row.grade;
      heading.textContent = 'Edit a class';
      submitButton.textContent = 'Save';
      cancelButton.hidden = false;
      className.focus();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', 'Delete ' + row.className);
    deleteButton.addEventListener('click', async () => {
      const saved = await requestGrades('/grades/' + row.id, {method: 'DELETE'}, 'Class deleted.');
      if (saved && editingId === row.id) resetForm();
      if (saved) className.focus();
    });

    actions.append(editButton, deleteButton);
    tr.append(actions);
    tableBody.append(tr);
  });
};

const requestGrades = async (url, options, message) => {
  document.querySelectorAll('input, button').forEach(control => control.disabled = true);
  statusMessage.textContent = 'Loading classes…';
  statusMessage.className = '';
  try {
    const response = await fetch(url, options);
    const rows = await response.json();
    if (!response.ok) throw new Error(rows.error);
    renderGrades(rows);
    statusMessage.textContent = message;
    return true;
  } catch (error) {
    statusMessage.textContent = 'Could not update the display. ' + error.message + ' Reload to fetch the current server data.';
    statusMessage.className = 'error';
    return false;
  } finally {
    document.querySelectorAll('input, button').forEach(control => control.disabled = false);
  }
};

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!className.value.trim()) {
    statusMessage.textContent = 'Enter a class name.';
    statusMessage.className = 'error';
    className.focus();
    return;
  }

  const saved = await requestGrades(editingId === null ? '/grades' : '/grades/' + editingId, {
    method: editingId === null ? 'POST' : 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({className: className.value.trim(), grade: grade.valueAsNumber})
  }, editingId === null ? 'Class added.' : 'Class updated.');
  if (saved) {
    resetForm();
    className.focus();
  }
});

cancelButton.addEventListener('click', () => {
  resetForm();
  className.focus();
});

requestGrades('/grades', {method: 'GET'}, 'Classes loaded.');
