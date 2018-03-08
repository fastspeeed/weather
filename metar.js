const {ftpReady} =require('./index');
const interval=2*60*1000;
function  myfunc(){
    ftpReady();
}
setInterval(myfunc,interval);