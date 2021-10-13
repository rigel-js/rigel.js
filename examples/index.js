const rigel = require("../dist/rigel");

// const result = rigel.transform({
//   data: [
//     {
//       name: "crime",
//       values: [
//         { state: "Alabama", year: 2004, crime: 4029.3 },
//         { state: "Alabama", year: 2005, crime: 3900 },
//         { state: "Alaska", crime: 3370.9, year: 2004 },
//         { state: "Alaska", crime: 3615, year: 2005 },
//       ],
//     },
//   ],
//   target_table: [
//     {
//       row_header: {
//         data: "crime",
//         attribute: "state",
//       },
//       body: {
//         operator: "avg",
//         parameters: [
//           {
//             data: "crime",
//             attribute: "crime",
//           },
//         ],
//       },
//     },
//   ],
// });

// state, year -> crime
// union(state) x union(year), () -> crime
// state, bin(crime, 5) -> count(year)
const result = rigel.transform({
  data: [
    {
      name: "crime",
      values: [
        { state: "Alabama", year: 2004, crime: 4029.3 },
        { state: "Alabama", year: 2005, crime: 3900 },
        { state: "Alaska", crime: 3370.9, year: 2004 },
        { state: "Alaska", crime: 3615, year: 2005 },
      ],
    },
    {
      name: "gdp",
      values: [
        { state: "Alabama", year: 2005, gdp: 100 },
        { state: "Alabama", year: 2006, gdp: 120 },
        { state: "Alaska", year: 2005, gdp: 50 },
        { state: "Alaska", year: 2006, gdp: 55 },
      ],
    },
  ],
  target_table: [
    {
      row_header: {
        data: "crime",
        attribute: "state",
      },
      column_header: {
        data: "crime",
        attribute: "year",
      },
      body: {
        data: "crime",
        attribute: "crime",
      },
    },
    {
      row_header: {
        operator: "cross",
        parameters: [
          {
            operator: "union",
            parameters: [
              {
                data: "crime",
                attribute: "state",
              },
              {
                data: "gdp",
                attribute: "state",
              },
            ],
          },
          {
            operator: "union",
            parameters: [
              {
                data: "crime",
                attribute: "year",
              },
              {
                data: "gdp",
                attribute: "year",
              },
            ],
          },
        ],
      },
      body: {
        operator: "add",
        parameters: [
          {
            data: "crime",
            attribute: "crime",
          },
          {
            data: "gdp",
            attribute: "gdp",
          },
        ],
      },
    },
    {
      row_header: {
        data: "crime",
        attribute: "state",
      },
      column_header: {
        operator: "bin",
        parameters: [
          {
            data: "crime",
            attribute: "crime",
          },
          {
            value: 5,
          },
        ],
      },
      body: {
        operator: "count",
        parameters: [
          {
            data: "crime",
            attribute: "year",
          },
        ],
      },
    },
  ],
});

const prettyPrint = (r) => {
  let t = Object.assign([], r);
  console.log(modifyStyle(t));
  
}

const modifyStyle = (t) => {
  if(t === null)return null;
  if(t instanceof Array) {
    for(var i=0;i<t.length;i++){
      t[i]=modifyStyle(t[i]);
    }
  }else {
    if(typeof(t)=="object") {
      if(typeof(t.value)=="object"){
        t=`[${t.value.lower}, ${t.value.upper}`+(t.value.isRightOpen?")":"]");
      } else {
        t=t.value;
      }
    }
  }
  return t;
}

// console.log(result);
// console.log(JSON.stringify(result));
prettyPrint(result);

