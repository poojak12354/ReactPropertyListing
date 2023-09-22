const express = require('express');
const path = require('path');
const sharp = require("sharp");
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const router = express.Router();
const authenticate = require('./middleware');
const connection  = require('./lib/db');

// Dashboard
router.get('/dashboard', authenticate.verify, function (req, res) {
    res.render('Dashboard/dashboard',{
        title: 'Dashboard',
        session: res.locals.session
  });
});

// get all users listing
router.get('/users', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE role="'+hasterm+'" || email="'+hasterm+'" || fname LIKE "%'+hasterm+'%" || lname LIKE "%'+hasterm+'%" || phone LIKE "%'+hasterm+'%" || username LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    connection.query('SELECT count(*) as total FROM lc_users'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT * FROM lc_users'+searchTearm+' ORDER BY uid DESC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            res.render('Users/users',{
                title: 'Users',
                session: res.locals.session,
                usersList: rows,
                pages: totalpages,
                current: cur,
                search: hasterm,
                paginationUrl: searchTearm != '' ? '/users?search='+hasterm+'&page=' : '/users?page='
            });
        });
    });
});

// Edit User
router.get('/user/:id?', authenticate.verify, async function (req, res) {
    var cur = typeof req.params.id != "undefined" ? parseInt(req.params.id) : 0;
    if(cur){
        connection.query(mysql.format('SELECT * FROM lc_users WHERE uid = ?',[cur]), function(error, rows, flds) {
            if(error) throw error

            if(rows.length > 0){
                res.render('Users/user',{
                    title: 'Edit User',
                    session: res.locals.session,
                    success: res.locals.success,
                    error: res.locals.error,
                    userData: rows[0]
                });
            } else {
                res.render('Auth/pages_404',{
                    title: 'Page Not Found',
                    session: res.locals.session,
                });
            }
        });
    } else {
        res.render('Users/user',{
            title: 'Add User',
            session: res.locals.session,
            success: res.locals.success,
            error: res.locals.error,
            userData: ''
        });
    }    
});

// Add User
router.post('/user', authenticate.verify, async function(req, res, next) {
    if(req.body.fname != "") {
        if(req.body.frm_id == 0){
            const salt = await bcrypt.genSaltSync(10);
            const userpassword = await bcrypt.hash(req.body.password.trim(), salt);
            connection.query(mysql.format('INSERT INTO lc_users (fname, lname, username, password, email, phone, role, image,number_verified,email_verified) VALUES (?,?,?,?,?,?,?,?,?,?)', [req.body.fname.trim(),req.body.lname.trim(),req.body.username.trim(),userpassword,req.body.email.trim(),req.body.phone.trim(),req.body.role.trim(),req.body.profileimg.trim(),1,1]), function(err, rows, fields) {
                
                if(err) throw err
                
                var username = req.body.fname+" "+req.body.lname;
                req.flash('success', 'User '+username+' added successfully.');
                res.redirect('/user');
            });
        } else {
            connection.query(mysql.format('UPDATE lc_users SET fname=?, lname=?, username=?, email=?, phone=?, role=?, image=? WHERE uid=?', [req.body.fname.trim(),req.body.lname.trim(),req.body.username.trim(),req.body.email.trim(),req.body.phone.trim(),req.body.role.trim(),req.body.profileimg.trim(),parseInt(req.body.frm_id)]), function(err, rows, fields) {
                
                if(err) throw err
                
                var username = req.body.fname.trim()+" "+req.body.lname.trim();
                req.flash('success', 'User '+username+' updated successfully.');
                res.redirect('/user');
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/user');
    }
});

// Validate user inputs
router.post('/validate-user-form', function (req, res) {
    if(typeof req.body.action != "undefined" && req.body.action == 'user_form_validate' && typeof req.body.username !="undefined" && typeof req.body.phone !="undefined" && typeof req.body.email !="undefined"){

        connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE username = ? AND uid != ?', [req.body.username,req.body.frmID]), function(error, results, fields) {
            if (error) {
                res.json({
                    status: 'error',
                    msg: error.msg
                });
            } else {
                connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE phone = ? AND uid != ?', [req.body.phone,req.body.frmID]), function(err, rows, colums) {
                    if (err) {
                        res.json({
                            status: 'error',
                            msg: err.msg
                        });
                    } else {
                        connection.query(mysql.format('SELECT COUNT(*) AS total FROM lc_users WHERE email = ? AND uid != ?', [req.body.email,req.body.frmID]), function(errs, allrows, allcolums) {
                            if (errs) {
                                res.json({
                                    status: 'error',
                                    msg: errs.msg
                                });
                            } else {
                                res.json({
                                    user: results[0].total > 0 ? "Username already taken" : "success",
                                    phone: rows[0].total > 0 ? "Phone is already in use" : "success",
                                    email: allrows[0].total > 0 ? "Email Address already exists" : "success"
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.json({
            status: 'error',
            msg: 'Invalid parameters passed!'
        });
    }
});

// Upload avatar
router.post('/upload-avatar', async function(req, res){
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let avatar = req.files.file;
            //avatar.mv('./uploads/users/' + avatar.name);
            await sharp(avatar.data)
            .webp({ quality: 20 })
            .toFile("./uploads/users/" + avatar.name);

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: avatar.name,
                    mimetype: avatar.mimetype,
                    size: avatar.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

//change status
router.post('/change-status', function (req, res) {
    if(typeof req.body.action != "undefined" && typeof req.body.id !="undefined" && req.body.id){
        let query = "", ucname="", name ="";
        var status = req.body.code == 1 ? 'activated' : 'deactivated';
        switch(req.body.action){
            case "change_user_status":
                query = 'UPDATE lc_users SET status=? WHERE uid';
                ucname = 'User';
                name = 'user';
            break;
            case "change_project_status":
                query = 'UPDATE lc_projects SET project_status=? WHERE project_id';
                ucname = 'Project';
                name = 'project';
            break;
            case "change_property_status":
                query = 'UPDATE lc_properties SET visibility=? WHERE property_id';
                ucname = 'Property';
                name = 'property';
            break;
            case "user_certified":
                query = 'UPDATE lc_users SET is_certified=? WHERE uid';
                ucname = 'User';
                name = 'user';
                status = req.body.code == 1 ? 'marked certified' : 'marked uncertified';
            break;
        }
        connection.query(mysql.format(query+'=?', [req.body.code,req.body.id]), function(err, rows) {
            if (err) {
                //return reject(err);
                res.json({
                    status: 'error',
                    msg: err.msg
                });
            } else {
                res.json({
                    status: rows.affectedRows > 0 ? 'success' : 'error',
                    msg: rows.affectedRows == 1? ucname+' has been '+status+' successfully!' : 'No record found for this '+name+'!'
                });
            }
        });
    } else {
        res.json({
            status: 'error',
            msg: 'Invalid parameters passed!'
        });
    }
});

// get all projects listing
router.get('/projects', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE tbl_projects.title LIKE "%'+hasterm+'%" || tbl_projects.detail LIKE "%'+hasterm+'%" || tbl_projects.address LIKE "%'+hasterm+'%" || tbl_city.name LIKE "%'+hasterm+'%" || tbl_projects.pincode LIKE "%'+hasterm+'%" || tbl_projects.area LIKE "%'+hasterm+'%" || tbl_projects.launch_year LIKE "%'+hasterm+'%" || tbl_projects.status LIKE "%'+hasterm+'%" || tbl_projects.furnishing LIKE "%'+hasterm+'%" || tbl_types.name LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    connection.query('SELECT count(*) as total FROM lc_projects as tbl_projects JOIN lc_types as tbl_types ON tbl_types.type_id = tbl_projects.type JOIN lc_city as tbl_city ON tbl_city.city_id = tbl_projects.city'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT tbl_projects.project_id,tbl_projects.title,tbl_projects.address,tbl_city.name as city_name,tbl_projects.price_from,tbl_projects.price_to,tbl_projects.launch_year, tbl_projects.project_status,tbl_types.name as project_type FROM lc_projects as tbl_projects JOIN lc_types as tbl_types ON tbl_types.type_id = tbl_projects.type JOIN lc_city as tbl_city ON tbl_city.city_id = tbl_projects.city'+searchTearm+' ORDER BY project_id DESC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            res.render('Projects/projects',{
                title: 'Projects',
                session: res.locals.session,
                projectsList: rows,
                pages: totalpages,
                current: cur,
                search: hasterm,
                paginationUrl: searchTearm != '' ? '/project?search='+hasterm+'&page=' : '/project?page='
            });
        });
    });
});

// Edit Project
router.get('/project/:id?', authenticate.verify, async function (req, res) {

    const promise_neighbourhood = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_neighbourhood ORDER BY neighbour_id ASC', async function(error, rows, flds) {
            if(error){
                reject(error);
            } else {
                resolve({'neighbourhood': rows});
            }
        });
    });

    const promise_ameneties = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_amenities ORDER BY aid ASC', async function(error, datarws, clms) {
            if(error){
                reject(error);
            } else {
                resolve({'ameneties': datarws});
            }
        });
    });

    const promise_city = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_city ORDER BY city_id ASC', async function(error, dataRows, clms) {
            if(error){
                reject(error);
            } else {
                resolve({'cities': dataRows});
            }
        });
    });

    const promise_type = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_types ORDER BY type_id ASC', function(errs, trows, tfields) {
            if(errs){
                reject(errs);
            } else {
                resolve({'types': trows});
            }
        });
    });

    Promise.all([promise_neighbourhood,promise_ameneties,promise_city,promise_type]).then((messages) => {
        
        var neighbourhood = messages[0].neighbourhood,
        ameneties = messages[1].ameneties,
        cities = messages[2].cities,
        types = messages[3].types;

        var cur = typeof req.params.id != "undefined" ? parseInt(req.params.id) : 0;
        if(cur){
            connection.query('SELECT * FROM lc_media WHERE media_for="project" AND project_id = ?',[cur], function(errs, mrows, tfields) {
                if(errs) throw errs

                connection.query('SELECT * FROM lc_floor_plans WHERE plan_for="project" AND project_id = ?',[cur], function(errs, prows, tfields) {
                    if(errs) throw errs

                    connection.query(mysql.format('SELECT * FROM lc_projects WHERE project_id = ?',[cur]), async function(error, rows, flds) {
                        if(error) throw error
                        
                        if(rows.length > 0){
                            res.render('Projects/project',{
                                title: 'Edit Project',
                                session: res.locals.session,
                                success: res.locals.success,
                                error: res.locals.error,
                                data: rows[0],
                                media: mrows,
                                plans: prows,
                                dataNeighbour: neighbourhood,
                                dataAmenities: ameneties,
                                dataCities: cities,
                                dataTypes: types
                            });
                        } else {
                            res.render('Auth/pages_404',{
                                title: 'Page Not Found',
                                session: res.locals.session,
                            });
                        }
                    });
                });
            });
        } else {
            res.render('Projects/project',{
                title: 'Add Project',
                session: res.locals.session,
                success: res.locals.success,
                error: res.locals.error,
                data: '',
                media: '',
                plans: '',
                dataNeighbour: neighbourhood,
                dataAmenities: ameneties,
                dataCities: cities,
                dataTypes: types
            });
        }
    });
});

//save project data
router.post('/project', authenticate.verify, async function (req, res) {
    if(req.body.project_name != "") {
        
        var is_featured = req.body.featured != undefined ? 1 : 0;
        var neighbourhood = '', ameneties='';
        
        if(req.body.neighbourhood != undefined){
            neighbourhood = req.body.neighbourhood.length > 1 ? req.body.neighbourhood.join(',') : req.body.neighbourhood;
        }

        if(req.body.ameneties != undefined) {
            ameneties = req.body.ameneties.length > 1 ? req.body.ameneties.join(',') : req.body.ameneties;
        }
        
        if(req.body.frm_id == 0){
            
            connection.query(mysql.format('INSERT INTO lc_projects (title, detail, is_featured, address, city, pincode, area, status, launch_year, furnishing, type, neighbourhood, amenities, price_from, price_to, additional_features, map_address, info_title, info_description, adr_lat, adr_long) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.project_name.trim(),req.body.form_content,is_featured,req.body.address.trim(),parseInt(req.body.city),req.body.zip,req.body.area.trim(),req.body.status.trim(),req.body.launch_year,req.body.furnishing.trim(),parseInt(req.body.project_type), neighbourhood, ameneties, req.body.property_price_from, req.body.property_price_to,req.body.add_specs,req.body.property_location,req.body.loc_name,req.body.loc_detail,req.body.loc_lat,req.body.loc_long]), function(err, result, fields) {
                
                if(err) throw err

                var project_id = result.insertId;
                var gallery_records = [];
                
                var gallery_files = req.body.hdn_gallery;
                if(gallery_files != ""){
                    gallery_files = JSON.parse(gallery_files);
                    for(var flag =0; flag < gallery_files.length; flag++){
                        var record = [project_id,gallery_files[flag].type,0,gallery_files[flag].name];
                        gallery_records.push(record);
                    }
                }

                var videosData = req.body.vid_data;
                if(videosData != ""){
                    videosData = JSON.parse(videosData);
                    for(var flag =0; flag < videosData.length; flag++){
                        var record = [project_id,'url',videosData[flag].in_gallery,videosData[flag].video_url];
                        gallery_records.push(record);
                    }
                }

                var brochure = req.body.hdn_document.trim();
                if(brochure != ""){
                    var record = [project_id,'doc',0,brochure];
                    gallery_records.push(record);
                }

                var plansData = req.body.plans_data;
                var plansRecords = [];
                if(plansData != ""){
                    plansData = JSON.parse(plansData);
                    for(var flag =0; flag < plansData.length; flag++){
                        var record = [project_id,plansData[flag].plan_title,plansData[flag].plan_desc, plansData[flag].image];
                        plansRecords.push(record);
                    }
                }

                if(gallery_records.length > 0){
                    connection.query(mysql.format('INSERT INTO lc_media (project_id, type, in_gallery, media_path) VALUES ?',[gallery_records]), function(error, results, cols) {
                        if(error) throw error

                        if(plansRecords.length > 0){
                            connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, title, description,media_path) VALUES ?',[plansRecords]), function(error, result, cols) {
                                if(error) throw error
                                
                                req.flash('success', 'Project added successfully.');
                                res.redirect('/project');
                            });
                        } else {
                            req.flash('success', 'Project added successfully.');
                            res.redirect('/project');
                        }
                    });
                } else {
                    if(plansRecords.length > 0){
                        connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, title, description, media_path) VALUES ?',[plansRecords]), function(error, reslt, cols) {
                            if(error) throw error
                            
                            req.flash('success', 'Project added successfully.');
                            res.redirect('/project');
                        });
                    } else {
                        req.flash('success', 'Project added successfully.');
                        res.redirect('/project');
                    }
                }
            });
        } else {

            var project_id = parseInt(req.body.frm_id);

            connection.query(mysql.format('UPDATE lc_projects SET title=?, detail=?, is_featured=?, address=?, city=?, pincode=?, area=?, status=?, launch_year=?, furnishing=?, type=?, neighbourhood=?, amenities=?, price_from=?, price_to=?, additional_features=?, map_address=?, info_title=?, info_description=?, adr_lat=?, adr_long=? WHERE project_id=?', [req.body.project_name.trim(),req.body.form_content,is_featured,req.body.address.trim(),parseInt(req.body.city),req.body.zip,req.body.area.trim(),req.body.status.trim(),req.body.launch_year,req.body.furnishing.trim(),parseInt(req.body.project_type), neighbourhood, ameneties, req.body.property_price_from, req.body.property_price_to,req.body.add_specs,req.body.property_location,req.body.loc_name,req.body.loc_detail,req.body.loc_lat,req.body.loc_long, project_id]), function(err, result, fields) {
                
                if(err) throw err

                var gallery_records = [];
                
                var gallery_files = req.body.hdn_gallery;
                if(gallery_files != ""){
                    gallery_files = JSON.parse(gallery_files);
                    for(var flag =0; flag < gallery_files.length; flag++){
                        var record = [project_id,gallery_files[flag].type,0,gallery_files[flag].name];
                        gallery_records.push(record);
                    }
                }

                var videosData = req.body.vid_data;
                if(videosData != ""){
                    videosData = JSON.parse(videosData);
                    for(var flag =0; flag < videosData.length; flag++){
                        var record = [project_id,'url',videosData[flag].in_gallery,videosData[flag].video_url];
                        gallery_records.push(record);
                    }
                }

                var brochure = req.body.hdn_document.trim();
                if(brochure != ""){
                    var record = [project_id,'doc',0,brochure];
                    gallery_records.push(record);
                }

                var plansData = req.body.plans_data;
                var plansRecords = [];
                if(plansData != ""){
                    plansData = JSON.parse(plansData);
                    for(var flag =0; flag < plansData.length; flag++){
                        //var record = [project_id,plansData[flag].plan_title,plansData[flag].plan_desc];
                        var record = [project_id, plansData[flag].plan_title, plansData[flag].plan_desc, plansData[flag].image];
                        plansRecords.push(record);
                    }
                }

                var del_plan_media = req.body.delete_plan_media;
                if(del_plan_media != ""){
                    files_to_del = JSON.parse(del_plan_media);
                    for(var flag =0; flag < files_to_del.length; flag++){
                        url_to_delete = 'uploads/media/project/'+files_to_del[flag];
                        if (fs.existsSync(path.join(__dirname, '../'+url_to_delete))) {
                            fs.unlinkSync(path.join(__dirname, '../'+url_to_delete));
                        }
                    }
                }
                var del_media = req.body.delete_media;
                if(del_media != ""){
                    del_files = JSON.parse(del_media);
                    for(var flag =0; flag < del_files.length; flag++){
                        if(del_files[flag].type == "doc"){
                            url_to_delete = 'uploads/media/documents/'+del_files[flag].name;
                        } else {
                            url_to_delete = 'uploads/media/project/'+del_files[flag].name;
                        }
                        if (fs.existsSync(path.join(__dirname, '../'+url_to_delete))) {
                            fs.unlinkSync(path.join(__dirname, '../'+url_to_delete));
                        }
                    }
                }
                if(gallery_records.length > 0){
                    connection.query(mysql.format('DELETE FROM lc_media WHERE media_for="project" AND project_id = ?',[project_id]), function(merr, mres, mcols) {
                        
                        if(merr) throw merr

                        connection.query(mysql.format('INSERT INTO lc_media (project_id, type, in_gallery, media_path) VALUES ?',[gallery_records]), function(error, results, cols) {
                            if(error) throw error

                            connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="project" AND project_id = ?',[project_id]), function(perr, pres, pcols) {
                        
                                if(perr) throw perr

                                if(plansRecords.length > 0){
                                    connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, title, description, media_path) VALUES ?',[plansRecords]), function(error, result, cols) {
                                        if(error) throw error
                                        
                                        req.flash('success', 'Project updated successfully.');
                                        res.redirect('/project');
                                    });
                                } else {
                                    req.flash('success', 'Project updated successfully.');
                                    res.redirect('/project');
                                }
                            });
                        });
                    });
                } else {
                    connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="project" AND project_id = ?',[project_id]), function(perr, pres, pcols) {
                        if(perr) throw perr
                        if(plansRecords.length > 0){
                            connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, title, description, media_path) VALUES ?',[plansRecords]), function(error, reslt, cols) {
                                if(error) throw error
                                
                                req.flash('success', 'Project updated successfully.');
                                res.redirect('/project');
                            });
                        } else {
                            req.flash('success', 'Project updated successfully.');
                            res.redirect('/project');
                        }
                    });
                }
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/project');
    }
});

// get all neighbourhood
router.get('/neighbourhood', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE name LIKE "%'+hasterm+'%" || icon LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    connection.query('SELECT count(*) as total FROM lc_neighbourhood'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT * FROM lc_neighbourhood'+searchTearm+' ORDER BY neighbour_id ASC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            if(typeof req.query.edit != "undefined"){
                connection.query(mysql.format('SELECT * FROM lc_neighbourhood WHERE neighbour_id=?',[req.query.edit]), function(errs, row, columns) {
                    if(errs) throw errs
                    res.render('Projects/neighbourhood',{
                        title: 'Neighbourhood',
                        session: res.locals.session,
                        dataList: rows,
                        pages: totalpages,
                        current: cur,
                        search: hasterm,
                        paginationUrl: searchTearm != '' ? '/neighbourhood?search='+hasterm+'&page=' : '/neighbourhood?page=',
                        data: row[0]
                    });
                });
            } else {
                res.render('Projects/neighbourhood',{
                    title: 'Neighbourhood',
                    session: res.locals.session,
                    dataList: rows,
                    pages: totalpages,
                    current: cur,
                    search: hasterm,
                    paginationUrl: searchTearm != '' ? '/neighbourhood?search='+hasterm+'&page=' : '/neighbourhood?page=',
                    data: ''
                });
            }
        });
    });
});

// save/update neighbourhood
router.post('/neighbourhood', authenticate.verify, async function(req, res, next) {
    if(req.body.neighbourhood_name != "") {
        var icon_name = req.body.neighbourhood_name.trim();
        if(req.body.frm_id == 0){
            connection.query(mysql.format('INSERT INTO lc_neighbourhood (name, icon) VALUES (?,?)', [icon_name,req.body.icon_html]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' added successfully.');
                res.redirect('/neighbourhood');
            });
        } else {
            connection.query(mysql.format('UPDATE lc_neighbourhood SET name=?, icon=? WHERE neighbour_id=?', [icon_name,req.body.icon_html,parseInt(req.body.frm_id)]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' updated successfully.');
                res.redirect('/neighbourhood');
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/neighbourhood');
    }
});


// get all amenities
router.get('/amenities', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE name LIKE "%'+hasterm+'%" || icon LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    connection.query('SELECT count(*) as total FROM lc_amenities'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT * FROM lc_amenities'+searchTearm+' ORDER BY aid ASC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            if(typeof req.query.edit != "undefined"){
                connection.query(mysql.format('SELECT * FROM lc_amenities WHERE aid=?',[req.query.edit]), function(errs, row, columns) {
                    if(errs) throw errs
                    res.render('Projects/ameneties',{
                        title: 'Ameneties',
                        session: res.locals.session,
                        dataList: rows,
                        pages: totalpages,
                        current: cur,
                        search: hasterm,
                        paginationUrl: searchTearm != '' ? '/amenities?search='+hasterm+'&page=' : '/amenities?page=',
                        data: row[0]
                    });
                });
            } else {
                res.render('Projects/ameneties',{
                    title: 'Ameneties',
                    session: res.locals.session,
                    dataList: rows,
                    pages: totalpages,
                    current: cur,
                    search: hasterm,
                    paginationUrl: searchTearm != '' ? '/amenities?search='+hasterm+'&page=' : '/amenities?page=',
                    data: ''
                });
            }
        });
    });
});

// save/update amenities
router.post('/amenities', authenticate.verify, async function(req, res, next) {
    if(req.body.amenities_name != "") {
        var icon_name = req.body.amenities_name.trim();
        if(req.body.frm_id == 0){
            connection.query(mysql.format('INSERT INTO lc_amenities (name, icon) VALUES (?,?)', [icon_name,req.body.icon_html]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' added successfully.');
                res.redirect('/amenities');
            });
        } else {
            connection.query(mysql.format('UPDATE lc_amenities SET name=?, icon=? WHERE aid=?', [icon_name,req.body.icon_html,parseInt(req.body.frm_id)]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' updated successfully.');
                res.redirect('/amenities');
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/amenities');
    }
});

// get all cities
router.get('/cities', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE name LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    connection.query('SELECT count(*) as total FROM lc_city'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT * FROM lc_city'+searchTearm+' ORDER BY city_id ASC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            if(typeof req.query.edit != "undefined"){
                connection.query(mysql.format('SELECT * FROM lc_city WHERE city_id=?',[req.query.edit]), function(errs, row, columns) {
                    if(errs) throw errs
                    res.render('City/city',{
                        title: 'City',
                        session: res.locals.session,
                        dataList: rows,
                        pages: totalpages,
                        current: cur,
                        search: hasterm,
                        paginationUrl: searchTearm != '' ? '/cities?search='+hasterm+'&page=' : '/cities?page=',
                        data: row[0]
                    });
                });
            } else {
                res.render('City/city',{
                    title: 'City',
                    session: res.locals.session,
                    dataList: rows,
                    pages: totalpages,
                    current: cur,
                    search: hasterm,
                    paginationUrl: searchTearm != '' ? '/cities?search='+hasterm+'&page=' : '/cities?page=',
                    data: ''
                });
            }
        });
    });
});

// save/update city
router.post('/cities', authenticate.verify, async function(req, res, next) {
    if(req.body.city_name != "") {
        var icon_name = req.body.city_name.trim();
        if(req.body.frm_id == 0){
            connection.query(mysql.format('INSERT INTO lc_city (name) VALUES (?)', [icon_name]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' added successfully.');
                res.redirect('/cities');
            });
        } else {
            connection.query(mysql.format('UPDATE lc_city SET name=? WHERE city_id=?', [icon_name,parseInt(req.body.frm_id)]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' updated successfully.');
                res.redirect('/cities');
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/cities');
    }
});

// get all project types
router.get('/project-types', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE name LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    connection.query('SELECT count(*) as total FROM lc_types'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT * FROM lc_types'+searchTearm+' ORDER BY type_id ASC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            if(typeof req.query.edit != "undefined"){
                connection.query(mysql.format('SELECT * FROM lc_types WHERE type_id=?',[req.query.edit]), function(errs, row, columns) {
                    if(errs) throw errs
                    res.render('Projects/types',{
                        title: 'Project Type',
                        session: res.locals.session,
                        dataList: rows,
                        pages: totalpages,
                        current: cur,
                        search: hasterm,
                        paginationUrl: searchTearm != '' ? '/project-types?search='+hasterm+'&page=' : '/project-types?page=',
                        data: row[0]
                    });
                });
            } else {
                res.render('Projects/types',{
                    title: 'Project Type',
                    session: res.locals.session,
                    dataList: rows,
                    pages: totalpages,
                    current: cur,
                    search: hasterm,
                    paginationUrl: searchTearm != '' ? '/project-types?search='+hasterm+'&page=' : '/project-types?page=',
                    data: ''
                });
            }
        });
    });
});

// save/update project types
router.post('/project-types', authenticate.verify, async function(req, res, next) {
    if(req.body.type_name != "") {
        var icon_name = req.body.type_name.trim();
        if(req.body.frm_id == 0){
            connection.query(mysql.format('INSERT INTO lc_types (name) VALUES (?)', [icon_name]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' added successfully.');
                res.redirect('/project-types');
            });
        } else {
            connection.query(mysql.format('UPDATE lc_types SET name=? WHERE type_id=?', [icon_name,parseInt(req.body.frm_id)]), function(err, rows, fields) {
                
                if(err) throw err
                
                req.flash('success', icon_name+' updated successfully.');
                res.redirect('/project-types');
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/project-types');
    }
});


//delete project type
router.post('/delete-record', function (req, res) {
    if(typeof req.body.action != "undefined" && typeof req.body.id !="undefined" && req.body.id){
        let query = "", ucname="", name ="";
        switch(req.body.action){
            case "delete_project_type":
                var query_params = new Promise(function(resolve, reject) {
                    query = "DELETE FROM lc_types WHERE type_id";
                    ucname = "Project type";
                    name = "project type";
                    resolve();
                });
            break;
            case "delete_user":
                var query_params = new Promise(function(resolve, reject) {
                    query="DELETE FROM lc_users WHERE uid";
                    ucname = "User";
                    name = "user";
                    resolve();
                });
            break;
            case "delete_neighbourhood":
                var query_params = new Promise(function(resolve, reject) {
                    query="DELETE FROM lc_neighbourhood WHERE neighbour_id";
                    ucname = "Neighbourhood";
                    name = "neighbourhood";
                    resolve();
                });
                
            break;
            case "delete_amenity":
                var query_params = new Promise(function(resolve, reject) {
                    query="DELETE FROM lc_amenities WHERE aid";
                    ucname = "Amenity";
                    name = "amenity";
                    resolve();
                });
            break;
            case "delete_city":
                var query_params = new Promise(function(resolve, reject) {
                    query="DELETE FROM lc_city WHERE city_id";
                    ucname = "City";
                    name = "city";
                    resolve();
                });
            break;
            case "delete_project":

                const delete_project_plans = new Promise(function(resolve, reject) {
                    connection.query(mysql.format("SELECT media_path FROM lc_floor_plans WHERE plan_for='project' AND project_id = ?", [req.body.id]), function(err, rows) {
                        if (err) {
                            
                            res.json({
                                status: 'error',
                                msg: err.msg
                            });
                            reject();
                        } else {
                            connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="project" AND project_id=?', [req.body.id]), function(d_err, d_rows) {});
                            console.log('num of rows to delete plans',rows);
                            if(rows.length > 0){
                                for(var flag in rows){
                                    var filePath = '/uploads/media/project/'+rows[flag].media_path; 
                                    try {
                                        if (fs.existsSync(path.join(__dirname, '../'+filePath))) {
                                            fs.unlinkSync(path.join(__dirname, '../'+filePath));
                                        }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                    if(flag == (rows.length-1)){
                                        resolve();
                                    }
                                }
                            } else {
                                resolve();
                            }
                        }
                    });
                });

                const delete_project_media = new Promise(function(resolve, reject) {
                    connection.query(mysql.format("SELECT media_path,type FROM lc_media WHERE type IN ('image','video','doc') AND media_for='project' AND project_id = ?", [req.body.id]), function(err, rows) {
                        if (err) {
                            res.json({
                                status: 'error',
                                msg: err.msg
                            });
                            reject();
                        } else {
                            connection.query(mysql.format('DELETE FROM lc_media WHERE media_for="project" AND project_id=?', [req.body.id]), function(d_err, d_rows) {});
                            console.log('num of rows to delete',rows);
                            if(rows.length > 0){
                                for(var flag in rows){
                                    var filePath = rows[flag].type == 'doc' ? '/uploads/media/documents/'+rows[flag].media_path : '/uploads/media/project/'+rows[flag].media_path; 
                                    try {
                                        if (fs.existsSync(path.join(__dirname, '../'+filePath))) {
                                            fs.unlinkSync(path.join(__dirname, '../'+filePath));
                                        }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                    if(flag == (rows.length-1)){
                                        resolve();
                                    }
                                }
                            } else {
                                resolve();
                            }
                        }
                    });
                });

                Promise.all([delete_project_plans, delete_project_media]).then(() => {
                    console.log('here in all')
                    query="DELETE FROM lc_projects WHERE project_id";
                    ucname = "Project";
                    name = "project";
                    connection.query(mysql.format(query+'=?', [req.body.id]), function(err, rows) {
                        if (err) {
                            res.json({
                                status: 'error',
                                msg: err.msg
                            });
                        } else {
                            res.json({
                                status: rows.affectedRows > 0 ? 'success' : 'error',
                                msg: rows.affectedRows == 1? ucname+' deleted successfully!' : 'No record found for this '+name+'!'
                            });
                        }
                    });
                });

                // var query_params = new Promise(function(resolve, reject) {
                //     connection.query(mysql.format("SELECT media_path,type FROM lc_media WHERE type IN ('image','video','doc') AND media_for='project' AND project_id = ?", [req.body.id]), function(err, rows) {
                //         if (err) {
                //             res.json({
                //                 status: 'error',
                //                 msg: err.msg
                //             });
                //             reject();
                //         } else {
                //             connection.query(mysql.format('DELETE FROM lc_media WHERE media_for="project" AND project_id=?', [req.body.id]), function(err, rows) {});
                
                //             connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="project" AND project_id=?', [req.body.id]), function(err, rows) {});
                            
                //             // delete gallery first
                //             if(rows.length > 0){
                //                 for(var flag in rows){
                //                     var filePath = rows[flag].type == 'doc' ? '/uploads/media/documents/'+rows[flag].media_path : '/uploads/media/project/'+rows[flag].media_path; 
                //                     try {
                //                         if (fs.existsSync(path.join(__dirname, '../'+filePath))) {
                //                             fs.unlinkSync(path.join(__dirname, '../'+filePath));
                //                         }
                //                     } catch (error) {
                //                         console.log(error);
                //                     }
                //                     if(flag == (rows.length-1)){
                //                         query="DELETE FROM lc_projects WHERE project_id";
                //                         ucname = "Project";
                //                         name = "project";
                //                         resolve();
                //                     }
                //                 }
                //             } else {
                //                 query="DELETE FROM lc_projects WHERE project_id";
                //                 ucname = "Project";
                //                 name = "project";
                //                 resolve();
                //             }
                //         }
                //     });
                // });
            break;

            case "delete_property":
                
                const delete_plans = new Promise(function(resolve, reject) {
                    connection.query(mysql.format("SELECT media_path FROM lc_floor_plans WHERE plan_for='property' AND project_id = ?", [req.body.id]), function(err, rows) {
                        if (err) {
                            
                            res.json({
                                status: 'error',
                                msg: err.msg
                            });
                            reject();
                        } else {
                            connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="property" AND project_id=?', [req.body.id]), function(d_err, d_rows) {});
                            console.log('num of rows to delete plans',rows);
                            if(rows.length > 0){
                                for(var flag in rows){
                                    var filePath = '/uploads/media/property/'+rows[flag].media_path; 
                                    try {
                                        if (fs.existsSync(path.join(__dirname, '../'+filePath))) {
                                            fs.unlinkSync(path.join(__dirname, '../'+filePath));
                                        }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                    if(flag == (rows.length-1)){
                                        resolve();
                                    }
                                }
                            } else {
                                resolve();
                            }
                        }
                    });
                });

                const delete_media = new Promise(function(resolve, reject) {
                    connection.query(mysql.format("SELECT media_path,type FROM lc_media WHERE type IN ('image','video','doc') AND media_for='property' AND project_id = ?", [req.body.id]), function(err, rows) {
                        if (err) {
                            res.json({
                                status: 'error',
                                msg: err.msg
                            });
                            reject();
                        } else {
                            connection.query(mysql.format('DELETE FROM lc_media WHERE media_for="property" AND project_id=?', [req.body.id]), function(d_err, d_rows) {});
                            console.log('num of rows to delete',rows);
                            if(rows.length > 0){
                                for(var flag in rows){
                                    var filePath = rows[flag].type == 'doc' ? '/uploads/media/documents/'+rows[flag].media_path : '/uploads/media/property/'+rows[flag].media_path; 
                                    try {
                                        if (fs.existsSync(path.join(__dirname, '../'+filePath))) {
                                            fs.unlinkSync(path.join(__dirname, '../'+filePath));
                                        }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                    if(flag == (rows.length-1)){
                                        resolve();
                                    }
                                }
                            } else {
                                resolve();
                            }
                        }
                    });
                });

                Promise.all([delete_plans, delete_media]).then(() => {
                    console.log('here in all')
                    query="DELETE FROM lc_properties WHERE property_id";
                    ucname = "Property";
                    name = "property";
                    connection.query(mysql.format(query+'=?', [req.body.id]), function(err, rows) {
                        if (err) {
                            res.json({
                                status: 'error',
                                msg: err.msg
                            });
                        } else {
                            res.json({
                                status: rows.affectedRows > 0 ? 'success' : 'error',
                                msg: rows.affectedRows == 1? ucname+' deleted successfully!' : 'No record found for this '+name+'!'
                            });
                        }
                    });
                });
            break;

            case"delete_site_media":
                var query_params = new Promise(function(resolve, reject) {
                    url_to_delete = 'uploads/media/site_media/'+req.body.id.trim();
                    if (fs.existsSync(path.join(__dirname, '../'+url_to_delete))) {
                        fs.unlinkSync(path.join(__dirname, '../'+url_to_delete));
                    }
                    query="DELETE FROM site_media WHERE media_path";
                    ucname = "Media";
                    name = "media";
                });
            break;
        }

        if( req.body.action != "delete_property"){
            query_params.then(() => {
                connection.query(mysql.format(query+'=?', [req.body.id]), function(err, rows) {
                    if (err) {
                        //return reject(err);
                        res.json({
                            status: 'error',
                            msg: err.msg
                        });
                    } else {
                        res.json({
                            status: rows.affectedRows > 0 ? 'success' : 'error',
                            msg: rows.affectedRows == 1? ucname+' deleted successfully!' : 'No record found for this '+name+'!'
                        });
                    }
                });
            });
        }
    } else {
        res.json({
            status: 'error',
            msg: 'Invalid parameters passed!'
        });
    }
    
    
});

// Upload gallery
router.post('/upload-gallery', async function(req, res){
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            switch(req.query.action){
                case "images":
                    var fileKeys = Object.keys(req.files);
                    new Promise((resolve, reject) => {
                        var upload_type = req.query.type;
                        fileKeys.forEach(async function(key,index) {
                            var gallery_file = req.files[key];
                            if(gallery_file.mimetype != 'video/mp4' && gallery_file.mimetype != 'video/webm' && gallery_file.mimetype != 'video/ogg'){
                                await sharp(gallery_file.data)
                                .webp({ quality: 20 })
                                .toFile("./uploads/media/"+upload_type+"/"+ gallery_file.name);
                            } else {
                                gallery_file.mv('./uploads/media/'+upload_type+"/"+ gallery_file.name);
                            }
                            if(index == fileKeys.length-1){
                                resolve();
                            }
                        });
                    }).then(() => {
                        //send response
                        res.send({
                            status: true,
                            message: 'Files uploaded',
                        });
                    });
                    
                break;
                case "document":
                    let document = req.files.file;
                    document.mv('./uploads/media/documents/' + document.name);
                    //send response
                    res.send({
                        status: true,
                        message: 'File is uploaded',
                        data: {
                            name: document.name,
                            mimetype: document.mimetype,
                            size: document.size
                        }
                    });
                break;
                case "media":
                    var fileKeys = Object.keys(req.files);
                    var site_media = [];
                    new Promise(function(resolve, reject) {
                        fileKeys.forEach(async function(key) {
                            const gallery_file = req.files[key];
                            if(gallery_file.mimetype != 'video/mp4' && gallery_file.mimetype != 'video/webm' && gallery_file.mimetype != 'video/ogg' && gallery_file.mimetype != 'application/pdf' && gallery_file.mimetype != 'application/msword' && gallery_file.mimetype != 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
                                await sharp(gallery_file.data)
                                .webp({ quality: 20 })
                                .toFile("./uploads/media/site_media/" + gallery_file.name);
                            } else {
                                gallery_file.mv('./uploads/media/site_media/' + gallery_file.name);
                            }
                            var record = [gallery_file.mimetype,gallery_file.name];
                            site_media.push(record);
                            if(site_media.length == fileKeys.length){
                                resolve('uploaded');
                            }
                        });
                    }).then((message) => {
                        if(site_media.length > 0){
                            connection.query(mysql.format('INSERT INTO site_media (type, media_path) VALUES ?',[site_media]), function(error, results, cols) {
                                if(error) throw error
                                res.send({
                                    status: true,
                                    message: 'Files uploaded',
                                });
                            });
                        }
                    });
                    
                break;
                default:
                    res.send({
                        status: 401,
                        message: 'Action not found',
                    });
                break;
            }
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Get media of website
router.get('/media', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE media_path LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_MEDIA_PER_PAGE_LIMIT);
    limit = limit * per_page;
    connection.query('SELECT count(*) as total FROM site_media'+searchTearm, function(error, rws, flds) {
        if(error) throw error
        connection.query(mysql.format('SELECT * FROM site_media '+searchTearm+' ORDER BY media_id DESC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws[0].total/per_page) == 0 ? 1 : Math.ceil(rws[0].total/per_page);
            res.render('Media/media',{
                title: 'Media',
                session: res.locals.session,
                mediaList: rows,
                pages: totalpages,
                current: cur,
                search: hasterm,
                site_url: req.protocol + '://' + req.get('host'),
                paginationUrl: searchTearm != '' ? '/media?search='+hasterm+'&page=' : '/media?page='
            });
        });
    });
});

// get all properties listing
router.get('/properties', authenticate.verify, function (req, res) {
    var hasterm = typeof req.query.search != "undefined" ? req.query.search.trim() : '';
    var searchTearm = hasterm != "" ? ' WHERE tbl_properties.title LIKE "%'+hasterm+'%" || tbl_properties.detail LIKE "%'+hasterm+'%" || tbl_properties.address LIKE "%'+hasterm+'%" || tbl_city.name LIKE "%'+hasterm+'%" || tbl_properties.pincode LIKE "%'+hasterm+'%" || tbl_properties.area LIKE "%'+hasterm+'%" || tbl_properties.property_age LIKE "%'+hasterm+'%" || tbl_properties.status LIKE "%'+hasterm+'%" || tbl_properties.furnishing LIKE "%'+hasterm+'%" || tbl_types.name LIKE "%'+hasterm+'%"' : '';
    var cur = typeof req.query.page != "undefined" ? parseInt(req.query.page) : 1;
    var limit = cur - 1;
    var per_page = parseInt(process.env.ADMIN_PER_PAGE_LIMIT);
    limit = limit * per_page;

    const promise_count = new Promise((resolve, reject) => {
        connection.query('SELECT count(*) as total FROM lc_properties as tbl_properties JOIN lc_types as tbl_types ON tbl_types.type_id = tbl_properties.type JOIN lc_city as tbl_city ON tbl_city.city_id = tbl_properties.city'+searchTearm, function(errs, trows, tfields) {
            if(errs){
                reject(errs);
            } else {
                resolve({'rows': trows[0]});
            }
        });
    });

    Promise.all([promise_count]).then((data_vals) => {

        var rws = data_vals[0].rows;

        connection.query(mysql.format('SELECT tbl_properties.property_id,tbl_properties.title,tbl_properties.address,tbl_city.name as city_name,tbl_properties.price,tbl_properties.property_age, tbl_properties.status,tbl_properties.visibility,tbl_types.name as project_type FROM lc_properties as tbl_properties JOIN lc_types as tbl_types ON tbl_types.type_id = tbl_properties.type JOIN lc_city as tbl_city ON tbl_city.city_id = tbl_properties.city'+searchTearm+' ORDER BY property_id DESC LIMIT ?,?',[limit,per_page]), function(err, rows, fields) {
            if(err) throw err
            var totalpages = Math.ceil(rws.total/per_page) == 0 ? 1 : Math.ceil(rws.total/per_page);
            res.render('Property/properties',{
                title: 'Properties',
                session: res.locals.session,
                propertiesList: rows,
                pages: totalpages,
                current: cur,
                search: hasterm,
                paginationUrl: searchTearm != '' ? '/project?search='+hasterm+'&page=' : '/project?page='
            });
        });
    });
});

// Edit Project
router.get('/property/:id?', authenticate.verify, async function (req, res) {

    const promise_neighbourhood = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_neighbourhood ORDER BY neighbour_id ASC', async function(error, rows, flds) {
            if(error){
                reject(error);
            } else {
                resolve({'neighbourhood': rows});
            }
        });
    });

    const promise_ameneties = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_amenities ORDER BY aid ASC', async function(error, datarws, clms) {
            if(error){
                reject(error);
            } else {
                resolve({'ameneties': datarws});
            }
        });
    });

    const promise_city = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_city ORDER BY city_id ASC', async function(error, dataRows, clms) {
            if(error){
                reject(error);
            } else {
                resolve({'cities': dataRows});
            }
        });
    });

    const promise_type = new Promise((resolve, reject) => {
        connection.query('SELECT * FROM lc_types ORDER BY type_id ASC', function(errs, trows, tfields) {
            if(errs){
                reject(errs);
            } else {
                resolve({'types': trows});
            }
        });
    });

    Promise.all([promise_neighbourhood,promise_ameneties,promise_city,promise_type]).then((messages) => {
        
        var neighbourhood = messages[0].neighbourhood,
        ameneties = messages[1].ameneties,
        cities = messages[2].cities,
        types = messages[3].types;

        var cur = typeof req.params.id != "undefined" ? parseInt(req.params.id) : 0;
        if(cur){
            connection.query('SELECT * FROM lc_media WHERE media_for="property" AND project_id = ?',[cur], function(errs, mrows, tfields) {
                if(errs) throw errs

                connection.query('SELECT * FROM lc_floor_plans WHERE plan_for="property" AND project_id = ?',[cur], function(errs, prows, tfields) {
                    if(errs) throw errs

                    connection.query(mysql.format('SELECT * FROM lc_properties WHERE property_id = ?',[cur]), async function(error, rows, flds) {
                        if(error) throw error
                        
                        if(rows.length > 0){
                            res.render('Property/property',{
                                title: 'Edit Property',
                                session: res.locals.session,
                                success: res.locals.success,
                                error: res.locals.error,
                                data: rows[0],
                                media: mrows,
                                plans: prows,
                                dataNeighbour: neighbourhood,
                                dataAmenities: ameneties,
                                dataCities: cities,
                                dataTypes: types
                            });
                        } else {
                            res.render('Auth/pages_404',{
                                title: 'Page Not Found',
                                session: res.locals.session,
                            });
                        }
                    });
                });
            });
        } else {
            res.render('Property/property',{
                title: 'Add Property',
                session: res.locals.session,
                success: res.locals.success,
                error: res.locals.error,
                data: '',
                media: '',
                plans: '',
                dataNeighbour: neighbourhood,
                dataAmenities: ameneties,
                dataCities: cities,
                dataTypes: types
            });
        }
    });
});

// Save property
router.post('/property', authenticate.verify, async function (req, res) {
    
    if(req.body.property_name != "") {
        var neighbourhood = '', ameneties='';
        var is_featured = req.body.featured != undefined ? 1 : 0;
        if(req.body.neighbourhood != undefined){
            neighbourhood = req.body.neighbourhood.length > 1 ? req.body.neighbourhood.join(',') : req.body.neighbourhood;
        }

        if(req.body.ameneties != undefined) {
            ameneties = req.body.ameneties.length > 1 ? req.body.ameneties.join(',') : req.body.ameneties;
        }
        
        if(req.body.frm_id == 0){
            
            connection.query(mysql.format('INSERT INTO lc_properties (uid, title, detail, is_featured, address, city, pincode, area, status, property_age, furnishing, type, neighbourhood, amenities, property_for, price, additional_features, map_address, info_title, info_description, adr_lat, adr_long) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [res.locals.session.user.id, req.body.property_name.trim(),req.body.form_content,is_featured,req.body.address.trim(),parseInt(req.body.city),req.body.zip,req.body.area.trim(),req.body.status.trim(),req.body.property_age,req.body.furnishing.trim(),parseInt(req.body.project_type), neighbourhood, ameneties, req.body.property_for, req.body.property_price,req.body.add_specs,req.body.property_location,req.body.loc_name,req.body.loc_detail,req.body.loc_lat,req.body.loc_long]), function(err, result, fields) {
                
                if(err) throw err

                var project_id = result.insertId;
                var gallery_records = [];
                
                var gallery_files = req.body.hdn_gallery;
                if(gallery_files != ""){
                    gallery_files = JSON.parse(gallery_files);
                    for(var flag =0; flag < gallery_files.length; flag++){
                        var record = [project_id,'property',gallery_files[flag].type,0,gallery_files[flag].name];
                        gallery_records.push(record);
                    }
                }

                var videosData = req.body.vid_data;
                if(videosData != ""){
                    videosData = JSON.parse(videosData);
                    for(var flag =0; flag < videosData.length; flag++){
                        var record = [project_id,'property','url',videosData[flag].in_gallery,videosData[flag].video_url];
                        gallery_records.push(record);
                    }
                }

                var brochure = req.body.hdn_document.trim();
                if(brochure != ""){
                    var record = [project_id,'property','doc',0,brochure];
                    gallery_records.push(record);
                }

                var plansData = req.body.plans_data;
                var plansRecords = [];
                if(plansData != ""){
                    plansData = JSON.parse(plansData);
                    for(var flag =0; flag < plansData.length; flag++){
                        var record = [project_id,'property',plansData[flag].plan_title,plansData[flag].plan_desc, plansData[flag].image];
                        plansRecords.push(record);
                    }
                }

                if(gallery_records.length > 0){
                    connection.query(mysql.format('INSERT INTO lc_media (project_id, media_for, type, in_gallery, media_path) VALUES ?',[gallery_records]), function(error, results, cols) {
                        if(error) throw error

                        if(plansRecords.length > 0){
                            connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, plan_for, title, description,media_path) VALUES ?',[plansRecords]), function(error, result, cols) {
                                if(error) throw error
                                
                                req.flash('success', 'Property added successfully.');
                                res.redirect('/property');
                            });
                        } else {
                            req.flash('success', 'Property added successfully.');
                            res.redirect('/property');
                        }
                    });
                } else {
                    if(plansRecords.length > 0){
                        connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, plan_for, title, description, media_path) VALUES ?',[plansRecords]), function(error, reslt, cols) {
                            if(error) throw error
                            
                            req.flash('success', 'Property added successfully.');
                            res.redirect('/property');
                        });
                    } else {
                        req.flash('success', 'Property added successfully.');
                        res.redirect('/property');
                    }
                }
            });
        } else {

            var project_id = parseInt(req.body.frm_id);

            connection.query(mysql.format('UPDATE lc_properties SET title=?, detail=?, is_featured=?, address=?, city=?, pincode=?, area=?, status=?, property_age=?, furnishing=?, type=?, neighbourhood=?, amenities=?, property_for=?, price=?, additional_features=?, map_address=?, info_title=?, info_description=?, adr_lat=?, adr_long=? WHERE property_id=?', [req.body.property_name.trim(),req.body.form_content,is_featured,req.body.address.trim(),parseInt(req.body.city),req.body.zip,req.body.area.trim(),req.body.status.trim(),req.body.property_age,req.body.furnishing.trim(),parseInt(req.body.project_type), neighbourhood, ameneties, req.body.property_for, req.body.property_price,req.body.add_specs,req.body.property_location,req.body.loc_name,req.body.loc_detail,req.body.loc_lat,req.body.loc_long, project_id]), function(err, result, fields) {
                
                if(err) throw err

                var gallery_records = [];
                
                var gallery_files = req.body.hdn_gallery;
                if(gallery_files != ""){
                    gallery_files = JSON.parse(gallery_files);
                    for(var flag =0; flag < gallery_files.length; flag++){
                        var record = [project_id,'property',gallery_files[flag].type,0,gallery_files[flag].name];
                        gallery_records.push(record);
                    }
                }

                var videosData = req.body.vid_data;
                if(videosData != ""){
                    videosData = JSON.parse(videosData);
                    for(var flag =0; flag < videosData.length; flag++){
                        var record = [project_id,'property','url',videosData[flag].in_gallery,videosData[flag].video_url];
                        gallery_records.push(record);
                    }
                }

                var brochure = req.body.hdn_document.trim();
                if(brochure != ""){
                    var record = [project_id,'property','doc',0,brochure];
                    gallery_records.push(record);
                }

                var plansData = req.body.plans_data;
                var plansRecords = [];
                if(plansData != ""){
                    plansData = JSON.parse(plansData);
                    for(var flag =0; flag < plansData.length; flag++){
                        //var record = [project_id,plansData[flag].plan_title,plansData[flag].plan_desc];
                        var record = [project_id, 'property', plansData[flag].plan_title, plansData[flag].plan_desc, plansData[flag].image];
                        plansRecords.push(record);
                    }
                }

                var del_plan_media = req.body.delete_plan_media;
                if(del_plan_media != ""){
                    files_to_del = JSON.parse(del_plan_media);
                    for(var flag =0; flag < files_to_del.length; flag++){
                        url_to_delete = 'uploads/media/property/'+files_to_del[flag];
                        if (fs.existsSync(path.join(__dirname, '../'+url_to_delete))) {
                            fs.unlinkSync(path.join(__dirname, '../'+url_to_delete));
                        }
                    }
                }

                var del_media = req.body.delete_media;
                if(del_media != ""){
                    del_files = JSON.parse(del_media);
                    for(var flag =0; flag < del_files.length; flag++){
                        if(del_files[flag].type == "doc"){
                            url_to_delete = 'uploads/media/documents/'+del_files[flag].name;
                        } else {
                            url_to_delete = 'uploads/media/property/'+del_files[flag].name;
                        }
                        if (fs.existsSync(path.join(__dirname, '../'+url_to_delete))) {
                            fs.unlinkSync(path.join(__dirname, '../'+url_to_delete));
                        }
                    }
                }
                
                if(gallery_records.length > 0){
                    connection.query(mysql.format('DELETE FROM lc_media WHERE media_for="property" AND project_id = ?',[project_id]), function(merr, mres, mcols) {
                        
                        if(merr) throw merr

                        connection.query(mysql.format('INSERT INTO lc_media (project_id, media_for, type, in_gallery, media_path) VALUES ?',[gallery_records]), function(error, results, cols) {
                            if(error) throw error

                            connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="property" AND project_id = ?',[project_id]), function(perr, pres, pcols) {
                        
                                if(perr) throw perr

                                if(plansRecords.length > 0){
                                    connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, plan_for, title, description, media_path) VALUES ?',[plansRecords]), function(error, result, cols) {
                                        if(error) throw error
                                        
                                        req.flash('success', 'Property updated successfully.');
                                        res.redirect('/property');
                                    });
                                } else {
                                    req.flash('success', 'Property updated successfully.');
                                    res.redirect('/property');
                                }
                            });
                        });
                    });
                } else {
                    connection.query(mysql.format('DELETE FROM lc_floor_plans WHERE plan_for="property" AND project_id = ?',[project_id]), function(perr, pres, pcols) {
                        if(perr) throw perr
                        if(plansRecords.length > 0){
                            connection.query(mysql.format('INSERT INTO lc_floor_plans (project_id, plan_for, title, description, media_path) VALUES ?',[plansRecords]), function(error, reslt, cols) {
                                if(error) throw error
                                
                                req.flash('success', 'Property updated successfully.');
                                res.redirect('/property');
                            });
                        } else {
                            req.flash('success', 'Property updated successfully.');
                            res.redirect('/property');
                        }
                    });
                }
            });
        }
        
    } else {
            req.flash('error', 'Please fill all required fields.')
            res.redirect('/property');
    }
});
router.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

router.get('/404', function(req, res){
    res.render('Auth/pages_404',{
      title: 'Page Not Found',
      session: res.locals.session,
    });
});
module.exports = router;