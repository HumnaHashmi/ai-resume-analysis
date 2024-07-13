require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

const analyzeRoutes = require('./routes/analyze');
app.use('/', analyzeRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
