const express = require('express');

const app = express();
let grades = [];
let nextId = 1;

const makeGrade = (grade, id) => ({
  ...grade,
  id,
  letterGrade: grade.grade >= 90 ? 'A' : grade.grade >= 80 ? 'B' : grade.grade >= 70 ? 'C' : 'NR'
});

app.use(express.json());
app.use(express.static('public'));

app.get('/grades', (request, response) => response.json(grades));

app.post('/grades', (request, response) => {
  grades.push(makeGrade(request.body, nextId++));
  response.json(grades);
});

app.put('/grades/:id', (request, response) => {
  const id = Number(request.params.id);
  grades[grades.findIndex(grade => grade.id === id)] = makeGrade(request.body, id);
  response.json(grades);
});

app.delete('/grades/:id', (request, response) => {
  grades = grades.filter(grade => grade.id !== Number(request.params.id));
  response.json(grades);
});

app.listen(process.env.PORT || 3000);
