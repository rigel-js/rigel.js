# Rigel.js

**Rigel** is a JavaScript library for transforming data tables by table declaration.
It provides a concise, declarative table language to support a range of data transformation tasks.

## Install

``
npm install rigel-tools
``

## Usage

### Demo

To try demo, use `npm run test`.

### Basic usage

```javascript
import * as rigel from "rigel-tools";
let spec = {
  data: [
    {
      name: "crime",
      values: [
        { state: "Alabama", year: 2004, crime: 4029.3 },
        { state: "Alabama", year: 2005, crime: 3900 },
        { state: "Alaska", crime: 3370.9, year: 2004 },
        { state: "Alaska", crime: 3615, year: 2005 },
      ],
    }
  ],
  target_table: [
    "(crime.state), (crime.year) => (crime.crime)",
  ],
};
var result = rigel.transform(spec);
console.log(rigel.prettyPrint(result)); // shape the result in readable form

//Output
[
  [
    [ null, 2004, 2005 ],
    [ 'Alabama', 4029.3, 3900 ],
    [ 'Alaska', 3370.9, 3615 ]
  ]
]
```

### API

**`transform(spec: object)`**

#### Function

Transform the input raw tables into given forms according to specifications in the argument.  

#### Argument

A valid argument of `transform` is an object containing keys including `data` and `target_table`, indicating the raw tables and specifications of target tables respectively. Details of the values corresponding to these keys are provided as follows.

##### data

A valid value for `data` field is an array consisting of objects representing raw tables. Each object should have a `name` field representing the table name and a `values` field representing the table contents.

##### target_table

A valid value for `target_table` field is a string indicating the specifications of target tables. The pattern of a specification is `(row), (column) => (cell)`, where `row`, `column` and `cell` are expressions containing attribute(s) that will be mapped to the *row*, *column* and *cell* part of the target table. For example, when attribute `state`  is mapped to *row*, `year` is mapped to *column* and `crime` is mapped to *cell*, the specification can be written as `(state), (year) => (crime)`. 

#### Output

The output of `transform` is a 3-dimensional array. Specifically, the output of `transform` is an array consisting of target tables, with each target table an 2-dimensional array. The element can be `null` if the corresponding cell is empty or an object representing the contents of the corresponding cell. The object has a `value` field indicating the real value in the corresponding cell and a `source` field indicating the source attribute that the real value originally belongs to.



**`prettyPrint(target: object)`**

#### Function

Print the output of `transform` in readable form.

#### Argument

An object with the same form as the output of `transform`. 
