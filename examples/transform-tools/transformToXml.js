const  transformTools    = require('../../lib/transform-tools');
const  removeEmpty    = require('../../lib/remove-empty');
let data = {
  posts: [
    {
      title: null,
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

let result = transformTools.transformToXml('test',removeEmpty(data));

console.log(result);

//output
/*
 <?xml version='1.0'?>
 <test>
 <posts>
 <title>title1</title>
 <description>description1</description>
 <blog>This is a blog.</blog>
 <date>2013/12/11 12:00</date>
 <extra>
 <link>http://goo.cm</link>
 </extra>
 <list1>
 <name>mike</name>
 </list1>
 <list2>'title1'
 <item>thing</item>
 </list2>
 <clearMe>text</clearMe>
 </posts>
 </test>
 */
