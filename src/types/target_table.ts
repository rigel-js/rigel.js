export interface TargetTableSyntax {
  row_header?: TargetTableAttribute | TargetTableOperator;
  column_header?: TargetTableAttribute | TargetTableOperator;
  body: TargetTableAttribute | TargetTableOperator;
}

// TODO: data 最好可以不填
export interface TargetTableAttribute {
  data: string;
  attribute: string;
}

export interface TargetTableOperator {
  operator: string;
  parameters: OperatorParameter[];
}

export interface OperatorValueParameter {
  value: string | number;
}

export type OperatorParameter =
  | TargetTableAttribute
  | TargetTableOperator
  | OperatorValueParameter;

export enum OperatorEnum {
  ADD = "add",
  CROSSPRODUCT = "cross",
  MUL = "mul",
  PLUS = "plus",
  UNION = "union",
  INTERSECT = "intersect",
  BIN = "bin",
  CONCAT = "concat",
  AVERAGE = "average",
  SUM = "sum",
  COUNT = "count",
  DESCSORT = "descsort",
  ASCSORT = "ascsort",
  BOUNDFILTER = "filterByBound",
  VALUEFILTER = "filterByValue",
  SPLIT = "split",
  SUBSTR = "substr",
}

export type TargetTableExpression = string;

export interface ExpressionToken {
  type: TokenTypeEnum;
  value: string;
}

export enum TokenTypeEnum {
  Identifier = "Identifier",
  Punctuator = "Punctuator",
  Number = "Number",
}

export type TargetTable = any[][];
