const express = require('express');
const path = require('path');

const app = express();
const appdata = [];
let nextId = 1;

const parseJson = express.json({limit: '16kb'});

const calculateLetterGrade = (grade) => {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  return 'NR';
};

const validateGrade = (request, response, next) => {
  const data = request.body;
  if (!data || typeof data.className !== 'string' || !data.className.trim() ||
      !Number.isFinite(data.grade) || data.grade < 0 || data.grade > 100) {
    return response.status(400).json({
      error: 'Enter a class name and a numerical grade from 0 to 100.'
    });
  }

  response.locals.row = {
    className: data.className.trim(),
    grade: data.grade,
    letterGrade: calculateLetterGrade(data.grade)
  };
  next();
};

app.use('/grades', (request, response, next) => {
  response.set('Cache-Control', 'no-store');
  next();
});

app.param('id', (request, response, next, id) => {
  if (!/^[1-9]\d*$/.test(id)) {
    return response.status(404).json({error: 'Not found.'});
  }
  next();
});

app.route('/grades')
    .get((request, response) => {
      response.json(appdata);
    })
    .post(parseJson, validateGrade, (request, response) => {
      appdata.push({id: nextId++, ...response.locals.row});
      response.status(201).json(appdata);
    })
    .all((request, response) => {
      response.set('Allow', 'GET, HEAD, POST');
      response.status(405).json({error: 'Method not allowed.'});
    });

app.route('/grades/:id')
    .put(parseJson, validateGrade, (request, response) => {
      const index = appdata.findIndex(row => String(row.id) === request.params.id);
      if (index === -1) {
        return response.status(404).json({error: 'Class record not found.'});
      }
      appdata[index] = {id: appdata[index].id, ...response.locals.row};
      response.json(appdata);
    })
    .delete((request, response) => {
      const index = appdata.findIndex(row => String(row.id) === request.params.id);
      if (index === -1) {
        return response.status(404).json({error: 'Class record not found.'});
      }
      appdata.splice(index, 1);
      response.json(appdata);
    })
    .all((request, response) => {
      response.set('Allow', 'PUT, DELETE');
      response.status(405).json({error: 'Method not allowed.'});
    });

app.use(express.static(path.join(__dirname, 'public')));

app.use((request, response) => {
  response.set('Cache-Control', 'no-store');
  response.status(404).json({error: 'Not found.'});
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);

  const messages = {
    400: 'Unable to read the request.',
    403: 'Forbidden.',
    404: 'Not found.',
    413: 'Request is too large.',
    415: 'Unsupported request encoding.'
  };
  const status = Object.hasOwn(messages, error.status) ? error.status : 500;
  if (status === 500) console.error(error);
  const message = error.type === 'entity.parse.failed' ? 'Invalid JSON.' :
      messages[status] || 'Internal server error.';
  response.set('Cache-Control', 'no-store');
  response.status(status).json({error: message});
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000);
}

module.exports = app;
