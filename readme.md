# 航空气象报文解析


  从报文数据中取到原始数据，解析为json格式数据，转换到xml,上传xml到ftp
  
  当前版本为beta版本
  


### 修改日志


#### ２０１８-3-8


   移除使用winows 2008计划任务的配置，软件自己处理定时迭代。
  
   在app.json中增加迭代时间nextInterval,以分钟为单位，表示下一次运行在几分钟以后。
  
   增加批处理文件run.bat,运行后软件开始循环导出报文。注意同时只能运行一个。这个批处理放置到开机自动运行中。在桌面建立快捷方式。
  
  
  
#### ２０１８-3-７


   增加软件监控。使用flux全套软件。使用见下面监控部分
    
   增加最后导出时间判断，如果最后导出时间小于现在时间减去指定时间间隔，最后导出时间为现在时间减去指定时间间隔。
    
   增加时间间隔参数interval在app.json中，单位为分钟，缺省设置为１０
 
 

  

### 安装

* 安装 node js

  下载地址　https://nodejs.org/en/
  

* 安装 node-oracledb 的依赖库

    参考手册　https://oracle.github.io/node-oracledb/INSTALL.html#quickstart
    

  安装　oracle instant-client

    下载地址　http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html
    
  
  解压缩到任意路径
  

  增加环境变量
    
    如果是windows系统，加解压缩路径到windows环境变量path中
    

* 　安装　metar 

   ```
   git clone https://github.com/fastspeeed/weather/
   cd weather
   npm install
   ```
      
* 运行metar
  ```
   cd weather
   npm start
  ```  
  在ｗｉｎｄｏｗｓ下
  
  可以运行run.bat 或者运行桌面快捷方式

### 配置文件

* 数据库和ftp参数设置

　复制app.json.template 到app.json
 

```
{
  "db": {
    "user"          : "metar",//数据库用户名
    "password"      : "metar",//数据库密码
    "connectString" : "10.0.1.2/metar"//数据库地址和服务名
  },
  "query": "SELECT RPTCONTENT FROM rpt01_cac WHERE tt = 'SA' and INSERTTIME >to_date(:now,'yyyy-MM-dd  HH24:mi:ss')",//查询报文语句，一般不需更改
  "maxDate":"SELECT max(INSERTTIME) FROM rpt01_cac WHERE tt = 'SA'",//查询最后报文日期语句，一般不需更改
  "ftp":{
    "host":"10.0.1.1",//ftp地址
    "port":21,//端口
    "user":"mocoolka",//用户名
    "password":"mocoolka"//密码
  },
  "interval":10， //间隔时间，分钟为单位。运行时，软件判断最后一次导入时间与当前时间差值如果大于设定的间隔，系统会使用当前时间减去间隔时间做为查询时间
  "nextInterval":2 //下一次运行间隔，单位为分钟
}
```


*  日志

 日志中的时间为格林威治标准时间

　错误日志　
    
    文件名　error.log
    
    含有系统错误
    
  信息日志
  
    文件名　info.log
    
    含有每次导出的日志信息
 
 
* 最后的导出时间
　
   文件running.json，放置最后的导出时间，无需手工修改，系统自动维护。
   
### 系统监控

　系统监控用http访问
 
  * 运行监控
  
    运行３个应用程序
    ```
    \influx\influxdb-1.5.0-1\influxd.exe
    \influx\chronograf-1.4.2.1-1\chronograf.exe
    \influx\telegraf\telegraf.exe
    ```
  
  
  * 报文解析监控路径   
   
   http://localhost:8888/sources/1/dashboards/1
   
  * 报文主机负载监控
     
   http://localhost:8888/sources/1/hosts/WIN-1EUIN6T3EEV
   
   * 配置文档
   
   https://docs.influxdata.com/influxdb/v1.5/
  
   
### 核对软件是否正常工作步骤

 *  查看报文解析监控是否正常

 *  查看ftp最后上传时间
 
 *  检查最后导出时间　running.json（北京时间），如果时间有误，一般是最后的导出时间为当前时间减去１０分钟。请核对软件是否运行
 
 *  查看日志　error.log　info.log
 
  
 
 
 
 
   
　
### 注意事项

　* beta 版本增加了对导入时间的处理，不需再手工修改上次运行时间
 
 
 
### 开发用到命令

```
git config --global http.proxy http://192.6.204.7:808
git add .
git commit -m "comment"
git push

npm config set proxy http://192.6.204.7:808
npm config set https-proxy http://192.6.204.7:808
npm config set registry https://registry.npm.taobao.org
```

### influx 命令

http://localhost:8086/query?q=show+databases

### windows 2008 端口映射命令

增加
```
netsh interface portproxy add v4tov4 listenport=21 listenaddress=192.6.204.11 connectport=21 connectaddress=172.20.102.5
```
查看
```
netsh interface portproxy  show all
``` 
 
 
 ### ubuntu docker 版本安装（未完成）
 
* 安装ubuntu server 16.4 lts

   https://www.ubuntu.com/download/server

* 连接到网络

   假设服务器不能通过缺省网络设置上网，需要修改路由和dns

   修改路由　sudo route add default gw 192.168.x.x 这个网址是能网关

   修改dns vi /etc/resolv.conf 

   修改　nameserver 192.168.2.2　到正确的dns

   其中vi的操作为

   按i为编辑状态

   按esc为命令状态

   在命令状态下键入:w为写文件 ：q为退出


* 安装docker 


### oracle vm 安装（已放弃）

* 在运行机安装 oracle vm virtualbox

* 复制虚机文件到运行机

* 启动虚机 

　　password:Mocoolka2017
　　运行程序在c:/mk/metar/

* 修改时间配置

　　
   路径　c:/mk/metar/running.json文件

　　这里放置取出数据的最后时间，时间格式为格林威治标准时间。

　　运行时修改到当前时间减去9小时。以后程序会自动更新


