import express from 'express';
import authRouter from './app/routes/authRoute.js';
import lessorRouter from './app/routes/lessorRoute.js';
import generalRouter from './app/routes/generalRoute.js';
import renterRouter from './app/routes/renterRoute.js';

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use(generalRouter);
app.use(renterRouter);
app.use(lessorRouter);

app.listen(port, () => {
  console.log(`BarKit App listening on port ${port}`);
});
