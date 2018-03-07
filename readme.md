# 航空气象报文解析


  从报文数据中取到原始数据，解析为json格式数据，转换到xml,上传xml到ftp
  
  当前版本为beta版本
  

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
   

* 　单独运行 metar

   运行一次可以转换当前时间点以前的数据
   ```
   cd weather
   npm start
   ```
   
   
* 持续运行metar

   在windows系统中配置任务管理　

   执行命令为npm start

   执行目录为 xxx:/weather
   


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
  "interval":10 //间隔时间，分钟为单位。运行时，软件判断最后一次导入时间与当前时间差值如果大于设定的间隔，系统会使用当前时间减去间隔时间做为查询时间
}
```


*  日志

　如果软件有任何问题，请查询error.log,这里放置错误日志
 
 
 
* 最后的导出时间
　
   文件running.json，放置最后的导出时间，无需手工修改，系统自动维护。
   
### 核对软件是否正常工作步骤

 *  查看ftp最后上传时间
 
 *  检查最后导出时间　running.json
 
 *  查看错误日志　error.log
 
 *  如果时间有误，一般是最后的导出时间为当前时间减去１０分钟。请检查window中的任务管理是否运行正常。
 
 
 
 
   
　
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


