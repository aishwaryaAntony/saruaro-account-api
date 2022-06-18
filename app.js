var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const cluster = require('cluster');
let cron = require('node-cron');
var indexRouter = require('./src/api/routes/v1/index');
var userRouter = require('./src/api/routes/v1/users');
var userProfileRouter = require('./src/api/routes/v1/userProfiles');
var roleRouter = require('./src/api/routes/v1/roles');
var userRoleRouter = require('./src/api/routes/v1/userRoles');
var formRouter = require('./src/api/routes/v1/form');
var applePassRouter = require('./src/api/routes/v1/applePass');
var acuityRouter = require('./src/api/routes/v1/acuity');
var userAppointmentRouter = require('./src/api/routes/v1/userAppointment');
var testResultRouter = require('./src/api/routes/v1/testResult');

let sftpUtils = require('./src/helpers/sftpUtils');

var app = express();

app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
// app.use(express.json({ limit: '50mb', extended: true }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(cors());

cron.schedule('*/15 * * * *', () => {
    if (cluster.isMaster) {
        console.log(`Running a task every 15 minutes -> ${new Date()}`);
        sftpUtils.processFilesFromSFTP();
    }
});

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/user-profile', userProfileRouter);
app.use('/role', roleRouter);
app.use('/user-role', userRoleRouter);
app.use('/form', formRouter);
app.use('/apple-pass', applePassRouter);
app.use('/acuity-scheduling', acuityRouter);
app.use('/user-appointment', userAppointmentRouter);
app.use('/test-result', testResultRouter);


module.exports = app;
