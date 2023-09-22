var constants = require('./lib/constants');

const verify = (req, res, next) => {
    if(res.locals.session.loggedin && typeof res.locals.session.user.id != undefined){
        var req_route = req.originalUrl;
        var userrole = res.locals.session.user.role;
       
        //if(Object.keys(constants.disallowedPaths).indexOf(userrole) && constants.disallowedPaths[userrole].includes(req_route)){
        if (Object.keys(constants.disallowedPaths).indexOf(userrole) && constants.disallowedPaths[userrole].some(v => {
            var $array = req_route.split('/');
            if($array.includes(v)){
                return true;
            }
            return false;
        })) {
            res.redirect('/404');
        } else {
            next();
        }
    } else {
        req.flash('error', 'Please login to access portal!')
        res.redirect('/')
    }
}

const isloggedIn = (req, res, next) => {
    if(res.locals.session.loggedin && typeof res.locals.session.user.id != undefined){
        console.log('request',res.locals.session);
        var req_route = req.originalUrl;
        var userrole = res.locals.session.user.role;
        if (Object.keys(constants.disallowedPaths).indexOf(userrole) && constants.disallowedPaths[userrole].some(v => {
            var $array = req_route.split('/');
            if($array.includes(v)){
                return true;
            }
            return false;
        })){
            res.redirect('/404');
        } else {
            res.redirect('/dashboard');
        }
    } else {
        next();
    }
}

module.exports = {
  verify,
  isloggedIn
};