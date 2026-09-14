const loginPanel = document.getElementById('login-panel');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const appPanel = document.getElementById('app-panel');
const form = document.getElementById('grade-form');
const className = document.getElementById('class-name');
const grade = document.getElementById('grade');
const notes = document.getElementById('notes');
const includeInAverage = document.getElementById('include-in-average');
const heading = document.getElementById('form-heading');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const statusMessage = document.getElementById('status');
const tableBody = document.getElementById('grades-body');
let editingId = null;

const setLoggedIn = username => {
  document.getElementById('current-user').textContent = username;
  loginPanel.hidden = true;
  appPanel.hidden = false;
};

const setLoggedOut = message => {
  appPanel.hidden = true;
  loginPanel.hidden = false;
  loginStatus.textContent = message;
  loginStatus.className = message ? 'error' : '';
  loginForm.elements.username.focus();
};

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw Object.assign(new Error(body?.error || 'Request failed.'), {status: response.status});
  return body;
};

const resetForm = () => {
  form.reset();
  editingId = null;
  heading.textContent = 'Add a class';
  submitButton.textContent = 'Add class';
  cancelButton.hidden = true;
};

const renderGrades = rows => {
  const eligibleRows = rows.filter(row => row.includeInAverage);
  document.getElementById('average-grade').textContent = eligibleRows.length
      ? (eligibleRows.reduce((sum, row) => sum + row.grade, 0) / eligibleRows.length).toFixed(2)
      : '—';
  tableBody.replaceChildren();
  document.getElementById('empty-message').hidden = rows.length !== 0;

  rows.forEach(row => {
    const tr = document.createElement('tr');
    [row.className, row.grade, row.letterGrade, row.notes || '—', row.includeInAverage ? 'Yes' : 'No'].forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 3) cell.className = 'notes';
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
      notes.value = row.notes;
      includeInAverage.checked = row.includeInAverage;
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
  appPanel.querySelectorAll('input, textarea, button').forEach(control => control.disabled = true);
  statusMessage.textContent = 'Loading classes…';
  statusMessage.className = '';
  try {
    renderGrades(await requestJson(url, options));
    statusMessage.textContent = message;
    return true;
  } catch (error) {
    if (error.status === 401) {
      setLoggedOut('Your session ended. Please log in again.');
    } else {
      statusMessage.textContent = 'Could not update the display. ' + error.message;
      statusMessage.className = 'error';
    }
    return false;
  } finally {
    appPanel.querySelectorAll('input, textarea, button').forEach(control => control.disabled = false);
  }
};

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginForm.querySelectorAll('input, button').forEach(control => control.disabled = true);
  loginStatus.textContent = 'Logging in…';
  loginStatus.className = '';
  try {
    const result = await requestJson('/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value
      })
    });
    loginForm.reset();
    setLoggedIn(result.username);
    await requestGrades('/grades', {method: 'GET'}, result.created ? 'Account created. Add your first class.' : 'Classes loaded.');
  } catch (error) {
    loginStatus.textContent = error.message;
    loginStatus.className = 'error';
  } finally {
    loginForm.querySelectorAll('input, button').forEach(control => control.disabled = false);
  }
});

document.getElementById('logout-button').addEventListener('click', async () => {
  try {
    await requestJson('/auth/logout', {method: 'POST'});
    resetForm();
    tableBody.replaceChildren();
    setLoggedOut('');
  } catch (error) {
    if (error.status === 401) setLoggedOut('Your session ended. Please log in again.');
    else {
      statusMessage.textContent = error.message;
      statusMessage.className = 'error';
    }
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const saved = await requestGrades(editingId === null ? '/grades' : '/grades/' + editingId, {
    method: editingId === null ? 'POST' : 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      className: className.value.trim(),
      grade: grade.valueAsNumber,
      notes: notes.value,
      includeInAverage: includeInAverage.checked
    })
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

requestJson('/auth/me').then(async ({username}) => {
  setLoggedIn(username);
  await requestGrades('/grades', {method: 'GET'}, 'Classes loaded.');
}).catch(error => setLoggedOut(error.status === 401 ? '' : 'Could not connect to the server.'));
