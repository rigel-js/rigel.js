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
import { start } from "repl";
var esprima = require('esprima');

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

// export const tokenizeExpression = (
//   expression: TargetTableExpression
// ): ExpressionToken[] => {
//   const tokens: ExpressionToken[] = [];

//   for (const c of expression) {
//     if (c.match(/\S/)) continue;

//     if (punctuatorCharacters.includes(c)) {
//       tokens.push({
//         type: TokenTypeEnum.Punctuator,
//         value: c,
//       });
//     } else if (identifierStartCharacters.includes(c)) {
//       // TODO
//     }
//   }

//   return tokens;
// };

export const parseExpression = (
  expression: TargetTableExpression
): TargetTableSyntax => {
  let pattern = /( )*\(.*\)( )*,( )*\(.*\)( )*=>( )*\(.*\)( )*/;
  let targetTableSyntax: TargetTableSyntax = {
    row_header: undefined,
    column_header: undefined,
    body: undefined
  };
  if (!pattern.test(expression)) {
    throw new Error("Illegal Expression!");
  }

  var i = 0; // current cursor
  let startPos, cnt;
  let flag; // 0: rowHeader 1: columnHeader 2: Body
  for (flag = 0; flag < 3; flag++) {
    while (i < expression.length && expression[i] != '(') i++;
    startPos = i;
    i++;
    cnt = 1;
    for (; i < expression.length; i++) {
      if (expression[i] == '(') cnt++;
      if (expression[i] == ')') cnt--;
      if (cnt == 0) break;
    }
    if (cnt != 0) {
      throw new Error("Illegal Expression!");
    }
    if (startPos + 1 < i) {
      let tokens = esprima.parseScript(expression.slice(startPos + 1, i))
      tokens = tokens.body[0].expression;
      switch (flag) {
        case 0: targetTableSyntax.row_header = parseTokens(tokens); break;
        case 1: targetTableSyntax.column_header = parseTokens(tokens); break;
        default: targetTableSyntax.body = parseTokens(tokens); break;
      }
    } else {
      switch (flag) {
        case 0: targetTableSyntax.row_header = undefined; break;
        case 1: targetTableSyntax.column_header = undefined; break;
        default: targetTableSyntax.body = undefined; break;
      }
    }
  }

  return targetTableSyntax;
};

export const parseTokens = (tokens): TargetTableAttribute | TargetTableOperator => {
  // console.log("tokens:", tokens);
  if (tokens.type == "MemberExpression") {
    return {
      data: tokens.object.name,
      attribute: tokens.property.name
    } as TargetTableAttribute;
  } else if (tokens.type == "BinaryExpression") {
    if (tokens.operator == "+") {
      return {
        operator: "add",
        parameters: [parseTokens(tokens.left), parseTokens(tokens.right)]
      } as TargetTableOperator;
    } else if (tokens.operator == "*") {
      return {
        operator: "cross",
        parameters: [parseTokens(tokens.left), parseTokens(tokens.right)]
      } as TargetTableOperator;
    } else {
      throw new Error("Illegal Expression!");
    }
  } else if (tokens.type == "CallExpression") {
    if (tokens.callee.name == "bin") {
      return {
        operator: tokens.callee.name,
        parameters: [parseTokens(tokens.arguments[0]), { value: tokens.arguments[1].value }]
      } as TargetTableOperator;
    } else if (tokens.callee.name == "intersect" || tokens.callee.name == "union") {
      return {
        operator: tokens.callee.name,
        parameters: [parseTokens(tokens.arguments[0]), parseTokens(tokens.arguments[1])]
      } as TargetTableOperator;
    } else {
      return {
        operator: tokens.callee.name,
        parameters: [parseTokens(tokens.arguments[0])]
      } as TargetTableOperator;
    }
  } else {
    throw new Error("Illegal Expression!");
  }
};

export const computeTargetTable = (
  tables: DataTable[],
  syntaxTree: TargetTableSyntax
): TargetTable => {
  console.log("tables:");
  console.log(tables);
  var targetTable: TargetTable = [];

  // if (syntaxTree.row_header && syntaxTree.column_header) {
  let rowList = parseHeader(tables, syntaxTree.row_header);
  let columnList = Object.assign(
    [],
    parseHeader(tables, syntaxTree.column_header)
  );


  // Body
  let cnt = 0;
  let bodyList = parseBody(syntaxTree.body);
  // console.log("body:");
  // console.log(bodyList);

  if (columnList.length == 1 && columnList[0] === "_") {  // feat: 当rowHeader（或columnHeader）为空时，按照body内attr的数量填充"_"
    for (var i = 0; i < bodyList.length - 1; i++) {
      columnList.push("_");
    }
  }
  if (rowList.length == 1 && rowList[0] === "_") {
    for (var i = 0; i < bodyList.length - 1; i++) {
      rowList.push("_");
    }
  }

  // Handle Row Header and Column Header

  let rowDim = calcDimension(rowList);
  let columnDim = calcDimension(columnList);
  let rowSize = rowList.length;
  let columnSize = columnList.length;

  if (columnDim > 1) {
    columnList.forEach((value, index, arr) => {
      arr[index] = [].concat(...value);
    });
  } else {
    for (var i = 0; i < columnList.length; i++) {
      columnList[i] = [columnList[i]];
    }
  }

  if (rowDim > 1) {
    rowList.forEach((value, index, arr) => {
      arr[index] = [].concat(...value);
    });
  }

  //transpose
  columnList = columnList[0].map(function (col, i) {
    return columnList.map(function (row) {
      return row[i];
    });
  });
  for (var i = 0; i < columnDim; i++) {
    let tmp = [];
    for (var j = 0; j < rowDim; j++) {
      tmp.push(null);
    }
    targetTable.push(tmp.concat(columnList[i]));
  }
  rowList.forEach((value) => {
    if (value instanceof Array) {
      targetTable.push(value);
    } else {
      targetTable.push([value]);
    }
  });

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


  //Handle Body
  let queryAttr: TargetTableAttribute | TargetTableOperator;
  let defaultQueryAttr = -1;
  let rowDict = [], columnDict = []; // 对于初始为"_"的rowHeader，rowDict[i]记录第i行的rowHeader最后被修改为了哪一个attr（bodyList的数组下标），columnHeader同
  for (let i = 0; i < columnDim + rowSize; i++) {
    rowDict.push(-1);
  }
  for (var i = 0; i < rowDim + columnSize; i++) {
    columnDict.push(-1);
  }
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
        if (typeof targetTable[i][k] != "string") {
          constraints.push(targetTable[i][k]);
        }
      }
      for (var k = 0; k < columnDim; k++) {
        if (typeof targetTable[k][j] != "string") {
          constraints.push(targetTable[k][j]);
        }
      }

      let flag = 0; //用于去除该单元格对应的行和列都为placeholder且attr不同的情况
      if (typeof targetTable[0][j] == "string" && targetTable[0][j] == "_") {
        let tmp = bodyList[cnt];
        columnDict[j] = cnt++;
        if (isAttribute(tmp)) {
          targetTable[0][j] = (tmp as TargetTableAttribute).attribute;
        } else {
          let newTmp = tmp as TargetTableOperator;
          targetTable[0][j] = `${newTmp.operator}(${newTmp.parameters[0]})`;
        }
        flag = 1;
      }
      if (typeof targetTable[i][0] == "string" && targetTable[i][0] == "_") {
        let tmp = bodyList[cnt];
        rowDict[i] = cnt++;
        if (isAttribute(tmp)) {
          targetTable[i][0] = (tmp as TargetTableAttribute).attribute;
        } else {
          let newTmp = tmp as TargetTableOperator;
          targetTable[i][0] = `${newTmp.operator}(${newTmp.parameters[0]})`;
        }
        if (flag && bodyList[columnDict[j]] != tmp) {
          throw new Error(
            `Selected attribute conflict for ${JSON.stringify(
              bodyList[columnDict[j]]
            )} and ${JSON.stringify(tmp)}`
          );
        }
        flag = 1;
      }
      if (!flag && columnDict[j] == -1 && rowDict[i] == -1 && defaultQueryAttr == -1) {
        defaultQueryAttr = cnt++;
      }
      // console.log("row:", rowDict[i]);
      // console.log("col:", columnDict[j]);
      // console.log("def:", defaultQueryAttr)
      if (columnDict[j] != -1) {
        queryAttr = bodyList[columnDict[j]];
      } else if (rowDict[i] != -1) {
        queryAttr = bodyList[rowDict[i]];
      } else {
        queryAttr = bodyList[defaultQueryAttr];
      }
      // console.log("queryAttr:", queryAttr);
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

const isValue = (
  spec: TargetTableAttribute | TargetTableOperator | OperatorValueParameter
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
  if (typeof header == "undefined" || header === null) {
    return ["_"];
  }
  let headerAttributes: DataTableAttribute;
  let targetList: any[] = [];
  if (isAttribute(header)) {
    const attr = getAttribute(tables, header.data, header.attribute);
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
        throw new Error(`Parameter 2 of BIN is illegal value`);
      } else {
        let attrValue = parseHeader(tables, para[0] as TargetTableAttribute);
        let divNumber = (para[1] as OperatorValueParameter).value;
        targetList = operators.bin(
          attrValue,
          typeof divNumber == "string" ? parseInt(divNumber) : Number(divNumber)
        );
      }
    } else {
      if (para.length != 2) {
        throw new Error(`Too few or too many parameters for ${op}`);
      } else {
        let leftList = isValue(para[0])
          ? [para[0]]
          : parseHeader(tables, para[0]);
        let rightList = isValue(para[1])
          ? [para[1]]
          : parseHeader(tables, para[1]);
        if (op === OperatorEnum.UNION) {
          targetList = operators.union(leftList, rightList);
        } else if (op === OperatorEnum.INTERSECT) {
          targetList = operators.intersect(leftList, rightList);
        } else if (op === OperatorEnum.CROSSPRODUCT) {
          targetList = operators.cross(leftList, rightList);
        } else if (op === OperatorEnum.ADD) {
          targetList = operators.add(leftList, rightList);
        }
      }
    }
  }
  return targetList;
};

const parseBody = (body: TargetTableAttribute | TargetTableOperator): any[] => {
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
    let leftList = parseBody(
      paras[0] as TargetTableAttribute | TargetTableOperator
    );
    let rightList = parseBody(
      paras[1] as TargetTableAttribute | TargetTableOperator
    );
    return leftList.concat(rightList);
  } else {
    return [body];
  }
};

const queryTable = (
  constraints: any[],
  body: TargetTableAttribute | TargetTableOperator,
  tables: DataTable[]
): string | number => {
  let queryAttr: TargetTableAttribute = isAttribute(body)
    ? body
    : (body.parameters[0] as TargetTableAttribute);
  // console.log("queryAttr:", queryAttr)
  let res = [];
  let originTable = tables.find((table) => table.name == queryAttr.data);
  originTable.tuples.forEach((tuple) => {
    let ok = true;
    constraints.forEach(constraint => {
      let key = constraint.attribute, value = constraint.value;
      if (typeof (value) == "object") { //bin产生的区间，包括lower和upper 
        if (value.isRightOpen) {
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
    });
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
      res.forEach((obj) => {
        if (typeof obj != "number") {
          throw new Error("type error for average");
        }
        sum += Number(obj);
      });
      return sum / res.length;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.SUM) {
      if (res.length == 0) {
        return null;
      }
      let sum = 0;
      res.forEach((obj) => {
        if (typeof obj != "number") {
          throw new Error("type error for average");
        }
        sum += Number(obj);
      });
      return sum;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.COUNT) {
      return res.length;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.CONCAT) {
      let ans = "";
      res.forEach((obj) => {
        ans.concat(String(obj));
      });
      return ans;
    } else {
      throw new Error("illegal operator");
    }
  }
};
