const express = require('express');
const app = express();
const port = 8080;

const initializeApp = require('./app/config/configFirebase');
const registerRoute = require('./app/routes/registerRoute');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(registerRoute);

initializeApp();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
