const express = require('express');
const sharp = require("sharp");
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const frontRoute = express.Router();
const connection  = require('./lib/db');
const hbs = require('nodemailer-express-handlebars')
const nodeMailer = require('nodemailer');
const path = require('path');

frontRoute.post('/verify/:type?', async function(req, res, next) {
    if(typeof req.params.type != "undefined"){

        switch(req.params.type){
            case "user":
                const username = req.body.username.trim();
                const email = req.body.email.trim();
                const phone = req.body.phone.trim();

                const is_unique_uname = new Promise((resolve, reject) => {
                    connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE username = ?', [username]), async function(error, rows, flds) {
                        if(error){
                            reject(error);
                        } else {
                            resolve({'user': rows[0].total > 0 ? "Username already taken" : ''});
                        }
                    });
                });

                const is_unique_email = new Promise((resolve, reject) => {
                    connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE email = ?', [email]), async function(error, rows, flds) {
                        if(error){
                            reject(error);
                        } else {
                            resolve({'email': rows[0].total > 0 ? "Email Address already exists" : ''});
                        }
                    });
                });

                const is_unique_phone = new Promise((resolve, reject) => {
                    connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE phone = ?', [phone]), async function(error, rows, flds) {
                        if(error){
                            reject(error);
                        } else {
                            resolve({'phone': rows[0].total > 0 ? "Phone is already in use" : ''});
                        }
                    });
                });


                Promise.all([is_unique_uname,is_unique_email,is_unique_phone]).then((messages) => {
                    console.log('messages',messages);
                    var er_user = messages[0].user,
                    er_email = messages[1].email,
                    er_phone = messages[2].phone;

                    if(!er_user && !er_email && !er_phone){
                        res.send({
                            status: true,
                            statusCode: '200',
                            message: 'User validated successfully!'
                        });
                    } else {
                        res.send({
                            status: false,
                            statusCode: '400',
                            message_user: er_user,
                            message_email: er_email,
                            message_phone: er_phone
                        });
                    }
                });
            break;
            case "phone":
                const input_val = req.body.phone.trim();
                connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE phone = ?', [input_val]), async function(error, rows, flds) {
                    if(error){
                        res.json({
                            status: 'false',
                            statusCode: '400',
                            msg: error.msg
                        });
                    } else {
                        res.json({
                            status: 'true',
                            statusCode: '200',
                            msg: "Phone number exist!"
                        });
                    }
                });
            break;
            case "login":
                const ulogin = req.body.phone.trim();
                // const salt = await bcrypt.genSaltSync(10);
                // const userpassword = await bcrypt.hash(req.body.code, salt);
                connection.query(mysql.format('SELECT * FROM lc_users WHERE username = ? OR phone = ? OR email = ?', [ulogin,ulogin,ulogin]), function(error, rows, fields) {
                    if(error){
                        res.json({
                            status: 'false',
                            statusCode: '400',
                            msg: error.msg
                        });
                    } else {
                        if(rows.length != 0)
                        {
                            if(rows[0]["status"] == 1){
                                var password_hash = rows[0]["password"];
                                const verified = bcrypt.compareSync(req.body.code, password_hash);
                                if(verified) {
                                    res.send({
                                        status: true,
                                        statusCode: '200',
                                        message: 'Login successfully!',
                                        userData: encodeURIComponent(JSON.stringify({id: rows[0]['uid'], fname: rows[0]['fname'], lname: rows[0]['lname'], role: rows[0]['role'], image: rows[0]['image'], everify: rows[0]['email_verified'], certified: rows[0]['is_certified']}))
                                    });
                                } else {
                                    res.send({
                                        status: false,
                                        statusCode: '400',
                                        message: 'Invalid user password!'
                                    });
                                }
                            } else {
                                res.send({
                                    status: false,
                                    statusCode: '400',
                                    message: 'Your account is deactive. Kindly contact to the site administartor!'
                                });
                            }
                        } else {
                            res.send({
                                status: false,
                                statusCode: '400',
                                message: 'Please enter valid login details!'
                            });
                        }
                    }
                });
            break;
            default:
                res.send({
                    status: false,
                    statusCode: '400',
                    message: 'Invalid parameters passed!'
                });
            break;
        }
    } else {
        res.send({
            status: false,
            statusCode: '400',
            message: 'Invalid parameters passed!'
        });
    }

});


// Add User
frontRoute.post('/add/:type?', async function(req, res, next) {
    console.log("jhj");
    console.log('type', req.params.type);
    if(typeof req.params.type != "undefined"){
       
        switch(req.params.type){
            case "user":
                const username = req.body.pass.trim();
                const email = req.body.email.trim();
                const phone = req.body.phone.trim();
                const salt = await bcrypt.genSaltSync(10);
                const userpassword = await bcrypt.hash(req.body.pass.trim(), salt);

                
                const role = req.body.role == "sale" ? "agent" : "customer";
                console.log('user role',role);
                new Promise((resolve, reject) => {
                    connection.query(mysql.format('INSERT INTO lc_users (fname, lname, username, password, email, phone, role,number_verified, email_verified) VALUES (?,?,?,?,?,?,?,?,?)', [req.body.fname.trim(),req.body.lname.trim(),username,userpassword,email,phone,role,req.body.is_verified,0]), function(err, rows, fields) {
                        console.log('all rows',rows);
                        console.log('all',rows.insertId);
                        if(err){
                            reject(err);
                        } else {
                            let transporter = nodeMailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    type: 'OAuth2',
                                    user: process.env.NOTIFICATION_EMAIL,
                                    pass: process.env.NOTIFICATION_PASSWORD,
                                    clientId: process.env.NOTIFICATION_CLIENT_ID,
                                    clientSecret: process.env.NOTIFICATION_SECRET_KEY,
                                    refreshToken: process.env.NOTIFICATION_REFRESH_TOKEN
                                }
                            });
                            console.log('transporter',transporter);
                            
                            const handlebarOptions = {
                                viewEngine: {
                                    partialsDir: path.resolve('./views/'),
                                    defaultLayout: false,
                                },
                                viewPath: path.resolve('./views/'),
                            };
                            
                            transporter.use('compile', hbs(handlebarOptions));

                            let mailOptions = {
                                from: 'The Land Cart <no-reply@thelandcart.com>',
                                to: email,
                                subject: "Thank You For Registering", 
                                template: 'register',
                                context:{
                                    name: req.body.fname.trim()+" "+req.body.lname.trim(),
                                    vlink: process.env.FRONT_APP_URL+'user/verify/'+Buffer.from(email).toString('base64')
                                }
                            };

                            transporter.sendMail(mailOptions, (error, info) => {
                                console.log('info', info);
                                if (error) {
                                    console.log('errot', error);
                                }
                                //console.log('Message %s sent: %s', info.messageId, info.response);
                            });
                            resolve(rows.insertId);
                        }
                    });
                }).then(value => {
                    console.log('user id',value);
                    connection.query(mysql.format('SELECT * FROM lc_users WHERE uid = ?', [value]), async function(error, rows, flds) {
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
                                message: 'User created successfully!',
                                userData: {id: rows[0]['uid'], fname: rows[0]['fname'], lname: rows[0]['lname'], role: rows[0]['role'], image: rows[0]['image'], everify: rows[0]['email_verified'], certified: rows[0]['is_certified']}
                            });
                        }
                    });
                }).catch(err => {
                    res.json({
                        status: 'false',
                        statusCode: '400',
                        msg: err.msg
                    });
                });
            break;
            case "property":
                let uid = Buffer.from(req.body.key, 'base64').toString();
                let selAmenities = req.body.amenities;
                let selNeighbourhood = req.body.neighbourhood;
                let allfeatures = req.body.features;
                let mapAddr = req.body.mapAddress;
                let gallery = req.body.gallery;
                let videos = req.body.videos;
                let plans = req.body.plans;
                let attachments = req.body.attachment;
                //console.log(plans);

                    //let plansRecords = [];
                    if(plans){
                        plansData = JSON.parse(plans);
                        console.log('plansData',plans);
                        for(var flag = 0; flag < plansData.length; flag++){
                            var record = [project_id,'property',plansData[flag].plan_title,plansData[flag].plan_desc, plansData[flag].image];
                            plansRecords.push(record);
                        }
                    }

                // connection.query(mysql.format('INSERT INTO lc_properties (uid, title, detail, address, city, pincode, area, status, property_age, furnishing, type, neighbourhood, amenities, property_for, price, additional_features, map_address, info_title, info_description, adr_lat, adr_long) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [uid, req.body.title.trim(),req.body.description,req.body.addrs.trim(),parseInt(req.body.city),req.body.pincode,req.body.area.trim(),req.body.status.trim(),req.body.age,req.body.furnishing.trim(),parseInt(req.body.type), selAmenities, selNeighbourhood, req.body.for, req.body.price,req.body.features,mapAddr.property_location,mapAddr.loc_name,mapAddr.loc_detail,mapAddr.loc_lat,mapAddr.loc_long]), function(err, result, fields) {
                
                //     if(err) throw err
    
                //     let project_id = result.insertId;

                //     const uploadGallery = new Promise((resolve, reject) => {
                //         if(gallery.length > 0){
                //             let uploadPath = "./uploads/media/property/";
                //             let gallery_records = [];
                //             for(var flag =0; flag < gallery.length; flag++){
                //                 let imgsrc = gallery[flag].src;
                //                 let type = 'image';
                //                 if(gallery[flag].type != 'video/mp4' && gallery[flag].type != 'video/webm' && gallery[flag].type != 'video/ogg'){
                //                     let matches = imgsrc.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),response = {};
                //                     response.type = matches[1];
                //                     response.data = Buffer.from(matches[2], 'base64');
                //                     let decodedImg = response;
                //                     let imageBuffer = decodedImg.data;
                //                     sharp(imageBuffer)
                //                             .webp({ quality: 20 })
                //                             .toFile(uploadPath+ gallery[flag].name);
                //                 } else {
                //                     type = 'video';
                //                     imgsrc = imgsrc.replace(/^data:(.*?);base64,/, "");
                //                     imgsrc = imgsrc.replace(/ /g, '+');
                //                     fs.writeFile(uploadPath+ gallery[flag].name, imgsrc, 'base64', function(err) {
                //                         console.log('error uploading video',err);
                //                     });
                //                 }

                //                 var record = [project_id,'property',type,0,gallery[flag].name];
                //                 gallery_records.push(record);

                //                 if(flag == gallery.length-1){
                //                     resolve(gallery_records);
                //                 }
                //             }
                //         }
                //     });
                    
                //     const addVidoes = new Promise((resolve, reject) => {
                //         if(videos.length > 0){
                //             let video_records = [];
                //             for(var flag =0; flag < videos.length; flag++){
                //                 var record = [project_id,'property','url',videos[flag].in_gallery,videos[flag].video_url];
                //                 video_records.push(record);

                //                 if(flag == videos.length-1){
                //                     resolve(video_records);
                //                 }
                //             }
                //         }
                //     });

                // const addBrochure = new Promise((resolve, reject) => {
                //     let attachment_rec = [];
                //     if(attachments && attachments.media_meta[0].type == "application/pdf"){
                //         var record = [project_id,'property','doc',0,attachments.media_name];
                //         attachment_rec.push(record);
                //         let imgsrc = attachments.media_meta[0].src;
                //         imgsrc = imgsrc.replace(/^data:(.*?);base64,/, "");
                //         imgsrc = imgsrc.replace(/ /g, '+');
                //         let docMedia = './uploads/media/documents/';
                //         fs.writeFile(docMedia+attachments.media_name, imgsrc, 'base64', function(err) {
                //             console.log('error uploading attachment',err);
                //         });
                //     }
                //     resolve(attachment_rec);
                // });
                
                //     Promise.all([uploadGallery]).then((data_vals) => {
                        
                //     });
                    
                //     var brochure = req.body.hdn_document.trim();
                //     if(brochure != ""){
                //         var record = [project_id,'property','doc',0,brochure];
                //         gallery_records.push(record);
                //     }
    
                
    
                //     if(gallery_records.length > 0){
                //         connection.query(mysql.format('INSERT INTO lc_media (project_id, media_for, type, in_gallery, media_path) VALUES ?',[gallery_records]), function(error, results, cols) {
                //             if(error) throw error
    
                //             if(plansRecords.length > 0){
                //                 connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, plan_for, title, description,media_path) VALUES ?',[plansRecords]), function(error, result, cols) {
                //                     if(error) throw error
                                    
                //                     req.flash('success', 'Property added successfully.');
                //                     res.redirect('/property');
                //                 });
                //             } else {
                //                 req.flash('success', 'Property added successfully.');
                //                 res.redirect('/property');
                //             }
                //         });
                //     } else {
                //         if(plansRecords.length > 0){
                //             connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, plan_for, title, description, media_path) VALUES ?',[plansRecords]), function(error, reslt, cols) {
                //                 if(error) throw error
                                
                //                 req.flash('success', 'Property added successfully.');
                //                 res.redirect('/property');
                //             });
                //         } else {
                //             req.flash('success', 'Property added successfully.');
                //             res.redirect('/property');
                //         }
                //     }
                //});


                
                
            break;
            default:
                res.send({
                    status: false,
                    statusCode: '400',
                    message: 'Submission url not found!'
                });
            break;
        }
        
            
    } else {
        res.send({
            status: false,
            statusCode: '400',
            message: 'Invalid parameters passed!'
        });
    }
});

frontRoute.post('/getPreloadData', async function(req, res, next) {

    if(typeof req.body.list != "undefined" && req.body.list.length > 0){
        let listArr = req.body.list;
        let dataToLoad = {};
            
        listArr.forEach(function(item,index) {
            new Promise((resolve, reject) => {
                let tablename = 'lc_'+item;
                connection.query('SELECT * FROM '+tablename, async function(error, rows, flds) {
                    if(error){
                        reject(error.sqlMessage);
                    } else {
                        resolve(rows);
                    }
                });
            }).then((resRows) => {
                dataToLoad[item] = resRows;
                if(index == (listArr.length - 1)){
                    res.send({
                        status: true,
                        statusCode: '200',
                        data: dataToLoad,
                    });
                }
            }).catch(err => {
                res.json({
                    status: false,
                    statusCode: '400',
                    msg: err
                });
            });
        });
            
    } else {
        res.send({
            status: false,
            statusCode: '400',
            message: 'Invalid parameters passed!'
        });
    }
});

module.exports = frontRoute;