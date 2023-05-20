const express = require('express');
const app = express();
const port = 8080;

const { db } = require('./app/config/configFirebase');
const authRouter = require('./app/routes/authRoute');
const generalRouter = require('./app/routes/generalRoute');
const renterRouter = require('./app/routes/renterRoute');

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use(generalRouter);
app.use(renterRouter);

app.listen(port, () => {
  console.log(`BarKit App listening on port ${port}`);
});
