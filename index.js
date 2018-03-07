const oracledb = require('oracledb');
const fs = require('fs');
const moment = require('moment');
//let config=require('./app.json');
//let running=require('./running.json');
const { createLogger, format,transports } = require('winston');
const parserJson = require("./lib/parser.js");

const transform = require("./lib/transform.js");
const removeEmpty =require("./lib/remove-empty.js");
const Client = require('ftp');
const { combine, timestamp,  prettyPrint } = format;
const uuidv4 = require('uuid/v4');

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        //new transports.File({ filename: 'combined.log' })
    ]
});
const getBeginDate=(interval=10*60*1000)=>(logDate,nowDate)=>nowDate-logDate>10*60*1000?nowDate:logDate;


const beginTimer = getBeginDate()(logDate,moment()).format("YYYY-MM-DD HH:mm:ss")


const ftpReady=(config,running)=>{
    const ftp = new Client();
    ftp.on('ready', function() {
        dbReady(ftp,config,running);
/*        c.put('foo.txt', 'foo.remote-copy.txt', function(err) {
            if (err) throw err;
            c.end();
        });*/
    });
    ftp.on('error',function (err) {
        logger.error({config:config.ftp,error:err});
    })
    ftp.connect(config.ftp);
}
const dbReady=(ftp,config,running)=>{
    oracledb.fetchAsString = [ oracledb.CLOB ];
    oracledb.getConnection(
        config.db,
        function(err, connection)
        {
            if (err) {
                logger.error({config:config.db,error:err.message});
                ftp.end();
                return;
            }
            let logDate=moment(running.date,"YYYY-MM-DD HH:mm:ss")
            const beginTimer = getBeginDate()(logDate,moment()).format("YYYY-MM-DD HH:mm:ss")
            connection.execute(config.query,[beginTimer],
                function(err, result) {
                    if (err) { logger.error({query:config.query,error:err.message}); doRelease(connection,ftp); return; }
                    if (result.rows.length === 0)
                        logger.info("No results");
                    else {
                        logger.info(result.rows.length);
                        createJson(result.rows,ftp)
                    }
                    getMaxDate(connection,ftp,config,running)
                   
                    
                });
        });
}

const getMaxDate=(connection,ftp,config,running)=>{
    connection.execute(config.maxDate,
        function(err, result) {
            if (err) { logger.error({query:config.maxDate,error:err.message}); doRelease(connection,ftp); return; }
            if (result.rows.length !== 1)
                logger.error({query:config.maxDate,error:'count must be 1'});
            else {
				let maxdate=result.rows[0][0];
                
               let nowDate=moment(maxdate).format("YYYY-MM-DD HH:mm:ss");
			    fs.writeFileSync(running.path+'/running.json',JSON.stringify({date:nowDate}));
				doRelease(connection,ftp)
            }
        });
 
}

const createJson=(rows,ftp)=>{
   // for(let i=0;i<1;i++) {
   for(let i=0;i<rows.length;i++) {
       let clob = rows[i][0];
       try {
           let data = parserJson(clob);
           
           let transformJson=removeEmpty(transform.transformToJson(data));
		   transformJson.meta=clob
		   let transformXml=transform.transformToXml('weather',transformJson);
           //let filePath='./upload1/';
           let fileName=uuidv4()+".xml";
           //fs.writeFileSync(uploadPath+fileName,transformXml);
           ftp.put(transformXml, fileName, function(err) {
               if (err) {
                   logger.info({src:clob,err})
               };
           });
		   

       }
       catch(err){
           logger.info({src:clob,err})
       }

   }
}


function doRelease(connection,ftp)
{
    connection.close(
        function(err) {
            if (err)
                logger.error(err.message);
        });
    ftp.end();
}
const transport =(config,running)=>{

}
module.exports= ftpReady;

//console.log(moment().format("YYYY-MM-DD  HH:mm:ss"));