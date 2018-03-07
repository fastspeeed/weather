
const  transformTools= require('./transform-tools');
let map = {

  item: {
    station:{
      abbr:'stationAbbr',
      meaning:'stationAbbrMessage',
    },
    time:{
      value:'time',
      meaning:'timeMessage',
    } ,
    temperature:'temperature.value',
    dewpoint:'dewpoint.value',
    cavok:'cavok',
    wind:{
      speed:'wind.speed.value',
      speedLevel:'wind.speedStand.value',
      gust:'wind.gust',
      variation:'wind.variation',
      variableFromDirection:'wind.variableFromDirection.value',
      variableToDirection:'wind.variableToDirection.value',
      direction:'wind.direction.value',
      direction_group:'wind.directionStand',
      direction_group_meaning:'wind.directionStandMessage',
      variableFromDirection_group:'wind.variableFromDirectionStand',
      variableFromDirection_group_meaning:'wind.variableFromDirectionStandMessage',
      variableToDirection_group:'wind.variableToDirectionStand',
      variableToDirection_group_meaning:'wind.variableToDirectionStandMessage',
    },
    runways:'runways',
    visibility:'visibility.value',
    airPressure:'airPressure.value',
    clouds:'clouds',
    weathers:'weathers',
    recentWeather:{
      value:'recentWeather.content',
      meaning:'recentWeather.contentMessage'
    }

  },
  operate: [

    {
      'run': function(ary) {
        return transformTools.transformJsonWithMap({list:ary}, runwaysMap);
      },
      'on': 'runways'
    },
    {
      'run': function(ary) {
        return transformTools.transformJsonWithMap({list:ary}, weathersMap);
      },
      'on': 'weathers'
    },
    {
      'run': function(ary) {
        return transformTools.transformJsonWithMap({list:ary}, cloudsMap);
      },
      'on': 'clouds'
    }
  ]
};
const weathersMap={
  'list': 'list',
  'item' : {
    abbr: 'content',
    meaning: 'contentMessage'
  }
}
const cloudsMap={
  'list': 'list',
  'item' : {
    abbr: 'content',
    altitude:'altitude',
    concentrated:'concentrated',
    cumulonimbus:'cumulonimbus',
    meaning: 'contentMessage'
  }
}

const runwaysMap ={
  'list': 'list',
  'item' : {
    code: 'code',
    direction: 'direction',
    minIndicator:'minIndicator',
    variableIndicator:'variableIndicator',
    maxIndicator:'maxIndicator',
    minValue:'minValue',
    maxValue:'maxValue',
    trend:'trend',
    trendMeaning:'trendMessage'
  }
}
const findLanguage =(data,language)=>{
  if(typeTools.isArray(data)){
    data.map(v=>{
      if(v.language ===language){

      }

    })
  }
}
const transformToJson = (data)=>{
 return transformTools.transformJsonWithMap(data, map);
}
const transformToXml=(name,data)=>{
  return transformTools.transformToXml(name,data);
}
module.exports={
  transformToJson,
  transformToXml
}