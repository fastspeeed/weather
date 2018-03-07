
let _ = require('lodash');
const js2xmlparser = require('js2xmlparser');

/**
 * transform format from one to another
 */
class TransformTools {
    /**
     * transform json to xml
     * @param {Object} msg -param object
     * @propertyDetail {string} name -xml root name
     * @propertyDetail {Object} json -json be transformed
     * @return {string} xml string
     */
    static  transformToXml  (name,json) {
        return js2xmlparser.parse(name, json);
    };
    /**
     * transform json to json with define map
     * @param {Object} msg -param object
     * @propertyDetail {Object} json - json be transformed
     * @propertyDetail {Object} map - define map
     * @return {Object}
     */
    static transformJsonWithMap  (json,map) {
        return transformJson(json, map).transform();
    };

    /**
     * transform array to json using define property name and value
     * @param {Object} msg -param object
     * @propertyDetail {Array} items
     * @propertyDetail {string} name
     * @propertyDetail {string} valueName
     * @return {Object}
     */
    static jsonItemsToProp  (msg) {
        let result = {};
        msg.items.map(item=> {
            result[item[msg.name]] = item[msg.valueName];
        });
        return result;
    };






}
const transformJson  = (data, map)=> {

    return {

        getValue: function(obj, key) {

            if (typeof(obj) == "undefined") {
                return "";
            }

            if (key == '' || key == undefined) {
                return obj;
            }

            var value = obj || data,
                key = key || map.list,
                keys = null;
            if (key == "") {
                value = "";
            } else {
                keys = key.split('.');
                for (var i = 0; i < keys.length; i++) {

                    if (typeof(value) !== "undefined" &&
                        keys[i] in value) {
                        value = value[keys[i]];
                    } else {
                        return null;
                    }
                }
            }

            return value;

        },

        setValue: function(obj, key, newValue) {

            if (typeof(obj) == "undefined") {
                return;
            }

            if (key == '' || key == undefined) {
                return;
            }

            if (key == "") {
                return;
            }

            let keys = key.split('.');
            var target = obj;
            for (var i = 0; i < keys.length; i++) {
                if (i == keys.length - 1) {
                    target[keys[i]] = newValue;
                    return;
                }
                if (keys[i] in target)
                    target = target[keys[i]];
                else return;
            }
        },

        getList: function() {
            return this.getValue(data, map.list);
        },

        transform: function() {

            var value = this.getValue(data, map.list),
                normalized = {};
            if (value) {

                var list = this.getList();
                if (!map.list) {
                    var normalized = this.iterator(map.item, list);
                }
                else {
                    var normalized = map.item ? _.map(list, _.bind(this.iterator, this, map.item)) : list;
                }

                //  var normalized = map.item ? _.map(list, _.bind(this.iterator, this, map.item)) : list;
                //  var normalized = map.item ? _.map(list, _.bind(this.iterator, this, map.item)) : list;
                normalized = _.bind(this.operate, this, normalized)();
                normalized = this.each(normalized);
            }
            return normalized;

        },

        operate: function(data) {
            let fn;
            if (map.operate) {
                _.each(map.operate, _.bind(function(method) {
                    if ('string' === typeof method.run) {
                        fn = eval(method.run);
                    } else {
                        fn = method.run;
                    }

                    if (_.isArray(data)) {
                        data = _.map(data, _.bind(function(item) {
                            var fn;
                            if ('string' === typeof method.run) {
                                fn = eval(method.run);
                            } else {
                                fn = method.run;
                            }
                            this.setValue(item, method.on, fn(this.getValue(item, method.on)))
                            return item;
                        }, this));
                    }
                    else {
                        this.setValue(data, method.on, fn(this.getValue(data, method.on)));
                    }

                }, this));
            }
            return data;

        },

        each: function(data) {
            if (map.each) {
                _.each(data, map.each);
            }
            return data;
        },

        iterator: function(map, item) {

            var obj = {};
            //to support simple arrays with recursion
            if (typeof(map) == "string") {
                return this.getValue(item, map);
            }
            _.each(map, _.bind(function(oldkey, newkey) {
                if (typeof(oldkey) == "string" && oldkey.length > 0) {

                    obj[newkey] = this.getValue(item, oldkey);
                } else if (_.isArray(oldkey)) {
                    let array = _.map(oldkey, _.bind(function(item, map) {
                        return this.iterator(map, item)
                    }, this, item));//need to swap arguments for bind
                    obj[newkey] = array;
                } else if (typeof oldkey == 'object') {
                    var bound = _.bind(this.iterator, this, oldkey, item)
                    obj[newkey] = bound();
                }
                else {
                    obj[newkey] = "";
                }

            }, this));
            return obj;

        }

    };

};

const schemas = {
    transformToXml:{
        type:'object',
        properties: {
            json: {
                type: 'object',
            },
            name: {
                type: 'string',
            },
        },
        required: ['json', 'name'],
    },
    transformJsonWithMap:{
        type:'object',
        properties: {
            json: {
                type: 'object',
            },
            map: {
                type: 'object',
            },
        },
        required: ['json', 'map'],
    },
    jsonItemsToProp: {
        type:'object',
        properties: {
            items: {
                type: 'array',
                items: { type: 'object' },
            },
            name: {
                type: 'string',
            },
            valueName: {
                type: 'string',
            },
        },
        required: ['items', 'name', 'valueName'],
    },
};
module.exports= TransformTools;
