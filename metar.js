const run =require('./index');
const interval=2*60*1000;
function  myfunc(){
    run();
}
setInterval(myfunc,interval);