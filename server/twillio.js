const express = require('express');

const twillioRoute = express.Router();
const client = require('twilio')(process.env.TWILLIO_ACC_SID, process.env.TWILLIO_AUTH_TOKEN);
const mysql = require('mysql');
const connection  = require('./lib/db');

twillioRoute.post('/sendCode', async function(req, res, next) {
    let userPhone = parseInt(req.body.phone.trim());
    if(userPhone && userPhone.toString().length == 10){
        client.verify.services(process.env.TWILLIO_VERIFY_SERVICE_ID).verifications
        .create({to: '+91'+userPhone, channel: 'sms'})
        .then(verification => {
            console.log('verification code', verification);
            res.send({
                status: true,
                statusCode: '200',
                message: 'Verification code sent to '+userPhone,
                token: verification.sid
            });
        }).catch(error => {
            console.log('msg',error.message);
            res.send({
                status: false,
                statusCode: '400',
                message: 'Something went wrong! Or Invalid phone number provided!'
            });
            console.log('Form submit error', error)
        });
    } else {
        res.send({
            status: false,
            statusCode: '400',
            message: 'Invalid values passed!'
        });
    }
});


twillioRoute.post('/verifyCode/:type?', async function(req, res, next) {
    if(typeof req.params.type != "undefined"){
        let userPhone = parseInt(req.body.phone.trim()), userCode = req.body.code.trim();
        console.log(userPhone+" and "+userCode);
        if(userCode && userPhone && userPhone.toString().length == 10){
            client.verify.services(process.env.TWILLIO_VERIFY_SERVICE_ID)
            .verificationChecks
            .create({to: '+91'+userPhone, code: userCode})
            .then(verification_check => {
                console.log('verification_check',verification_check);
                switch(req.params.type){
                    case "login":
                        connection.query(mysql.format('SELECT * FROM lc_users WHERE phone = ?', [userPhone]), function(error, rows, fields) {
                            if(error){
                                res.json({
                                    status: 'false',
                                    statusCode: '400',
                                    msg: error.msg
                                });
                            } else {
                                res.send({
                                    status: true,
                                    statusCode: '200',
                                    message: 'Login successfully!',
                                    userData: {id: rows[0]['uid'], fname: rows[0]['fname'], lname: rows[0]['lname'], role: rows[0]['role'], image: rows[0]['image'], everify: rows[0]['email_verified'], certified: rows[0]['is_certified']}
                                });
                            }
                        });
                    break;
                    case "otp":
                        res.send({
                            status: verification_check.status == "approved" ? true : false,
                            statusCode: verification_check.status == "approved" ? '200' : '400',
                            message: verification_check.status == "approved" ? 'Number Verified!' : 'Not Verified! Please try again after 10 minutes.',
                            vstatus: verification_check.status
                        });
                    break;
                    default:
                        res.send({
                            status: false,
                            statusCode: '400',
                            message: 'Invalid values passed!'
                        });
                    break;
                }
            }).catch(error => {
                res.send({
                    status: false,
                    statusCode: '400',
                    message: 'Something went wrong! Or Your code is expired!'
                });
                console.log('Form submit error in catch', error)
            });
        } else {
            res.send({
                status: false,
                statusCode: '400',
                message: 'Invalid values passed!'
            });
        }
    } else {
        res.send({
            status: false,
            statusCode: '400',
            message: 'Invalid parameters passed!'
        });
    }
});

module.exports = twillioRoute;