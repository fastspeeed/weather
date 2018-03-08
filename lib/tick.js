const Influx = require('influx');

const influxParse =(hostname,nodename,logger=console)=>{
	
	const influx= new Influx.InfluxDB({
	 host: hostname,
	 database: 'metar',
	 schema: [
	   {
		 measurement: 'parse',
		 fields: {
		   fails: Influx.FieldType.INTEGER,
		   totals: Influx.FieldType.INTEGER,
		   duration: Influx.FieldType.INTEGER,
		   error:Influx.FieldType.STRING,
		   
		 },
		 tags: [
		   'node'
		 ]
	   }
	 ]
	})
	//influx.getDatabaseNames().then(names=>{
	//	names.includes(''
	//}
	influx.createDatabase()
	return writeParseTick(influx,nodename,logger);
}
const writeParseTick=(influxParse,nodename,logger=console)=>(data)=>{

	try{
	influxParse.createDatabase('metar').then(()=>
	{influxParse.writePoints([
		  {
			measurement: 'parse',
			tags: { node: nodename },
			fields: { fails:data.fails, totals: data.totals,duration:data.duration,error:data.error },
		  }
		])
	//	.then(() => {
	//	  return influxParse.query(`
	//		select * from parse
	//		order by time desc
	//		limit 10
	//	  `)
	//	}).then(rows => {
	//	  rows.forEach(row => console.log(`A request to ${row.totals} ${row.fails} ${row.error} took ${row.duration}ms`))
	//	})
		.catch((ex)=>{
			logger.error(ex);
		})
	})
	}catch(ex){
		logger.error(ex);
	}
		
}
module.exports={
  influxParse,
 
}

//influxParse('localhost')({totals:100,duration:10,fails:1,error:'ftp'})

