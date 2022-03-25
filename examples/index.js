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

// TODO: 感觉结果有点问题？
// state, year -> crime
// union(state) x union(year), () -> crime + gdp
// state, bin(crime, 5) -> count(year)
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
//     {
//       name: "gdp",
//       values: [
//         { state: "Alabama", year: 2005, gdp: 100 },
//         { state: "Alabama", year: 2006, gdp: 120 },
//         { state: "Alaska", year: 2005, gdp: 50 },
//         { state: "Alaska", year: 2006, gdp: 55 },
//       ],
//     },
//   ],
//   target_table: [
//     {
//       row_header: {
//         data: "crime",
//         attribute: "state",
//       },
//       column_header: {
//         data: "crime",
//         attribute: "year",
//       },
//       body: {
//         data: "crime",
//         attribute: "crime",
//       },
//     },
//     {
//       row_header: {
//         operator: "cross",
//         parameters: [
//           {
//             operator: "union",
//             parameters: [
//               {
//                 data: "crime",
//                 attribute: "state",
//               },
//               {
//                 data: "gdp",
//                 attribute: "state",
//               },
//             ],
//           },
//           {
//             operator: "union",
//             parameters: [
//               {
//                 data: "crime",
//                 attribute: "year",
//               },
//               {
//                 data: "gdp",
//                 attribute: "year",
//               },
//             ],
//           },
//         ],
//       },
//       body: {
//         operator: "add",
//         parameters: [
//           {
//             data: "crime",
//             attribute: "crime",
//           },
//           {
//             data: "gdp",
//             attribute: "gdp",
//           },
//         ],
//       },
//     },
//     {
//       row_header: {
//         data: "crime",
//         attribute: "state",
//       },
//       column_header: {
//         operator: "bin",
//         parameters: [
//           {
//             data: "crime",
//             attribute: "crime",
//           },
//           {
//             value: 5,
//           },
//         ],
//       },
//       body: {
//         operator: "count",
//         parameters: [
//           {
//             data: "crime",
//             attribute: "year",
//           },
//         ],
//       },
//     },
//   ],
// });

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
    "(), () => ()",
    "(crime.state), (crime.year) => (crime.crime)",
    // "(union(crime.state, gdp.state) * union(crime.year, gdp.year)), () => (crime.crime + gdp.gdp)",
    "(crime.state), (bin(crime.crime, 5)) => (count(crime.year))",
    "(crime.state), (bin(crime.crime, 5, 3000, 4200)) => (count(crime.year))",
    "(crime.state), (descsort(crime.year)) => (count(crime.year))",
    "(crime.state), (ascsort(crime.year)) => (count(crime.year))",
    "(crime.state), (filterByValue(crime.year, 2004)) => (count(crime.year))",
    "(crime.state), (filterByBound(crime.year, 2003, 2005)) => (count(crime.year))",
    "(ascsort(filterByBound(crime.crime, 3370.9, 4026.3))), () => ()",
    "(crime.state * crime.year * crime.crime), () => (crime.crime)",
    "(crime.crime), () => (concat(crime.state, crime.year))",
    "(split(crime.crime, '.', 0)), () => (crime.state)",
    "(crime.state), () => (average(crime.crime))",
    "(intersect(crime.year, gdp.year)), () => ()",
    "(union(crime.crime, gdp.gdp)), () => (concat(crime.state, gdp.state))",
  ],
});

const prettyPrint = (r) => {
  let t = Object.assign([], r);
  console.log(modifyStyle(t));
};

const modifyStyle = (t) => {
  if (t === null) return null;
  if (t instanceof Array) {
    for (var i = 0; i < t.length; i++) {
      t[i] = modifyStyle(t[i]);
    }
  }else {
    if(typeof(t)=="object") {
      if(t.value && typeof(t.value)=="object"){
        t=`[${t.value.lower}, ${t.value.upper}`+(t.value.isRightOpen?")":"]");
      } else {
        t = t.value;
      }
    }
  }
  return t;
};

// console.log(result[0][2][3]);
// console.log(result);
// console.log(JSON.stringify(result));
prettyPrint(result);
