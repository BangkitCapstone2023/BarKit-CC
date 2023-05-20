const express = require('express');
const app = express();
const port = 8080;

const { db } = require('./app/config/configFirebase');
const authRouter = require('./app/routes/authRoute');
const lessorRouter = require('./app/routes/lessorRoute');
const generalRouter = require('./app/routes/generalRoute');
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use(lessorRouter);
app.use(generalRouter);

app.listen(port, () => {
  console.log(`BarKit App listening on port ${port}`);
});
