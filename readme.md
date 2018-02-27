# 航空气象报文解析

从报文数据中取到原始数据，解析为json格式数据，转换到xml,上传xml到ftp

### 安装

* 在运行机安装 oracle vm virtualbox

* 复制虚机文件到运行机

* 启动虚机 

　　password:Mocoolka2017
　　运行程序在c:/mk/metar/

* 修改时间配置

　　
   路径　c:/mk/metar/running.json文件

　　这里放置取出数据的最后时间，时间格式为格林威治标准时间。

　　运行时修改到当前时间减去9小时。以后程序会自动更新


### 维护

* 数据库和ftp参数设置

　路径c:/mk/metar/app.json


```
{
  "db": {
    "user"          : "mhapp",//数据库用户名
    "password"      : "mhapp",//数据库密码
    "connectString" : "192.6.203.102/ZYLDWDB"//数据库地址和服务名
  },
  "query": "SELECT RPTCONTENT FROM rpt01_cac WHERE tt = 'SA' and INSERTTIME >to_date(:now,'yyyy-MM-dd  HH24:mi:ss')",//查询报文语句，一般不需更改
  "maxDate":"SELECT max(INSERTTIME) FROM rpt01_cac WHERE tt = 'SA'",//查询最后报文日期语句，一般不需更改
  "ftp":{
    "host":"172.20.102.5",//ftp地址
    "port":21,//端口
    "user":"telexftp",//用户名
    "password":"telex"//密码
  },
  "date":"2017-03-29 03:00:00"
}
```

* 日志

　如果软件有任何问题，请查询c:/mk/metar/error.log,这里放置错误日志

* 备份

　
　如果核对对机场的报文，可以查询c:/mk/metar/upload/中的xml文件

### 注意事项

* 软件停止运行后，再次启动。

　　修改　c:/mk/metar/running.json文件中的时间，参考安装。

　　如果不修改，软件会取从上次停止时间后的所有报文数据，可能十分缓慢
