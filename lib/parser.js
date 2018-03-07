
/**
 * 解析气象报文METAR和SPECI
 * @param metarString  报文
 * @returns {{}} 解析后的json对象
 */
let parser=(metarString)=>{

  let matches;
  //把报文用空格拆分到数组中
  let fields = metarString
    .split(" ")
    .map(function(f) {
      return f.trim();
    })
    .filter(function(f) {
      if(f) {
        let e = f.trim().split('/').map(function(f) {
          return f.trim();
        }).filter(function(t) {
          return !!t;
        });

        if (e.length === 0)
          return false;
      }
      return !!f;
    });
  //remove last '='
  if(fields.length>0){
    let lastField=fields[fields.length-1];
    if(lastField.length>0) {
      if (lastField.substring(lastField.length - 1) === '=') {
        fields[fields.length-1]=lastField.substring(0,lastField.length-1);
      }
    }
  }
  let result = {};
  //解析类型
  parseType(result,fields)
  //解析是否修正
  //parseCorrection(result,fields);
  //解析发送站点
  parseStation(result,fields);
  //解析日期
  parseDate(result,fields);
  //解析是否自动采集
  parseAuto(result,fields);
  //再次解析是否修正
  //parseCorrection(result,fields);
  //解析风向/风速/阵风/风向转变
  parseWind(result,fields);
  //解析是否cavok
  parseCavok(result,fields);
  //解析能见度
  parseVisibility(result,fields);
  //解析跑道视程
  parseRVR(result,fields);
  //解析天气
  parseWeather(result,fields);
  //解析云层
  parseClouds(result,fields);
  //解析温度
  parseTempDewpoint(result,fields);
  //解析气压
  parseAltimeter(result,fields);
  //解析近时天气
  parseRecentSignificantWeather(result,fields);
  return result;
}
/**
 * 解析名称（Report Name），格式：METAR or SPECI ，如果不存在，赋值为"METAR"
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseType = (resultObject,fields)=> {
  //如果第一项为类型，保存解析值，并从报文数组中删除对应数据
  if (weatherParser.setting.TYPES.indexOf(fields[0]) !== -1) {
    resultObject.type = fields[0];
    fields.shift();
  } else {
    resultObject.type = "METAR";
  }
};
/**
 * 解析站点（Station Identifier）格式：CCCC  必填项
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseStation = (resultObject,fields)=> {
  resultObject.stationAbbr = fields[0];
  fields.shift();
};
/**
 * 解析观测时间（Date/Time of Observation） 格式：YYGGggZ (AUTO) 必填项 AUTO为选填项
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseDate = (resultObject,fields)=> {
  let d = new Date();
  d.setUTCDate(convertToInt(fields[0].slice(0, 2)));
  d.setUTCHours(convertToInt(fields[0].slice(2, 4)));
  d.setUTCMinutes(convertToInt(fields[0].slice(4, 6)));
  resultObject.time = d;
  fields.shift();
};
/**
 * 解析是否自动采集
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseAuto = (resultObject,fields)=> {
  resultObject.auto = fields[0] === "AUTO";
  if(resultObject.auto)
    fields.shift();
};
/**
 * 解析是否修改报文
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseCorrection = (resultObject,fields)=> {
  if (resultObject.correction) {
    return;
  }


  resultObject.correction = false;

  if (fields[0].lastIndexOf("CC", 0) == 0) {
    resultObject.correction = fields[0].substr(2, 1);
    fields.shift();
  }

  if (fields[0].lastIndexOf("COR", 0) == 0) {
    resultObject.correction = true;
    fields.shift();
  }
};
let variableWind = /^([0-9]{3})V([0-9]{3})$/;
/**
 * 解析风向风速（Wind ） 格式：dddffGkkMPH dndndnVdxdxdx
 * 风向（ddd）始终为三位数，以真北为基准，以度数为单位，四舍五入到最接近的10度（第三位数始终为“0”）。
 * 在平均风速为3节或以下，可变方向的情况下，风向（ddd）被编码为“VRB”。
 * 风速（ff）为两位数（如果需要，则为三位数），以MPH、KMH、KT为单位。
 * Gfmfm - 阵风信息
 * 如果阵风速度在观察前10分钟内超过10节或以上的平均速度，则将包括Gfmfm。 如果不满足此条件，则省略Gfmfm。
 * G表示阵风，kk是报告的峰值阵风，根据需要使用两位或三位数字。
 * dndndnVdxdxdx 阵风方向（Variations in Wind Direction ）
 *
 *
 * 理论基础：风向风速：气象风以真北为基准，指风吹来的方向。通常以10度为单位。
 * 地面风向风速的报告包括平均风向风速、阵风风向风速、风向不定、风向变化范围和静风的报告。
 * 其中风向以十度为间隔报告。
 * 在METAR和SPECI报文中，配置自动观测系统（AWOS）或自动遥测站的机场报告的是观测前10分钟的平均风向风速，
 * 其他机场报告的是自观测开始后2分钟的平均风向风速。
 * 风向风速组的形式为“dddffGkkMPH”(或“KT”或“KMH”)
 * 其中“ddd”表示平均风向，“ff”表示平均风速，“G”表示阵风，“kk”表示最大阵风风速。
 * 只有当最大阵风风速比平均风速大5米/秒（或10海里/小时、20千米/小时）或以上时，才报告阵风风速。
 * 静风用“00000”表示，其意义为两分钟或十分钟时距内的风速平均< 0.5m/s的风。
 * 风向不定用“VRB”表示，是指在观测时距内。风向变化> 180° ，平均风速< 2m/s为风向不定。
 * 当风速> 3m/s，风向变化> 180° ，也应确定风向，只有实在无法确定风向时，才视为风向不定。如VRB6KMH。
 * 风向变化范围用“dddVkkk”的形式表示。当在观测前10分钟时段内风向变化达到60度或以上，
 * 且平均风速超过2米/秒时按顺时针方向编报两个风向，中间用“V”分开。如020V090。
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseWind = (resultObject,fields)=> {
  resultObject.wind = {
    gust:false,
    variation: false,
  };

  if (fields[0].match(/^[0-9]{1,4}(SM?)/)) {
    return ;
  }

  let direction = fields[0].slice(0, 3);
  //风向不定
  if (direction === "VRB") {
    //resultObject.wind.direction = "VRB";
    resultObject.wind.variation = true;
  } else {
    resultObject.wind.direction ={};
    resultObject.wind.direction.value=convertToInt(direction);
    resultObject.wind.direction.unit='angle';
  }
  //阵风
  let gust = fields[0].slice(5, 8);


  if (gust[0] === "G") {
    resultObject.wind.maxSpeed={};
    resultObject.wind.gust = true;

    resultObject.wind.maxSpeed.value= convertToInt(gust.slice(1));

  }
  resultObject.wind.speed={};
  resultObject.wind.speed.value = convertToInt(fields[0].slice(3, 5));

  let unitMatch;
  if ((unitMatch = fields[0].match(/KT|MPS|KPH|SM|KMH$/))) {

    resultObject.wind.speed.unit = weatherParser.setting.SPEED_UNITS[unitMatch[0]];
    if(resultObject.wind.maxSpeed)
    resultObject.wind.maxSpeed.unit = resultObject.wind.speed.unit;
  } else {
    throw new Error("Bad wind unit: " + fields[0]);
  }
  fields.shift();
  //风向变化范围
  let varMatch;
  if ((varMatch = fields[0].match(variableWind))) {
    resultObject.wind.variableFromDirection={};
    resultObject.wind.variableFromDirection.value=convertToInt(varMatch[1]);
    resultObject.wind.variableFromDirection.unit='angle';
    resultObject.wind.variableToDirection={}
    resultObject.wind.variableToDirection.value=convertToInt(varMatch[2]);
    resultObject.wind.variableToDirection.unit='angle';
/*    resultObject.wind.variation = {
      min: convertToInt(varMatch[1]),
      max: convertToInt(varMatch[2]),
    };*/
    fields.shift();
  }
};


/**
 * 解析Cavok
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseCavok = (resultObject,fields)=> {
  resultObject.cavok = fields[0] === "CAVOK";
  if(resultObject.cavok)
    fields.shift();;
};
let visibilityVariationExpress = /^([0-9]+)([A-Z]{1,2})/g;
/**
 * 解析能见度（Prevailing Visibility） 格式: VVVV 以米为单位
 *[0-9]+[N|E|S|W|NW|NE|SW|SE] 匹配能见度和方向
 * 基础理论：能见度通常以“米”为单位，但在北美国家中也常以“英里”为单位，当能见度等于或大于10000米时，编报“9999”（或“P6SM”）
 * 能见度小于800米时，以50米为量级编报，在大于等于800米且小于5000米时，以100米为等级编报，在大于等于5000米且小于10000米时，以1000米为等级，
 * 大于或等于10000时编“9999”（或P6SM）
 * 当在观测时间内，出现以下情况时,使用“CAVOK”这个术语
 * a） 能见度10公里以上；
 * b） 没有低于1500米（5000英尺）的云，或没有低于扇区最高低限海拔高度的云，两者取其大，并且没有积雨云；
 * c） 没有对航空重要的天气现象。
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */

  let parseVisibility = (resultObject,fields)=> {

    resultObject.visibility = {};
    resultObject.visibility.variations= [];



    if (resultObject.cavok)
      return ;

    if (fields[0] === "////"){
      fields.shift();
      return;
    }
    resultObject.visibility.value = convertToInt(fields[0].slice(0, 4));
    fields.shift();
    if (fields[0].match(/^[0-9]+[N|E|S|W|NW|NE|SW|SE]/)) {

      let matches;
      while ((matches = visibilityVariationExpress.exec(fields[0])) != null) {
        if (matches.index === visibilityVariationExpress.lastIndex) {
          visibilityVariationExpress.lastIndex++;
        }
        let variation={};
        variation.value = matches[1];
        variation.direction = matches[2];
        resultObject.visibility.variations.push(variation);
        fields.shift();
      }

    }
}

let RVRExpresss = /(R\d{2})([L|R|C])?(\/)([P|M])?(\d+)(?:([V])([P|M])?(\d+))?([N|U|D])?(FT)?/g;

/**
 * 解析跑道视程(Runway Visual Range ) 格式：RDRDR/VRVRVRVR/i
 * RDRDR R是组指示器，后面是DRDR，它是跑道标识符（例如“06”），如果 有两个或更多个平行跑道，可以附加字母“L”，“C”或“R”（左，中心或右）。
 * VRVRVRVR是以米为单位的的RVR的值，使用三位或四位数字。
 * 最低可测量值之前的“M”（或“最高”之前的“P”）表示该值超出了仪器范围。
 * 表示RVR趋势。 编码为“U”或“D”（向上或向下 ）。
 * 如果没有观察到明显的变化，则趋势（i）被编码为“N”。 如果不可能确定趋势，则省略/ i。
 * 基础理论:跑道视程（RVR）用“RDD/VVVVI”的形式表示，其中“DD”表示跑道号，“VVVV”表示跑道视程的数值，
 * “I”表示跑道视程在观测前十分钟的变化趋势，有“U、N、D”三种情况，“U”表示跑道视程变好，“N”表无变化，“D”表变差。如R18/1000U。
 * 根据《民用航空公约附件三》的建议，在各方向水平能见度或RVR低于2000米时，应对RVR进行观测。RVR估计的下限应为50米，上限应为2000米。
 * 跑道视程低于50米时编写为M0050；在大于等于50米且小于400米时，以25米为等级编报；在大于等于400米且小于800米时，以50米为等级；
 * 在大于等于800米且小于或等于2000米时，以100米为等级；大于2000米时，编写P2000
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseRVR = (resultObject,fields)=> {
  if (resultObject.cavok)
    return ;

  resultObject.runways=[]
  while (fields[0].match(/^R[0-9]+/)) {
    let matches;

    while ((matches = RVRExpresss.exec(fields[0])) != null) {
      if (matches.index === RVRExpresss.lastIndex) {
        RVRExpresss.lastIndex++;
      }

      let rvr = {
        code: matches[1],
        direction: matches[2],
      //  seperator: matches[3],
        minIndicator: matches[4],
      //  minValue: matches[5],
        variableIndicator: matches[6],
        maxIndicator: matches[7],
       // maxValue: matches[8],
        trend: matches[9],
       // unit: matches[10],
      };
      let unit = matches[10];
      if(unit){
        unit=weatherParser.setting.LENGTH_UNITS[unit];

      }
      if(!unit)
        unit='length-meter';
      if(matches[5]){
        rvr.minValue={};
        rvr.minValue.value=matches[5];
        rvr.minValue.unit=unit;
      }
      if(matches[8]){
        rvr.maxValue={};
        rvr.maxValue.value=matches[8];
        rvr.maxValue.unit=unit;
      }
      resultObject.runways.push(rvr);
    }

    fields.shift();
  }
}

/**
 * 解析云组（Layers Aloft） 可以重复多次 格式：NsNsNshshshs  NsNsNs 表示云量 SKC FEW（1-2）、SCT（3-4）、BKN（5-7）、OVC（8）CLR
 * shshshs 表示云高
 * VV是垂直能见度的指示码
 * 如果观察到明显的对流云（仅限CB或TCU），则通过附加到云组而没有空格的字母缩写CB（积雨云）或TCU（浓积云）来标识。
 *
 *
 * 基础理论:云量云高以“NNNhhh”的形式报告，其中“NNN”为云量，“hhh”为云高。
 * 云量按八分量进行观测，即把天空分成八等分，看天空被遮住几分，云量就是八分之几。按照《国际航空气象电码》规定，
 * 对云量，按FEW（1-2）、SCT（3-4）、BKN（5-7）、OVC（8）进行报告；
 * 云高，3000米以下，以30米（100英尺）为单位，3000米以上，以300米（1000英尺）为单位编报；
 * 云状，只报告积雨云（CB）和浓积云（TCU）。如FEW010CB。当天空无云，且垂直能见度较好，而又不适合用CAVOK（例如，晴空、无云，能见度小于10000米）时，云组用SKC代替。
 * 垂直能见度用“VVhhh”的形式表示，其中“VV”是垂直能见度的指示码，“hhh”是以100英尺为单位的垂直能见度的数值。如VV010
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseClouds = (resultObject,fields)=> {

  if (resultObject.cavok)
    return ;

  let cloud = parseAbbreviation(fields[0], "CLOUDS");
  if (!cloud)
    return ;

  cloud.altitude = convertToInt(fields[0].slice(cloud.content.length)) *
    30 || undefined;
  cloud.cumulonimbus = /CB$/.test(fields[0]);
  cloud.concentrated=/TCU$/.test(fields[0]);

  resultObject.clouds = resultObject.clouds || [];
  resultObject.clouds.push(cloud);
  fields.shift();
  parseClouds(resultObject,fields);
};
/**
 * 解析当前天气（Present Weather）格式 w'w'
 *
 * 基础理论：天气现象分现在天气和近时天气两种。
 * 现在天气现象是指观测时存在的天气现象
 * 近时天气则指观测前十分钟内存在但观测时不存在的天气现象。（REnn）
 * 近时天气编报时，首先用指示码“RE”表示，其后不留间隔编报天气现象，如RETSRA
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseWeather = (resultObject,fields)=> {

  if (resultObject.cavok)
    return;

    let weather = parseWeatherAbbrv(fields[0]);
    if (!weather)
      return ;
    if (!resultObject.weathers)
      resultObject.weathers = [];
    resultObject.weathers = resultObject.weathers.concat(weather);

  fields.shift();
  parseWeather(resultObject,fields);
};
/**
 * 解析温度（Temperature/Dew-point）格式： T'T'/T'dT'd
 * 单位为摄氏度
 * 基础理论:根据《民用航空公约附件三》的建议，气温和露点温度应报靠近的整数摄氏度；删去观测值包含的0.5，
 * 向上取正到较高的整数摄氏度。例如＋2.5℃应去小数，报3℃；－2.5℃应去小数报－2℃。
 * 当温度或露点温度为负值时，需加字母“M”表示。如08/06、01/M02。
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseTempDewpoint = (resultObject,fields)=> {

  let replaced = fields[0].replace(/M/g, "-");
  fields.shift();
  let a = replaced.split("/");
  if (2 !== a.length) return; // expecting XX/XX
  resultObject.temperature = {};
  resultObject.temperature.value=convertToInt(a[0]);
  resultObject.temperature.unit='temperature-celsius';
  resultObject.dewpoint ={};
  resultObject.dewpoint.value=convertToInt(a[1]);
  resultObject.dewpoint.unit='temperature-celsius';
};
/**
 * 解析气压（Altimeter Setting）格式： QPHPHPHPH
 * Q表示单位为百帕，A表示单位为英寸汞柱
 * PHPHPHPH为具体数值
 * 该组报告高度计设置。 A是组指示器，PHPHPHPH是高度计设置，以百分之一英寸为单位，使用四位数字。 （国际上，组指标为“Q”，高度计设置报告为最接近的百匹比。
 * 逻辑基础:气压项的形式为“QPPPP”，“Q”为修正海平面气压的指示码，“PPPP”是以百帕为单位的气压值，小数部分略去不报。如Q1015。
 * 但在北美国家中，气压项常用“APPPP”的形式表示，“A”是高度表拨正值的指示码，“PPPP”是以英寸汞柱为单位的气压值，如A2992，代表高度表拨正值为29.92英寸汞柱。
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseAltimeter = (resultObject,fields)=> {
  let temp;
  if(fields.length===0)
    return;
  //高度表拨正值的指示码

  if (fields[0].length === 5 && "A" === fields[0][0]) {
    temp = fields[0].substr(1, 2);
    temp += ".";
    temp += fields[0].substr(3, 5);
    resultObject.airPressure={};
    resultObject.airPressure.value= convertToInt(temp, 10);

    resultObject.airPressure.unit= "pressure-inch-hg";

  } else if (fields[0].length=== 5 && "Q" === fields[0][0]) {

    temp = fields[0].substr(1);
    resultObject.airPressure={};
    resultObject.airPressure.value= convertToInt(temp, 10);

    resultObject.airPressure.unit= "pressure-hectopascal";
  }
  fields.shift();
};
/**
 * 解析近时天气（Recent Weather） 格式为REw'w'
 * RE为固定项表示近时天气
 * w'w'为具体天气情况
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let parseRecentSignificantWeather = (resultObject,fields)=> {

  if(fields.length===0)
    return;
  if (weatherParser.setting.RECENT_WEATHER[fields[0]]) {
    resultObject.recentWeather ={};
    resultObject.recentWeather.content=fields[0];
  }
};
let parseWeatherAbbrv=(s, res)=> {
  let weather = parseAbbreviation(s, "NOW_WEATHER");
  if (weather) {
    res = res || [];
    res.push(weather);
    return parseWeatherAbbrv(s.slice(weather.content.length), res);
  }
  return res;
}

let parseAbbreviation=(s,group)=> {

  let weather = weatherParser.setting[group][s];
  if(weather){
    return {
      content: s,
     // meaning: weather,
    };
  }
  let abbreviation, meaning, length = 3;
  if (!s) return;
  while (length && !meaning) {
    abbreviation = s.slice(0, length);
    meaning =  weatherParser.setting[group][abbreviation];

    length--;
  }
  if (meaning) {
    return {
      content: abbreviation,
     // meaning: meaning,
    };
  }
}

let convertToInt=(s)=> {
  return parseInt(s, 10);
}
let convertToFloat=(s)=> {
  return parseFloat(s, 10);
}
/*const reportParser={
  type:{
    reg:/(METAR)|(SPECI)/,
    parser:messageParser,
    default:'METAR',

  }
}
let messageParser = function(obj, match) {
  obj.type = messageTypes[match[0].toLowerCase()];
};*/
/**
 * 解析名称（Report Name），格式：METAR or SPECI ，如果不存在，赋值为"METAR"
 * @param resultObject 保存解析值的对象
 * @param fields 报文数组
 */
let messageParser = (resultObject,fields)=> {
  //如果第一项为类型，保存解析值，并从报文数组中删除对应数据
  if (weatherParser.setting.TYPES.indexOf(fields[0]) !== -1) {
    resultObject.type = fields[0];
    fields.shift();
  } else {
    resultObject.type = "METAR";
  }
};
/*let mapping = [
  { reg: /(METAR)|(SA)|(SPECI)|(SP)/, parser: messageTypeParser },
  { reg: /^[A-Z]{4}$/, parser: fullMatchParserFactory('airport') },
  { reg: /(\d\d)(\d\d)(\d\d)?Z/, parser: timestampParser },
  { reg: /(AUTO)|(COR)/, parser: fullMatchParserFactory('modifier') },
  { reg: /CALM/, parser: fullMatchParserFactory('wind') },
  { reg: /VRB(\d\d)((KT)|(KMH)|(MPS))/, parser: windVariableParser },
  { reg: /(\d\d\d)(\d\d)(G(\d\d))?((KT)|(KMH)|(MPS))/, parser: windParser },
  { reg: /(\d\d\d)V(\d\d\d)/, parser: windRangeParser },
  { reg: /CAVOK/, parser: fullMatchParserFactory('visibility') },
  { reg: /^(\d{1,4})([A-Z]{1,3})?$/, parser: visibilityParser },
  { reg: /^(\+|-)?([A-Z]{2})?([A-Z]{2})$/, parser: weatherParser, many: true },
  { reg: /SCK/, parser: fullMatchParserFactory('clouds') },
  { reg: /^([A-Z]{3})(\d{3})([A-Z]{2,3})?$/, parser: cloudsParser, many: true },
  { reg: /^(M)?(\d\d)\/(M)?(\d\d)$/, parser: temperatureParser },
  { reg: /^(A|Q)(\d\d(\.)?\d\d)$/, parser: qnhParser },
  { reg: /^R(\d\d(L|C|R)?)\/(\d\d\d\d)/, parser: rvrParser, many: true },
  { reg: /^(\d\d)(\d)(\d)(\d\d)(\d\d)$/, parser: rwyConditionsParser, many: true },
  { reg: /^[A-Z]{5}$/, parser: fullMatchParserFactory('forecast') },
  { reg: /^QBB(\d{3})$/, parser: cloudBaseParser, remark: true },
  { reg: /^QFE(\d{3})$/, parser: qfeParser, remark: true }
];*/


const weatherParser={
  setting:{
    RECENT_WEATHER : {
    REBLSN: "Moderate/heavy blowing snow (visibility significantly reduced)reduced",
    REDS: "Dust Storm",
    REFC: "Funnel Cloud",
    REFZDZ: "Freezing Drizzle",
    REFZRA: "Freezing Rain",
    REGP: "Moderate/heavy snow pellets",
    REGR: "Moderate/heavy hail",
    REGS: "Moderate/heavy small hail",
    REIC: "Moderate/heavy ice crystals",
    REPL: "Moderate/heavy ice pellets",
    RERA: "Moderate/heavy rain",
    RESG: "Moderate/heavy snow grains",
    RESHGR: "Moderate/heavy hail showers",
    RESHGS: "Moderate/heavy small hail showers",
    RESHPL: "Moderate/heavy ice pellet showers",
    RESHRA: "Moderate/heavy rain showers",
    RESHSN: "Moderate/heavy snow showers",
    RESN: "Moderate/heavy snow",
    RESS: "Sandstorm",
    RETS: "Thunderstorm",
    REUP: "Unidentified precipitation (AUTO obs. only)",
    REVA: "Volcanic Ash",
  },
    NOW_WEATHER :{
      "+FZDZ": "strong drizzle",
      "+FZRA": "srong freezing rain",
      "+PL": "strong ice particles",
      "+RA": "heavy rain",
      "+RASN": "heavy mixed rain and snow",
      "+SG": "strong snow grains",
      "+SHGR": "stong showery hailstone",
      "+SHGS": "strong showery graupe",
      "+SHRA": "weak showery rain",
      "+SHRASN": "showery mixed rain and snow",
      "+SHSN": "showery snow",
      "+SN": "heavy snow",
      "+SS": "srong sandstorm",
      "+TSGR": "thunderstorm and graupe",
      "+TSGS": "thunderstorm and hailstone",
      "+TSPL": "thunderstorm and ice particles",
      "+TSRA": "thunderstorm",
      "-FZDZ": "weak drizzle",
      "-FZRA": "weak freezing rain",
      "-PL": "weak ice particles",
      "-RA": "light rain",
      "-RASN": "light mixed rain and snow",
      "-SG": "weak snow grains",
      "-SHGR": "weak weshowery hailstone",
      "-SHGS": "weak showery graupe",
      "-SHRA": "weak showery rain",
      "-SHRASN": "showery mixed rain and snow",
      "-SHSN": "showery snow",
      "-SN": "slight snow",
      "-TSGR": "thunderstorm and graupe",
      "-TSGS": "thunderstorm and hailstone",
      "-TSPL": "thunderstorm and ice particles",
      "-TSRA": "thunderstorm",
      "BCFG": "Broken fog",
      "BLDU": "blowing dust",
      "BLSA": "blowing sand",
      "BLSN": "blowing snow",
      "BR": "light fog/mist",
      "DRDU": "drifting dust",
      "DRSA": "drifting sand",
      "DRSN": "drifting snow",
      "DS": "duststorm",
      "DU": "floating dust",
      "DZ": "Moderate drizzle",
      "FC": "tornado",
      "FG": "fog",
      "FU": "fume",
      "FZDZ": "freezing drizzle",
      "FZFG": "freezing fog",
      "FZRA": "freezing rain",
      "HZ": "haze",
      "IC": "ice needle",
      "MIFG": "shallow fog",
      "PL": "ice particles",
      "PO": "dust/sand whirlwind",
      "PRFG": "Part of the fog",
      "RA": "Moderate rain",
      "RASN": "mixed rain and snow",
      "SA": "sand blowing",
      "SG": "snow grains",
      "SHGR": "Moderate showery hailstone",
      "SHGS": "showery graupe",
      "SHRA": "Moderate showery rain",
      "SHRASN": "showery mixed rain and snow",
      "SHSN": "showery snow",
      "SN": "snow",
      "SQ": "squall",
      "SS": "sandstorm",
      "TSGR": "thunderstorm and graupe",
      "TSGS": "thunderstorm and hailstone",
      "TSPL": "thunderstorm and ice particles",
      "TSRA": "thunderstorm"
    },
    LENGTH_UNITS : {
    FT: "length-foot",
    M: "length-meter",
  },
    SPEED_UNITS : {
    KT: "speed-knot",
    MPS: "speed-meter-per-second",
    KPH: "speed-kilometer-per-hour",
    SM:  "speed-meter-per-second",
    KMH: "speed-kilometer-per-hour",

  },
    CLOUDS : {
    NCD: "no clouds",
    SKC: "sky clear",
    CLR: "no clouds under 12,000 ft",
    NSC: "no significant",
    FEW: "few",
    SCT: "scattered",
    BKN: "broken",
    OVC: "overcast",
    VV: "vertical visibility",
  },
    TYPES : ["METAR", "SPECI"],
  }
}
let WEATHER = {
  // Intensity
  "-": "light intensity",
  "+": "heavy intensity",
  VC: "in the vicinity",

  // Descriptor
  MI: "shallow",
  PR: "partial",
  BC: "patches",
  DR: "low drifting",
  BL: "blowing",
  SH: "showers",
  TS: "thunderstorm",
  FZ: "freezing",

  // Precipitation
  RA: "rain",
  DZ: "drizzle",
  SN: "snow",
  SG: "snow grains",
  IC: "ice crystals",
  PL: "ice pellets",
  GR: "hail",
  GS: "small hail",
  UP: "unknown precipitation",

  // Obscuration
  FG: "fog",
  VA: "volcanic ash",
  BR: "mist",
  HZ: "haze",
  DU: "widespread dust",
  FU: "smoke",
  SA: "sand",
  PY: "spray",

  // Other
  SQ: "squall",
  PO: "dust or sand whirls",
  DS: "duststorm",
  SS: "sandstorm",
  FC: "funnel cloud",
};
module.exports= parser;





