const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5040;

app.use(express.json());
app.use(cors());

const configureDB = require('./config/db');
configureDB();

const userCtlr = require('./app/controllers/user-controller.js');
const pgCltr = require('./app/controllers/pg-controller.js');
const bookingCltr = require('./app/controllers/booking-controller.js');
const ratingCltr = require('./app/controllers/rating-controller.js');
const paymentCltr = require('./app/controllers/payment-controller.js');

const authenticateUser = require('./app/middlewares/authenticateUser.js');
const authorization = require('./app/middlewares/authorizeUser.js');
const { upload } = require('./app/middlewares/cloudinary.js');

app.post('/user/register', userCtlr.register);
app.post('/user/login', userCtlr.login);
app.get('/user/account', authenticateUser, userCtlr.account);


app.get('/user/allusers', authenticateUser, authorization(['admin', 'owner']), userCtlr.allusers);
app.put('/user/update/:id', authenticateUser, userCtlr.updateAccount);
app.delete('/user/remove/:id',authenticateUser, authorization(['admin']), userCtlr.deleteAccount);

app.post(
    '/pg/createpg', 
    authenticateUser, 
    authorization(['owner']), 
    upload.fields([
        { name: 'pgPhotos', maxCount : 5 }, 
        { name: 'pgCertificate', maxCount : 1 }
    ]), 
    pgCltr.createPg);
app.get('/get/allpgs', authenticateUser, authorization(['admin', 'owner']), pgCltr.getAllPgs);
app.get('/get/pgById/:id', authenticateUser, authorization(['admin', 'owner']), pgCltr.getPgById);
app.get('/get/pglists', authenticateUser, pgCltr.getPgLists);
app.put(
  '/update/pg/:id',
  authenticateUser,
  authorization(['admin', 'owner']),
  upload.fields([
    { name: 'pgPhotos', maxCount: 5 },
    { name: 'pgCertificate', maxCount: 1 }
  ]),
  pgCltr.updatePg
);
app.put('/verify/:id', authenticateUser, authorization(['admin']), pgCltr.verifyC);
app.put('/approvePg/:id', authenticateUser, authorization(['admin']), pgCltr.approvePg);
app.delete('/delete/pg/:id', authenticateUser, authorization(['admin']), pgCltr.deletePg);
app.get('/pgs/nearby', authenticateUser, authorization(['user']), pgCltr.getNearbyPgs);

app.post('/create/booking', authenticateUser, authorization(['user']), bookingCltr.createBooking);
app.put('/confirm/:id', authenticateUser, authorization(['owner']), bookingCltr.confirmBooking);
app.put('/cancel/:id', authenticateUser, authorization(['owner', 'user']), bookingCltr.cancelBooking);
app.get('/getAll/bookings', authenticateUser,authorization(['admin']), bookingCltr.getAllBookings);
app.get('/getuser/bookings', authenticateUser, authorization(['user']), bookingCltr.getUserBookings);
app.get('/getowner/bookings', authenticateUser, authorization(['admin', 'owner']), bookingCltr.getOwnerBookings);

app.post('/rating', authenticateUser, authorization(['user']), ratingCltr.create);
app.get('/rating/:pgId', authenticateUser, ratingCltr.getPgRatings);

app.get('/api/v1/getKey', paymentCltr.getKey);
app.post('/api/v1/payment/process', authenticateUser, paymentCltr.createOrder);
app.post('/api/v1/payment/verify', authenticateUser, paymentCltr.verifyPayment);
app.get('/user/payments', authenticateUser, paymentCltr.userPayments);
app.get('/owner/payments', authenticateUser, authorization(['owner']), paymentCltr.ownerPayments);
app.get('/admin/payments', authenticateUser, authorization(['admin']), paymentCltr.adminPayments);

app.listen(port, () => {
    console.log('Server running on the port', port);
})