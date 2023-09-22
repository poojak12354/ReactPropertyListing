export const authInitialProps = isProtectedRoute => {
    const auth = sessionStorage.getItem('ud_key');
    const currentPath = window.location.pathname;
    if(isProtectedRoute && !auth && currentPath != "/login"){
        return false;
    }
    
    //auth = JSON.parse(decodeURIComponent(JSON.parse(auth)));
    auth = JSON.parse(auth);
    return auth;
};
export default authInitialProps;