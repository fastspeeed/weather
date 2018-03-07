const  transformTools    = require('../../lib/transform-tools.js');

let data = {
  posts: [
    {
      title: 'title1',
      description: 'description1',
      blog: 'This is a blog.',
      date: '2013/12/11 12:00',
      extra: {
        link: 'http://goo.cm',
      },
      list1: [
        {
          name: 'mike',
        },
      ],
      list2: [
        {
          item: 'thing',
        },
      ],
      clearMe: 'text',
    },
  ],
};

let map = {
  list: 'posts',
  item: {
    name: 'title',
    info: 'description',
    text: 'blog',
    date: 'date',
    link: 'extra.link',
    item: 'list1.0.name',
    clearMe: '',
    fieldGroup: ['title', 'extra'],
  },
  operate: [
    {
      run: 'Date.parse',
      on: 'date',
    },
    {
      run: function (val) { return (new Date(val)).getHours();},

      on: 'date',
    },
    {
      run: function (val) { return val + ' more info';},

      on: 'info',
    },
  ],
  each: function (item) {
    // make changes
    item.iterated = true;
    return item;
  },

};

let result = transformTools.transformJsonWithMap( data, map );
console.log(result);

//output
/*
 [ { name: 'title1',
 info: 'description1 more info',
 text: 'This is a blog.',
 date: 12,
 link: 'http://goo.cm',
 item: 'mike',
 clearMe: '',
 fieldGroup: [ 'title1', [Object] ],
 iterated: true } ]*/
