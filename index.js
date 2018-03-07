const oracledb = require('oracledb');
const fs = require('fs');
const moment = require('moment');
let config=require('./app.json');
let running=require('./running.json');
const { createLogger, format,transports } = require('winston');
const parserJson = require("./lib/parser.js");

const transform = require("./lib/transform.js");
const removeEmpty =require("./lib/remove-empty.js");
const { combine, timestamp,  prettyPrint } = format;
const uuidv4 = require('uuid/v4');

const convertBeijinUtcToStand=(str)=>moment(str,"YYYY-MM-DD HH:mm:ss").utcOffset(0)
const convertStandToBeijing=(str)=>	moment(str,"YYYY-MM-DD HH:mm:ss").utcOffset(16*60)
const momentToString=(d)=>d.format("YYYY-MM-DD HH:mm:ss");
const stringToMoment=(str)=>moment(str,"YYYY-MM-DD HH:mm:ss");
const getBeginDate=(interval=config.interval*60*1000)=>(logDate,nowDate)=>nowDate-logDate>interval|nowDate<=logDate?nowDate.subtract(interval/1000,'seconds'):logDate;


//const beginTimer = getBeginDate()(logDate,moment()).format("YYYY-MM-DD HH:mm:ss")
const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'info' }),
        // new transports.File({ filename: 'combined.log' })
    ]
});

const Client = require('ftp');

const ftpReady=()=>{
    const ftp = new Client();
    ftp.on('ready', function() {
        dbReady(ftp);
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
const dbReady=(ftp)=>{
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
            let logDate=stringToMoment(running.date);
			let beginTimer=momentToString(getBeginDate()(logDate,moment()));
			console.log(beginTimer);
            const beginTimerStand = momentToString(convertBeijinUtcToStand(beginTimer));
			console.log(beginTimerStand);
            connection.execute(config.query,[beginTimerStand],
                function(err, result) {
                    if (err) { logger.error({query:config.query,error:err.message}); doRelease(connection,ftp); return; }
                    if (result.rows.length === 0)
                        logger.info("No results");
                    else {
                        logger.info(`record count=${result.rows.length}`);
                        createJson(result.rows,ftp)
                    }
                    console.log('over')
					getMaxDate(connection,ftp)
                   
                    
                });
        });
}

const getMaxDate=(connection,ftp)=>{
    connection.execute(config.maxDate,
        function(err, result) {
            if (err) { logger.error({query:config.maxDate,error:err.message}); doRelease(connection,ftp); return; }
            if (result.rows.length !== 1)
                logger.error({query:config.maxDate,error:'count must be 1'});
            else {
				let maxdate=result.rows[0][0];
               
               let nowDate=moment(maxdate).format("YYYY-MM-DD HH:mm:ss");
			  // console.log(nowDate);
			    fs.writeFileSync('running.json',JSON.stringify({date:momentToString(convertStandToBeijing(maxdate))}));
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
		  // console.log(transformJson)
           let transformXml=transform.transformToXml('weather',transformJson);
          // let filePath='./upload1/';
           let fileName=uuidv4()+".xml";
          // fs.writeFileSync(filePath+fileName,transformXml);
           ftp.put(transformXml, fileName, function(err) {
               if (err) {
                   logger.debug({src:clob,err})
               };
           });
		   

       }
       catch(err){
           logger.debug({src:clob,err})
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
	// logger.info(moment().format("YYYY-MM-DD  HH:mm:ss")+' over')
}
ftpReady();
//console.log(moment().format("YYYY-MM-DD  HH:mm:ss"));