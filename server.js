const fs = require('fs');
const http = require('http');
const path = require('path');

let grades = [];
let nextId = 1;

function calculateLetterGrade(grade) {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  return 'NR';
}

async function readBody(request) {
  let body = '';

  for await (const chunk of request) {
    body += chunk;
  }

  return JSON.parse(body);
}

function sendGrades(response) {
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(grades));
}

function sendFile(response, filename, contentType) {
  fs.readFile(path.join(__dirname, 'public', filename), (error, file) => {
    response.setHeader('Content-Type', contentType);
    response.end(file);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/') {
    sendFile(response, 'index.html', 'text/html');
  } else if (request.method === 'GET' && request.url === '/css/main.css') {
    sendFile(response, 'css/main.css', 'text/css');
  } else if (request.method === 'GET' && request.url === '/js/main.js') {
    sendFile(response, 'js/main.js', 'text/javascript');
  } else if (request.method === 'GET' && request.url === '/grades') {
    sendGrades(response);
  } else if (request.method === 'POST' && request.url === '/grades') {
    const grade = await readBody(request);
    grade.id = nextId++;
    grade.letterGrade = calculateLetterGrade(grade.grade);
    grades.push(grade);
    sendGrades(response);
  } else if (request.method === 'PUT' && request.url.startsWith('/grades/')) {
    const id = Number(request.url.split('/')[2]);
    const index = grades.findIndex(grade => grade.id === id);
    const grade = await readBody(request);
    grade.id = id;
    grade.letterGrade = calculateLetterGrade(grade.grade);
    grades[index] = grade;
    sendGrades(response);
  } else if (request.method === 'DELETE' && request.url.startsWith('/grades/')) {
    const id = Number(request.url.split('/')[2]);
    grades = grades.filter(grade => grade.id !== id);
    sendGrades(response);
  } else {
    response.statusCode = 404;
    response.end();
  }
});

server.listen(process.env.PORT || 3000);
