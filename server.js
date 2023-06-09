import express from 'express';
import authRouter from './app/routes/auth.routes.js';
import lessorRouter from './app/routes/lessor.routes.js';
import adminRouter from './app/routes/admin.routes.js';
import generalRouter from './app/routes/general.routes.js';
import renterRouter from './app/routes/renter.routes.js';

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use(generalRouter);
app.use(renterRouter);
app.use(lessorRouter);
app.use(adminRouter);

app.listen(port, () => {
  console.log(`BarKit App listening on port ${port}`);
});
