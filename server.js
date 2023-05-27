import express from 'express';
import authRouter from './app/routes/authRoute.js';
import lessorRouter from './app/routes/lessorRoute.js';
import generalRouter from './app/routes/generalRoute.js';
import renterRouter from './app/routes/renterRoute.js';

const app = express();
const port = 8080;

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use(generalRouter);
app.use(renterRouter);
app.use(lessorRouter);

console.log('tes');

app.listen(port, () => {
  console.log(`BarKit App listening on port ${port}`);
});
