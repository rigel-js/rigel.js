# API

先大概搞成这样吧，先 coding，后面再补全

## Data Source

| Property | Type    | Description                                     |
| -------- | ------- | ----------------------------------------------- |
| name     | String  |                                                 |
| values   | `Array` | For inline data.                                |
| url      | String  | Load data from a URL.                           |
| format   | String  | `"json"`(default), `"csv"`(header is required). |
| unnest   | `Array` | List of nested attributes to unnest (TODO).     |

## Target Table

| Property      | Type   | Description            |
| ------------- | ------ | ---------------------- |
| row_header    | Object | Attribute or operator. |
| column_header | Object | Attribute or operator. |
| body          | Object | Attribute or operator. |

## Exported Functions

- Transform: 指定 spec，进行 transform，基于 default 补全。
- Explore: 指定 partial spec，探索所有潜在的 transform 结果。
  - Explore 先枚举后 derive，相比先 derive 再枚举，枚举空间小了很多，语义也更符合道理（overview -> detail）。
