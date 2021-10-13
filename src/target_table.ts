import DataTable from "./data_source";
import {
  DataTableAttribute,
  TargetTableSyntax,
  TargetTableAttribute,
  TargetTableOperator,
  OperatorValueParameter,
  OperatorParameter,
  OperatorEnum,
  TargetTableExpression,
  ExpressionToken,
  TokenTypeEnum,
  TargetTable,
} from "./types";
import operators from "./operators";
import { calcDimension } from "./utils";

const eps = 1e-6;
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
  console.log("tables:")
  console.log(tables)
  var targetTable: TargetTable = [];

  // if (syntaxTree.row_header && syntaxTree.column_header) {
  let rowList = parseHeader(tables, syntaxTree.row_header);
  let columnList = Object.assign([], parseHeader(tables, syntaxTree.column_header));
  let rowDim = calcDimension(rowList);
  let columnDim = calcDimension(columnList);
  let rowSize = rowList.length;
  let columnSize = columnList.length;

  if (columnDim > 1) {
    columnList.forEach((value, index, arr) => {
      arr[index] = [].concat(...value);
    })
  } else {
    for (var i = 0; i < columnList.length; i++) {
      columnList[i] = [columnList[i]];
    }
  }

  if (rowDim > 1) {
    rowList.forEach((value, index, arr) => {
      arr[index] = [].concat(...value);
    })
  }

  //transpose
  columnList = columnList[0].map(function (col, i) {
    return columnList.map(function (row) {
      return row[i];
    })
  });
  for (var i = 0; i < columnDim; i++) {
    let tmp = []
    for (var j = 0; j < rowDim; j++) {
      tmp.push(null)
    }
    targetTable.push(tmp.concat(columnList[i]));
  }
  rowList.forEach((value) => {
    if (value instanceof Array) {
      targetTable.push(value);
    } else {
      targetTable.push([value]);
    }
  })

  // console.log("before parsing body:");
  // console.log(targetTable);
  // console.log(parseHeader(tables, {
  //   data: "crime",
  //   attribute: "year",
  // }))
  // console.log(parseHeader(tables, {
  //   data: "crime",
  //   attribute: "state",
  // }))
  //Body
  let cnt = 0;
  let bodyList = parseBody(syntaxTree.body);
  // console.log("body:");
  // console.log(bodyList);
  let queryAttr: TargetTableAttribute | TargetTableOperator = bodyList[0];
  // for (var j = rowDim; j < rowDim + columnSize; j++) {
  //   if(typeof(targetTable[0][j]) == "string" && targetTable[0][j] == "_"){
  //     let tmp: TargetTableAttribute = bodyList[cnt++];
  //     targetTable[0][j] = tmp;
  //   }
  // }
  // for (var i = columnDim; i < columnDim + rowSize; i++) {
  //   if(typeof(targetTable[i][0]) == "string" && targetTable[i][0] == "_"){
  //     let tmp: TargetTableAttribute = bodyList[cnt++];
  //     targetTable[i][0] = tmp;
  //   }
  // }

  for (var i = columnDim; i < columnDim + rowSize; i++) {
    for (var j = rowDim; j < rowDim + columnSize; j++) {
      let constraints = [];
      for (var k = 0; k < rowDim; k++) {
        if (typeof (targetTable[i][k]) != "string") {
          constraints.push(targetTable[i][k]);
        }
      }
      for (var k = 0; k < columnDim; k++) {
        if (typeof (targetTable[k][j]) != "string") {
          constraints.push(targetTable[k][j]);
        }
      }
      let flag = 0; //用于去除该单元格对应的行和列都为placeholder且attr不同的情况
      if (typeof (targetTable[0][j]) == "string" && targetTable[0][j] == "_") {
        let tmp = bodyList[cnt++];
        if (isAttribute(tmp)) {
          targetTable[0][j] = (tmp as TargetTableAttribute).attribute;
        } else {
          let newTmp = (tmp as TargetTableOperator);
          targetTable[0][j] = `${newTmp.operator}(${newTmp.parameters[0]})`;
        }
        queryAttr = tmp;
        flag = 1;
      }
      if (typeof (targetTable[i][0]) == "string" && targetTable[i][0] == "_") {
        let tmp = bodyList[cnt++];
        if (isAttribute(tmp)) {
          targetTable[i][0] = (tmp as TargetTableAttribute).attribute;
        } else {
          let newTmp = (tmp as TargetTableOperator);
          targetTable[i][0] = `${newTmp.operator}(${newTmp.parameters[0]})`;
        }
        if (flag && queryAttr != tmp) {
          throw new Error(`Selected attribute conflict for ${JSON.stringify(queryAttr)} and ${JSON.stringify(tmp)}`);
        }
        queryAttr = tmp;
      }
      targetTable[i][j] = queryTable(constraints, queryAttr, tables);
    }
  }

  return targetTable;
};

const isAttribute = (
  spec: TargetTableAttribute | TargetTableOperator | OperatorValueParameter
): spec is TargetTableAttribute => {
  return (
    (spec as TargetTableAttribute).data !== undefined &&
    (spec as TargetTableAttribute).attribute !== undefined
  );
};

const isOperator = (
  spec: TargetTableAttribute | TargetTableOperator | OperatorValueParameter
): spec is TargetTableOperator => {
  return (
    (spec as TargetTableOperator).operator !== undefined &&
    (spec as TargetTableOperator).parameters !== undefined
  );
};

const isValue = (spec: TargetTableAttribute | TargetTableOperator | OperatorValueParameter
): spec is OperatorValueParameter => {
  return (spec as OperatorValueParameter).value !== undefined;
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

const parseHeader = (
  tables: DataTable[],
  header: TargetTableAttribute | TargetTableOperator
) => {
  // console.log("header");
  // console.log(header);
  if (typeof (header) == "undefined" || header === null) {
    return ["_"];
  }
  let headerAttributes: DataTableAttribute;
  let targetList: any[] = []
  if (isAttribute(header)) {
    const attr = getAttribute(
      tables,
      header.data,
      header.attribute
    );
    headerAttributes = attr;
    targetList = attr.values;
    // console.log("targetList:")
    // console.log(targetList)
  } else if (isOperator(header)) {
    let op = (header as TargetTableOperator).operator;
    let para = (header as TargetTableOperator).parameters;
    if (op === OperatorEnum.BIN) {
      if (para.length != 2) {
        throw new Error(`Too few or too many parameters for BIN`);
      } else if (!isAttribute(para[0])) {
        throw new Error(`Parameter 1 of BIN is not an attribute`);
      } else if (!isValue(para[1])) {
        throw new Error(`Parameter 2 of BIN is illegal value`)
      } else {
        let attrValue = parseHeader(tables, para[0] as TargetTableAttribute);
        let divNumber = (para[1] as OperatorValueParameter).value;
        targetList = operators.bin(attrValue, (typeof (divNumber) == "string") ? parseInt(divNumber) : Number(divNumber));
      }
    } else {
      if (para.length != 2) {
        throw new Error(`Too few or too many parameters for ${op}`);
      } else {
        let leftList = isValue(para[0]) ? [para[0]] : parseHeader(tables, para[0])
        let rightList = isValue(para[1]) ? [para[1]] : parseHeader(tables, para[1])
        if (op === OperatorEnum.UNION) {
          targetList = operators.union(leftList, rightList)
        } else if (op === OperatorEnum.INTERSECT) {
          targetList = operators.intersect(leftList, rightList)
        } else if (op === OperatorEnum.CROSSPRODUCT) {
          targetList = operators.cross(leftList, rightList)
        } else if (op === OperatorEnum.ADD) {
          targetList = operators.add(leftList, rightList)
        }
      }
    }
  }
  return targetList;
}

const parseBody = (
  body: TargetTableAttribute | TargetTableOperator
): any[] => {
  if (isAttribute(body)) return [body];
  let op = (body as TargetTableOperator).operator;
  let paras = (body as TargetTableOperator).parameters;
  if (op == OperatorEnum.ADD) {
    if (paras.length != 2) {
      throw new Error(`Too few or too many parameters for ${op}`);
    }
    if (isValue(paras[0])) {
      throw new Error(`Body: Type Error for ${paras[0]}`);
    }
    if (isValue(paras[1])) {
      throw new Error(`Body: Type Error for ${paras[1]}`);
    }
    let leftList = parseBody(paras[0] as TargetTableAttribute | TargetTableOperator);
    let rightList = parseBody(paras[1] as TargetTableAttribute | TargetTableOperator);
    return leftList.concat(rightList);
  } else {
    return [body];
  }
}

const queryTable = (
  constraints: any[],
  body: TargetTableAttribute | TargetTableOperator,
  tables: DataTable[]
): string | number => {
  let queryAttr: TargetTableAttribute = (isAttribute(body) ? body : (body.parameters[0] as TargetTableAttribute));
  let res = [];
  let originTable = tables.find((table) => (table.name == queryAttr.data));
  originTable.tuples.forEach(tuple => {
    let ok = true;
    constraints.forEach(constraint => {
      let key = constraint.attribute, value = constraint.value;
      if (typeof (value) == "object") { //bin产生的区间，包括lower和upper 
        if(value.isRightOpen){
          if (!(tuple[key] >= value.lower - eps && tuple[key] < value.upper - eps)) {
            ok = false;
          }
        } else {
          if (!(tuple[key] >= value.lower - eps && tuple[key] <= value.upper + eps)) {
            ok = false;
          }
        }
      } else if (tuple[key] != value) {
        ok = false;
      }
    })
    if (ok) {
      res.push(tuple[queryAttr.attribute]);
    }
  });
  if (isAttribute(body)) {
    return res.length > 0 ? res[0] : null;
  } else {
    if ((body as TargetTableOperator).operator == OperatorEnum.AVERAGE) {
      if (res.length == 0) {
        return null;
      }
      let sum = 0;
      res.forEach(obj => {
        if (typeof (obj) != "number") {
          throw new Error("type error for average");
        }
        sum += Number(obj);
      })
      return sum / res.length;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.SUM) {
      if (res.length == 0) {
        return null;
      }
      let sum = 0;
      res.forEach(obj => {
        if (typeof (obj) != "number") {
          throw new Error("type error for average");
        }
        sum += Number(obj);
      })
      return sum;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.COUNT) {
      return res.length;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.CONCAT) {
      let ans = "";
      res.forEach(obj => {
        ans.concat(String(obj));
      })
      return ans;
    }
    else {
      throw new Error("illegal operator");
    }
  }
}