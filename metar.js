const {ftpReady} =require('./index');
let config=require('./app.json');
let running=require('./running.json');
const interval=config.nextInterval*60*1000;
ftpReady();
function  myfunc(){
    ftpReady(config,running);
}
setInterval(myfunc,interval);