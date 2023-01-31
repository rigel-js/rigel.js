const rigel = require("../dist/rigel");

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
    "(crime.state), () => (average(crime.crime))",
    "(split(crime.state, 'la', 1)), (crime.year) => (crime.crime)",
    "(crime.crime), (crime.year) => (split(crime.crime, '.', 0))"
  ],
})

console.log(rigel.prettyPrint(result));
