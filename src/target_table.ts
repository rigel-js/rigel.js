import DataTable from "./data_source";
import {
  DataTableAttribute,
  TargetTableSyntax,
  TargetTableAttribute,
  TargetTableOperator,
  OperatorValueParameter,
  OperatorParameter,
  TargetTableExpression,
  ExpressionToken,
  TokenTypeEnum,
  TargetTable,
} from "./types";
import operators from "./operators";

const digitUnicodeStart = 48;
const uppercaseLetterUnicodeStart = 65;
const lowercaseLetterUnicodeStart = 97;
const digits = new Array(10)
  .fill(0)
  .map((_, index) => String.fromCharCode(digitUnicodeStart + index));
const uppercaseLetters = new Array(26)
  .fill(0)
  .map((_, index) => String.fromCharCode(uppercaseLetterUnicodeStart + index));
const lowercaseLetters = new Array(26)
  .fill(0)
  .map((_, index) => String.fromCharCode(lowercaseLetterUnicodeStart + index));

const identifierStartCharacters = [
  ...uppercaseLetters,
  ...lowercaseLetters,
  "_",
];
const identifierCharacters = [
  ...digits,
  ...uppercaseLetters,
  ...lowercaseLetters,
  "_",
];
const punctuatorCharacters = [",", ".", "(", ")"];

export const tokenizeExpression = (
  expression: TargetTableExpression
): ExpressionToken[] => {
  const tokens: ExpressionToken[] = [];

  for (const c of expression) {
    if (c.match(/\S/)) continue;

    if (punctuatorCharacters.includes(c)) {
      tokens.push({
        type: TokenTypeEnum.Punctuator,
        value: c,
      });
    } else if (identifierStartCharacters.includes(c)) {
      // TODO
    }
  }

  return tokens;
};

export const parseTokens = (tokens: ExpressionToken[]): TargetTableSyntax => {
  const syntaxTree = {};

  // TODO

  return syntaxTree as TargetTableSyntax;
};

export const computeTargetTable = (
  tables: DataTable[],
  syntaxTree: TargetTableSyntax
): TargetTable => {
  // console.log(tables)
  const targetTable: TargetTable = [];

  if (syntaxTree.row_header && syntaxTree.column_header) {
  } else if (syntaxTree.row_header) {
    let headerAttributes: DataTableAttribute[] = [];
    let headerValues: any[] = [];
    if (isAttribute(syntaxTree.row_header)) {
      const attr = getAttribute(
        tables,
        syntaxTree.row_header.data,
        syntaxTree.row_header.attribute
      );
      headerAttributes.push(attr);
      headerValues.push(attr.values);
      headerValues.forEach((value) => {
        targetTable.push([value]);
      });
      // handle body
      targetTable.forEach((row) => {});
    } else {
    }
  } else if (syntaxTree.column_header) {
  } else {
    throw new Error("Headers are undefined.");
  }

  return targetTable;
};

const isAttribute = (
  spec: TargetTableAttribute | TargetTableOperator
): spec is TargetTableAttribute => {
  return (
    (spec as TargetTableAttribute).data !== undefined &&
    (spec as TargetTableAttribute).attribute !== undefined
  );
};

const isOperator = (
  spec: TargetTableAttribute | TargetTableOperator
): spec is TargetTableOperator => {
  return (
    (spec as TargetTableOperator).operator !== undefined &&
    (spec as TargetTableOperator).parameters !== undefined
  );
};

const isValue = (spec: OperatorValueParameter): boolean => {
  return spec.value !== undefined;
};

const getAttribute = (
  tables: DataTable[],
  tableName: string,
  attributeName: string
): DataTableAttribute => {
  const table = tables.find((table) => table.name === tableName);
  if (!table) throw new Error(`No such table name: ${tableName}`);

  const attribute = table.attributes.find(
    (attribute) => attribute.name === attributeName
  );
  if (!attribute) throw new Error(`No such attribute name: ${attributeName}`);

  return attribute;
};
