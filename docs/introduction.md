# Introduction

Inspired by declarative visualization grammars (e.g., [D3](https://d3js.org/), [Vega](https://vega.github.io/vega/), and [Vega-Lite](https://vega.github.io/vega-lite/)), Rigel regards table as a special type of **encoding mapping** from data to visual elements of table (e.g., row header, column header, and body).
For instance, a table below shows the annual crime rate by state.

| state   | year | crime  |
| ------- | ---- | ------ |
| Alabama | 2004 | 4029.3 |
| Alabama | 2005 | 3900   |
| Alaska  | 2004 | 3370.9 |
| Alaska  | 2005 | 3615   |
| ...     | ...  | ...    |

The table consists of three attributes:

- state: (Alabama, Alaska, ...)
- year: (2004, 2005)
- crime: (4029.3, 3900, 3370.9, 3615, ...)

One row in the table represents the crime state of a state in a specific year.
Therefore, Rigel defines the table as below.

```json
{
  "row_header": "state × year",
  "column_header": "",
  "body": " crime"
}
```

Based on the table definition, Rigel allows users to **transform data by directly declaring the target tables using input tables**, without considering the intermediate transformation steps (e.g., filtering, reshaping, and joining) (_what_ not _how_).

For instance, to transform the above table into a cross-tabulation by state and year, users only need to declare the cross-tabulation using the table definition of Rigel.

```json
{
  "row_header": "state",
  "column_header": "year",
  "body": " crime"
}
```

Result:

|         | 2004   | 2005 |
| ------- | ------ | ---- |
| Alabama | 4029.3 | 3900 |
| Alaska  | 3370.9 | 3615 |
| ...     | ...    | ...  |

## Details

(Derived) Attributes -> Table Elements

Attribute Derivations

- Modify existing attribute or derive new attribute as header (可以先全部用函数表示，后面再优化).
  - [x] cross product, ×.
  - [x] union, ∪.
  - [x] intersect, ∩.
  - [x] bin, bin(crime, num=5)
  - [ ] filter, crime in (Alabama, Alaska), year > 2005.
- Coordinate attribute values in body.
  - [x] concat attribute values (string)
  - [x] avg, sum, count
  - [ ] sort, crime.sort(ascending)
  - [ ] or, |

Table Elements (2D)

- **Row header** determines one type of object that rows represent.
- **Column header** determines one type of object that columns represent.
- **Body** describes the details of the object defined by row and column headers.

|                | Column header |
| -------------- | ------------- |
| **Row header** | Body          |

Mapping

- Attribute -> Header
  - Attribute values are arranged in the starting cells of rows and columns.
  - (Taking row header as an example.) Each row represents an object of an attribute value, e.g., `Country -> Row header` means that one row represents a country.
  - The attributes of headers are best to be nominal / categorical.
- Attribute -> Body
  - Attribute values are arranged in the follow-up cells of the row and column headers.
  - Body describes the details of the objects determined by headers, e.g., `Country -> Row header, GDP -> Body` means that one row represents a country and describes its GDP.
  - From the aspect of implementation, the attribute value of a body cell is constrained by the corresponding header values, which filter out unrelated data records and leave the remaining for users to coordinate in _body_.
  - Defaults for many-to-one mappings
    - Many attributes for cross-tabulations: string concatenation
    - Many attributes for non-cross-tabulations: table concatenation
    - One attribute, many nominal / categroical values: count
    - One attribute, many quantitative values: avg

Table Concatenation

- **\_**: placeholder indicating the direction of concatenation
- **+**: concat
- E.g.,
  - `(country), (year) -> (gdp)` - 每个国家每年的 GDP
  - `(), (year) -> (avg(gdp))` - 所有国家每年的平均 GDP
  - `(country), () -> (avg(gdp))` - 每个国家所有年份的平均 GDP
  - `(), () -> (avg(gdp))` - 所有国家所有年份的平均 GDP
  - `(country + _), (year) -> (gdp + avg(gdp))` - 第一个 concat 第二个，row-wise
  - `(country), (year + _) -> (gdp + avg(gdp))` - 第一个 concat 第三个，column-wise
  - `(country + _), (year + _) -> (gdp + avg(gdp) + avg(gdp) + avg(gdp))` - 四个全部 concat
