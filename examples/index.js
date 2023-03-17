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
    {
      name: "cashier",
      values: [
        { date: "2023-01-01", order: "14 kilos of apples", order_id: "10001", price: 7 },
        { date: "2023-01-01", order: "10 kilos of bananas", order_id: "10002", price: 5 },
        { date: "2023-01-01", order: "3 kilos of apples", order_id: "10003", price: 8 },
        { date: "2023-01-01", order: "12 kilos of bananas", order_id: "10004", price: 4 },
      ]
    },
    {
      name: "task3",
      values: [
        {
            "Name": "Niles C.",
            "Type": "Tel",
            "Number": "(800)645-8397",
            "Usage": "home"
        },
        {
            "Name": "Niles C.",
            "Type": "Tel",
            "Number": "(800)645-8398",
            "Usage": "work"
        },
        {
            "Name": "Niles C.",
            "Type": "Fax",
            "Number": "(907)586-7252",
            "Usage": "work"
        },
        {
            "Name": "Jean H.",
            "Type": "Tel",
            "Number": "(918)781-4600",
            "Usage": "home"
        },
        {
            "Name": "Jean H.",
            "Type": "Tel",
            "Number": "(918)781-4601",
            "Usage": "work"
        },
        {
            "Name": "Jean H.",
            "Type": "Fax",
            "Number": "(918)781-4603",
            "Usage": "home"
        },
        {
            "Name": "Jean H.",
            "Type": "Fax",
            "Number": "(918)781-4604",
            "Usage": "work"
        },
        {
            "Name": "Bach J.",
            "Type": "  ",
            "Number": "781-4605",
            "Usage": "work"
        },
        {
            "Name": "Bach J.",
            "Type": "  ",
            "Number": "(918)781-4604",
            "Usage": "work"
        }
    ]
    },
    {
      "name": "task1",
      "values": [
        {
            "Paper": "D3 data-driven documents",
            "Author": "Michael Bostock"
        },
        {
            "Paper": "D3 data-driven documents",
            "Author": "Vadim Ogievetsky"
        },
        {
            "Paper": "D3 data-driven documents",
            "Author": "Jeffrey Heer"
        },
        {
            "Paper": "Lyra: An interactive visualization design environment",
            "Author": "Arvind Satyanarayan"
        },
        {
            "Paper": "Lyra: An interactive visualization design environment",
            "Author": "Jeffrey Heer"
        },
        {
            "Paper": "Reactive vega: A streaming dataflow architecture for declarative interactive visualization",
            "Author": "Arvind Satyanarayan"
        },
        {
            "Paper": "Reactive vega: A streaming dataflow architecture for declarative interactive visualization",
            "Author": "Ryan Russell"
        },
        {
            "Paper": "Reactive vega: A streaming dataflow architecture for declarative interactive visualization",
            "Author": "Jane Hoffswell"
        },
        {
            "Paper": "Reactive vega: A streaming dataflow architecture for declarative interactive visualization",
            "Author": "Jeffrey Heer"
        },
        {
            "Paper": "Vega-lite: A grammar of interactive graphics",
            "Author": "Arvind Satyanarayan"
        },
        {
            "Paper": "Vega-lite: A grammar of interactive graphics",
            "Author": "Dominik Moritz"
        },
        {
            "Paper": "Vega-lite: A grammar of interactive graphics",
            "Author": "Kanit Wongsuphasawat"
        },
        {
            "Paper": "Vega-lite: A grammar of interactive graphics",
            "Author": "Jeffrey Heer"
        }
    ]
    }
  ],
  target_table: [
    // "(), () => ()",
    // "(crime.state), (crime.year) => (crime.crime)",
    // // "(union(crime.state, gdp.state) * union(crime.year, gdp.year)), () => (crime.crime + gdp.gdp)",
    // "(crime.state), (bin(crime.crime, 5)) => (count(crime.year))",
    // "(crime.state), (bin(crime.crime, 5, 3000, 4200)) => (count(crime.year))",
    // "(crime.state), (descsort(crime.year)) => (count(crime.year))",
    // "(crime.state), (ascsort(crime.year)) => (count(crime.year))",
    // "(crime.state), (filterByValue(crime.year, 2004)) => (count(crime.year))",
    // "(crime.state), (filterByBound(crime.year, 2003, 2005)) => (count(crime.year))",
    // "(ascsort(filterByBound(crime.crime, 3370.9, 4026.3))), () => ()",
    // "(crime.state * crime.year * crime.crime), () => (crime.crime)",
    // "(crime.state), () => (average(crime.crime))",
    // "(split(crime.state, 'la', 1)), (crime.year) => (crime.crime)",
    // "(split(cashier.order, ' ', 3)), (cashier.date) => (sum(mul(split(cashier.order, ' ', 0), cashier.price)))"
    // "(task3.Name * filterByValue(task3.Type, 'Tel', 'Fax')), () => (task3.Number)"
    "(crime.state), () => (descsort(crime.crime))"
  ],
})

console.log(rigel.prettyPrint(result));
