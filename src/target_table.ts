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
import { calcDimension, calString, deepClone } from "./utils";
import { start } from "repl";
import { type } from "os";
import { IfStatement } from "esprima";
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
    if(tokens.computed) {
      if(tokens.object.type != "CallExpression" || tokens.object.callee.name != "split") {
        throw new Error("Illegal Expression!");
      }
      return {
        operator: tokens.object.callee.name,
        parameters: [parseTokens(tokens.object.arguments[0]), tokens.object.arguments[1], tokens.property]
      } as TargetTableOperator;
    } else {
      return {
        data: tokens.object.name,
        attribute: tokens.property.name
      } as TargetTableAttribute;
    }
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
      if (tokens.arguments.length == 2) {
        return {
          operator: tokens.callee.name,
          parameters: [parseTokens(tokens.arguments[0]), tokens.arguments[1]]
        } as TargetTableOperator;
      } else {
        return {
          operator: tokens.callee.name,
          parameters: [parseTokens(tokens.arguments[0]), tokens.arguments[1], tokens.arguments[2], tokens.arguments[3]]
        } as TargetTableOperator;
      }
    } else if (tokens.callee.name == "intersect" || tokens.callee.name == "union" || tokens.callee.name == "mul" || tokens.callee.name == "plus") {
      return {
        operator: tokens.callee.name,
        parameters: [parseTokens(tokens.arguments[0]), parseTokens(tokens.arguments[1])]
      } as TargetTableOperator;
    } else if (tokens.callee.name == OperatorEnum.VALUEFILTER) {
      let params = [parseTokens(tokens.arguments[0])];
      for (let i = 1; i < tokens.arguments.length; i++) {
        params.push(tokens.arguments[i]);
      }
      return {
        operator: tokens.callee.name,
        parameters: params
      } as TargetTableOperator;
    } else if (tokens.callee.name == OperatorEnum.BOUNDFILTER || tokens.callee.name == OperatorEnum.SPLIT || tokens.callee.name == OperatorEnum.SUBSTR) {
      return {
        operator: tokens.callee.name,
        parameters: [parseTokens(tokens.arguments[0]), tokens.arguments[1], tokens.arguments[2]]
      } as TargetTableOperator;
    } else if (tokens.callee.name == OperatorEnum.CONCAT && tokens.arguments.length > 1) {
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
  // console.log("tables:");
  // console.log(tables);
  var targetTable: TargetTable = [];

  // if (syntaxTree.row_header && syntaxTree.column_header) {
  let rowList = parseHeader(tables, syntaxTree.row_header);
  let columnList = Object.assign(
    [],
    parseHeader(tables, syntaxTree.column_header)
  );

  if (rowList.length == 0) {
    throw new Error("Row header is empty!");
  }
  if (columnList.length == 0) {
    throw new Error("Column header is empty!");
  }

  // Body
  let cnt = 0;
  let bodyList = parseBody(syntaxTree.body);
  // console.log("body:");

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
      targetTable.push(deepClone(value));
    } else {
      targetTable.push([deepClone(value)]);
    }
  });

  // console.log(rowList)


  //Handle Body
  if (bodyList[0] === "_") {
    for (var i = columnDim; i < columnDim + rowSize; i++) {
      for (var j = rowDim; j < rowDim + columnSize; j++) {
        targetTable[i][j] = null;
      }
    }
    for (var i = columnDim; i < columnDim + rowSize; i++) {

      if (typeof (targetTable[i][0]) == "string" && targetTable[i][0] == "_") {
        targetTable[i][0] = null;
      }
    }
    for (var i = rowDim; i < rowDim + columnSize; i++) {
      if (typeof (targetTable[0][i]) == "string" && targetTable[0][i] == "_") {
        targetTable[0][i] = null;
      }
    }
    return targetTable;
  }
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
          targetTable[0][j] = calString(newTmp);
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
          targetTable[i][0] = calString(newTmp);
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
      let resTmp = queryTable(constraints, queryAttr, tables);
      // console.log("here", resTmp);
      let finalValue;
      if(resTmp.length > 1) {
        // finalValue = "";
        // for(let i = 0; i < resTmp.length; i++) {
        //   if(i) finalValue += ",";
        //   finalValue += String(resTmp[i]);
        // }
        finalValue = resTmp;
      } else if(resTmp.length == 1) {
        finalValue = resTmp[0];
      } else {
        finalValue = null;
      }
      targetTable[i][j] = {
        value: finalValue,
        source: queryAttr,
      }
    }
  }

  // 给row_header 和 column_header 加上source
  for (var i = columnDim; i < columnDim + rowSize; i++) {
    for (var j = 0; j < rowDim; j++) {
      if (!targetTable[i][j] || !targetTable[i][j].value || targetTable[i][j].value == "") continue;
      targetTable[i][j] = {
        value: targetTable[i][j].value,
        source: {
          data: targetTable[i][j].table,
          attribute: targetTable[i][j].attribute
        }
      };
    }
  }

  for (var i = 0; i < columnDim; i++) {
    for (var j = rowDim; j < rowDim + columnSize; j++) {
      if (!targetTable[i][j] || !targetTable[i][j].value || targetTable[i][j].value == "") continue;
      targetTable[i][j] = {
        value: targetTable[i][j].value,
        source: {
          data: targetTable[i][j].table,
          attribute: targetTable[i][j].attribute
        }
      };
    }
  }

  // for(let i = 0 ; i< targetTable.length;i++) {
  //   let tmp = ""
  //   for(let j= 0; j< targetTable[i].length;j++){
  //     tmp += targetTable[i][j] ? targetTable[i][j].value : "" + " "
  //   }
  //   console.log(tmp)
  // }

  // lazy处理body部分中的filter、sort函数
  // let deleteRows = {};
  // let deleteColumns = {};
  for (var i = columnDim; i < columnDim + rowSize; i++) {
    if(rowDict[i] != -1) {
      let attr = bodyList[rowDict[i]];
      if(isOperator(attr) && (attr.operator == OperatorEnum.BOUNDFILTER)) {
        let lowerBound = (attr.parameters[1] as OperatorValueParameter).value;
        let upperBound = (attr.parameters[2] as OperatorValueParameter).value;
        for(let j = rowDim; j < rowDim + columnSize; j++) {
          if(targetTable[i][j].value instanceof Array) {
            targetTable[i][j].value = targetTable[i][j].value.filter((item) => {
              return item >= lowerBound && item < upperBound; 
            })
          } else {
            if(targetTable[i][j].value < lowerBound || targetTable[i][j].value >= upperBound) {
              // deleteColumns[j] = true;
              targetTable[i][j].value = null;
            }
          }
        }
      } else if(isOperator(attr) && (attr.operator == OperatorEnum.VALUEFILTER)) {
        let dict = {};
        for(let j = 1; j < attr.parameters.length; j++) {
          dict[(attr.parameters[j] as OperatorValueParameter).value] = true;
        }
        for(let j = rowDim; j < rowDim + columnSize; j++) {
          if(targetTable[i][j].value instanceof Array) {
            targetTable[i][j].value = targetTable[i][j].value.filter((item) => {
              if(dict[item]) return true; else return false;
            })
          } else {
            if(!dict[targetTable[i][j].value]) {
              // deleteColumns[j] = true;
              targetTable[i][j].value = null;
            }
          }
        }
      } else if(isOperator(attr) && (attr.operator == OperatorEnum.ASCSORT || attr.operator == OperatorEnum.DESCSORT)) {
        let valueList: any[] = [];
        for(let j = rowDim; j < rowDim + columnSize; j++) {
          let value;
          if(targetTable[i][j].value instanceof Array) {
            value = targetTable[i][j].value.reduce((prev, cur, index) => {
              return prev + (index == 0 ? '' : ',') + String(cur);
            }, "");
          } else {
            value = targetTable[i][j].value;
          }
          valueList.push({
            value: value,
            index: j
          });
        }
        const cmp = (u, v) => {
          if(u<v) return -1;
          if(u>v) return 1;
          return 0;
        }
        valueList.sort((a, b) => {
          let u = a.value, v = b.value;
          if(typeof u == "number" && typeof v == "number") {
            return attr.operator == OperatorEnum.ASCSORT ? cmp(u, v) : cmp(v, u);
          } else {
            return attr.operator == OperatorEnum.ASCSORT ? cmp(String(u), String(v)) : cmp(String(v), String(u));
          }
        })
        let tmpTable = deepClone(targetTable);
        for(let j = rowDim; j < rowDim + columnSize; j++) {
          let index = valueList[j-rowDim].index; // 第j列应该被替换为第index列
          for(let i = 0; i < columnDim + rowSize; i++) {
            targetTable[i][j] = tmpTable[i][index];
          }
        }
      }
    }
  }

  for (var j = rowDim; j < rowDim + columnSize; j++) {
    if(columnDict[j] != -1) {
      let attr = bodyList[columnDict[j]];
      if(isOperator(attr) && (attr.operator == OperatorEnum.BOUNDFILTER)) {
        let lowerBound = (attr.parameters[1] as OperatorValueParameter).value;
        let upperBound = (attr.parameters[2] as OperatorValueParameter).value;
        for(let i = columnDim; i < columnDim + rowSize; i++) {
          if(targetTable[i][j].value instanceof Array) {
            targetTable[i][j].value = targetTable[i][j].value.filter((item) => {
              return item >= lowerBound && item < upperBound;
            }) 
          } else {
            if(targetTable[i][j].value < lowerBound || targetTable[i][j].value >= upperBound) {
              // deleteRows[i] = true;
              targetTable[i][j].value = null;
            }
          }
        }
      } else if(isOperator(attr) && (attr.operator == OperatorEnum.VALUEFILTER)) {
        let dict = {};
        for(let i = 1; i < attr.parameters.length; i++) {
          dict[(attr.parameters[i] as OperatorValueParameter).value] = true;
        }
        for(let i = columnDim; i < columnDim + rowSize; i++) {
          if(targetTable[i][j].value instanceof Array) {
            targetTable[i][j].value = targetTable[i][j].value.filter((item) => {
              if(dict[item]) return true; else return false;
            })
          } else {
            if(!dict[targetTable[i][j].value]) {
              // deleteRows[i] = true;
              targetTable[i][j].value = null;
            }
          }
        }
      } else if(isOperator(attr) && (attr.operator == OperatorEnum.ASCSORT || attr.operator == OperatorEnum.DESCSORT)) {
        let valueList: any[] = [];
        for(let i = columnDim; i < columnDim + rowSize; i++) {
          let value;
          if(targetTable[i][j].value instanceof Array) {
            value = targetTable[i][j].value.reduce((prev, cur, index) => {
              return prev + (index == 0 ? '' : ',') + String(cur);
            }, "");
          } else {
            value = targetTable[i][j].value;
          }
          valueList.push({
            value: value,
            index: i
          });
        }
        const cmp = (u, v) => {
          if(u<v) return -1;
          if(u>v) return 1;
          return 0;
        }
        valueList.sort((a, b) => {
          let u = a.value, v = b.value;
          if(typeof u == "number" && typeof v == "number") {
            return attr.operator == OperatorEnum.ASCSORT ? cmp(u,v) : cmp(v,u);
          } else {
            return attr.operator == OperatorEnum.ASCSORT ? cmp(String(u), String(v)) : cmp(String(v), String(u));
          }
        })
        let tmpTable = deepClone(targetTable);
        for(let i = columnDim; i < columnDim + rowSize; i++) {
          let index = valueList[i-columnDim].index; // 第i行应该被替换为第index行
          for(let j = 0; j < rowDim + columnSize; j++) {
            targetTable[i][j] = tmpTable[index][j];
          }
        }
      }
    }
  }

  // let filteredTargetTable = [];
  // for(let i = 0; i < columnDim + rowSize; i++) {
  //   if(deleteRows[i]) continue;
  //   let tmp = [];
  //   for(let j = 0; j < rowDim + columnSize; j++) {
  //     if(deleteColumns[j]) continue;
  //     tmp.push(targetTable[i][j]);
  //   }
  //   filteredTargetTable.push(tmp);
  // }

  // return filteredTargetTable;
  for(let i = columnDim; i < columnDim + rowSize; i++) {
    for(let j = rowDim; j < rowDim + columnSize; j++) {
      if(targetTable[i][j].value instanceof Array) {
        let finalValue = "";
        for(let k = 0; k < targetTable[i][j].value.length; k++) {
          finalValue += (k > 0 ? ',' : '') + String(targetTable[i][j].value[k]);
        }
        targetTable[i][j].value = finalValue;
      }
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
      if (para.length != 2 && para.length != 4) {
        throw new Error(`Too few or too many parameters for BIN`);
      } else if (!isValue(para[1])) {
        throw new Error(`Parameter 2 of BIN is illegal value`);
      } else {
        let attrValue = parseHeader(tables, para[0] as (TargetTableAttribute | TargetTableOperator));
        let divNumber = (para[1] as OperatorValueParameter).value;
        let lowerBound = undefined, upperBound = undefined;
        if (para.length > 2) {
          lowerBound = (para[2] as OperatorValueParameter).value;
          upperBound = (para[3] as OperatorValueParameter).value;
        }
        targetList = operators.bin(
          attrValue,
          typeof divNumber == "string" ? parseInt(divNumber) : Number(divNumber),
          lowerBound,
          upperBound
        );
      }
    } else if (op == OperatorEnum.ASCSORT) {
      let attrValue = parseHeader(tables, para[0] as (TargetTableAttribute | TargetTableOperator));
      targetList = operators.ascsort(attrValue);
    } else if (op == OperatorEnum.DESCSORT) {
      let attrValue = parseHeader(tables, para[0] as (TargetTableAttribute | TargetTableOperator));
      targetList = operators.descsort(attrValue);
    } else if (op == OperatorEnum.VALUEFILTER) {
      let attrValue = parseHeader(tables, para[0] as (TargetTableAttribute | TargetTableOperator));
      let tmp = para.slice(1);
      targetList = operators.filterByValue(attrValue, tmp);
    } else if (op == OperatorEnum.BOUNDFILTER) {
      let attrValue = parseHeader(tables, para[0] as (TargetTableAttribute | TargetTableOperator));
      targetList = operators.filterByBound(attrValue, (para[1] as OperatorValueParameter).value, (para[2] as OperatorValueParameter).value);
    } else if (op == OperatorEnum.SPLIT) {
      let attrValue = parseHeader(tables, para[0] as (TargetTableAttribute | TargetTableOperator));
      targetList = operators.Rsplit(attrValue, (para[1] as OperatorValueParameter).value, (para[2] as OperatorValueParameter).value);
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
        } else if (op === OperatorEnum.CONCAT) {
          targetList = operators.concat(leftList, rightList);
        }
      }
    }
  }
  return targetList;
};

const parseBody = (body: TargetTableAttribute | TargetTableOperator): any[] => {
  if (typeof body == "undefined" || body === null) {
    return ["_"];
  }
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
): string[] | number[] => {
  // let queryAttr: TargetTableAttribute = isAttribute(body)
  //   ? body
  //   : body.parameters[0] as TargetTableAttribute;
  // console.log("queryAttr:", queryAttr)
  if(isAttribute(body)) {
    let queryAttr = body;
    let res = [];
    let originTable = tables.find((table) => table.name == queryAttr.data);
    originTable.tuples.forEach((tuple) => {
      let ok = true;
      constraints.forEach(constraint => {
        let ok_current_constraint = true;
        let key = constraint.attribute, value = constraint.originalValue;
        if (typeof (value[0]) == "object") { //bin产生的区间，包括lower和upper 
          if (value.isRightOpen) {
            if (!(tuple[key] >= value.lower - eps && tuple[key] < value.upper - eps)) {
              ok_current_constraint = false;
            }
          } else {
            if (!(tuple[key] >= value.lower - eps && tuple[key] <= value.upper + eps)) {
              ok_current_constraint = false;
            }
          }
        } else if((typeof(tuple[key]) == "string" && typeof(value[0]) == "number") || (typeof(tuple[key]) == "number" && typeof(value[0]) == "string")) {
          // ok = (String(tuple[key]) == String(value));
          for(let i = 0; i < value.length; i++) {
            ok_current_constraint = (String(tuple[key]) == String(value[i]));
            if(ok_current_constraint) break;
          }
        } else {
          for(let i = 0; i < value.length; i++) {
            ok_current_constraint = (tuple[key] == value[i]);
            if(ok_current_constraint) break;
          }
        }
        ok = (ok && ok_current_constraint);
        if(!ok) return;
      });
      if (ok) {
        if(tuple[queryAttr.attribute] != undefined)
        res.push(tuple[queryAttr.attribute]);
      }
    });
    return Array.from(new Set(res));
  } else {
    if ((body as TargetTableOperator).operator == OperatorEnum.AVERAGE) {
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      if (res.length == 0) {
        return [];
      }
      let sum = 0;
      res.forEach((obj) => {
        if (typeof obj != "number" && isNaN(Number(obj))) {
          throw new Error("type error for average");
        }
        sum += Number(obj);
      });
      return [sum / res.length];
    } else if ((body as TargetTableOperator).operator == OperatorEnum.SUM) {
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      if (res.length == 0) {
        return [];
      }
      let sum = 0;
      res.forEach((obj) => {
        if (typeof obj != "number" && isNaN(Number(obj))) {
          throw new Error("type error for SUM");
        }
        sum += Number(obj);
      });
      return [sum];
    } else if ((body as TargetTableOperator).operator == OperatorEnum.COUNT) {
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      return [res.length];
    } else if ((body as TargetTableOperator).operator == OperatorEnum.SPLIT) {
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      if(res.length) {
        let pattern = (body as TargetTableOperator).parameters[1] as OperatorValueParameter;
        let index = (body as TargetTableOperator).parameters[2] as OperatorValueParameter;
        let ret = [];
        for(let i = 0; i < res.length; i++) {
          ret.push(String(res[i]).split(String(pattern.value))[index.value]);
        }
        return ret;
      } else {
        return [];
      }
    } else if ((body as TargetTableOperator).operator == OperatorEnum.SUBSTR) {
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      if(res.length) {
        let s = (body as TargetTableOperator).parameters[1] as OperatorValueParameter;
        let t = (body as TargetTableOperator).parameters[2] as OperatorValueParameter;
        return [String(res[0]).substr(Number(s.value), Number(t.value))]; 
      } else {
        return [];
      }
    } else if ((body as TargetTableOperator).operator == OperatorEnum.BOUNDFILTER || (body as TargetTableOperator).operator == OperatorEnum.VALUEFILTER) {
      // 对body的filter部分lazy处理
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      return res;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.ASCSORT || (body as TargetTableOperator).operator == OperatorEnum.DESCSORT) {
      // 对body的sort部分lazy处理
      let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      return res;
    } else if ((body as TargetTableOperator).operator == OperatorEnum.CONCAT) {
      if(body.parameters.length == 1){
        let res = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
        let ans = "";
        res.forEach((obj) => {
          ans += String(obj);
        });
        return [ans];
      } else {
        let res1 = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
        let res2 = queryTable(constraints, ((body as TargetTableOperator).parameters[1]) as (TargetTableAttribute | TargetTableOperator), tables);
        // console.log("!!!", res1, res2);
        if(res1.length && res2.length) {
          let res = [];
          for(let i = 0; i < res1.length && i < res2.length; i++) {
            res.push(String(res1[i]).concat(String(res2[i])));
          }
          for(let i = res2.length; i < res1.length; i++) {
            res.push(String(res1[i]).concat(String(res2[i])));
          }
          for(let i = res1.length; i < res2.length; i++) {
            res.push(String(res1[i]).concat(String(res2[i])));
          }
          return res;
        } else if(res1.length && !res2.length) {
          return res1;
        } else if(!res1.length && res2.length) {
          return res2;
        } else {
          return [];
        }
      }
    } else if ((body as TargetTableOperator).operator == OperatorEnum.MUL) {
      let res1 = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      let res2 = queryTable(constraints, ((body as TargetTableOperator).parameters[1]) as (TargetTableAttribute | TargetTableOperator), tables);
      console.log("!!!", res1, res2, JSON.stringify(constraints));
      return operators.mul(res1, res2);
    } else if ((body as TargetTableOperator).operator == OperatorEnum.PLUS) {
      let res1 = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      let res2 = queryTable(constraints, ((body as TargetTableOperator).parameters[1]) as (TargetTableAttribute | TargetTableOperator), tables);
      console.log("!!!", res1, res2);
      return operators.plus(res1, res2);
    } else if ((body as TargetTableOperator).operator == OperatorEnum.UNION) {
      let res1 = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      let res2 = queryTable(constraints, ((body as TargetTableOperator).parameters[1]) as (TargetTableAttribute | TargetTableOperator), tables);
      console.log("!!!", res1, res2);
      if(res1.length && res2.length) {
        let res = [];
        let s = {};
        for(let i = 0; i < res1.length; i++) {
          res.push(res1[i]);
          s[res1[i]] = true;
        }
        for(let i = 0; i < res2.length; i++) {
          if(!s[res2[i]]) {
            res.push(res2[i]);
            s[res2[i]] = true;
          }
        }
        return res;
      } else if(res1.length && !res2.length) {
        return res1;
      } else if(!res1.length && res2.length) {
        return res2;
      } else {
        return [];
      }
    } else if ((body as TargetTableOperator).operator == OperatorEnum.INTERSECT) {
      let res1 = queryTable(constraints, ((body as TargetTableOperator).parameters[0]) as (TargetTableAttribute | TargetTableOperator), tables);
      let res2 = queryTable(constraints, ((body as TargetTableOperator).parameters[1]) as (TargetTableAttribute | TargetTableOperator), tables);
      if(res1.length && res2.length) {
        let res = [];
        let s = {};
        for(let i = 0; i < res1.length; i++) {
          s[res1[i]] = true;
        }
        for(let i = 0; i < res2.length; i++) {
          if(s[res2[i]]) {
            res.push(res2[i]);
          }
        }
        return res;
      } else if(res1.length && !res2.length) {
        return res1;
      } else if(!res1.length && res2.length) {
        return res2;
      } else {
        return [];
      }
    } else {
      throw new Error("illegal operator");
    }
    // let res_all = [];
    // body.parameters.forEach(para => {
    //   let queryAttr = para as TargetTableAttribute;
    //   let res = [];
    //   let originTable = tables.find((table) => table.name == queryAttr.data);
    //   if(!originTable) return;
    //   originTable.tuples.forEach((tuple) => {
    //     let ok = true;
    //     constraints.forEach(constraint => {
    //       let key = constraint.attribute, value = constraint.value;
    //       if (typeof (value) == "object") { //bin产生的区间，包括lower和upper 
    //         if (value.isRightOpen) {
    //           if (!(tuple[key] >= value.lower - eps && tuple[key] < value.upper - eps)) {
    //             ok = false;
    //           }
    //         } else {
    //           if (!(tuple[key] >= value.lower - eps && tuple[key] <= value.upper + eps)) {
    //             ok = false;
    //           }
    //         }
    //       } else if (tuple[key] != value) {
    //         ok = false;
    //       }
    //     });
    //     if (ok) {
    //       res.push(tuple[queryAttr.attribute]);
    //     }
    //   });
    //   res_all.push(res);
    // });
    // if ((body as TargetTableOperator).operator == OperatorEnum.AVERAGE) {
    //   if (res_all[0].length == 0) {
    //     return null;
    //   }
    //   let sum = 0;
    //   res_all[0].forEach((obj) => {
    //     if (typeof obj != "number") {
    //       throw new Error("type error for average");
    //     }
    //     sum += Number(obj);
    //   });
    //   return sum / res_all[0].length;
    // } else if ((body as TargetTableOperator).operator == OperatorEnum.SUM) {
    //   if (res_all[0].length == 0) {
    //     return null;
    //   }
    //   let sum = 0;
    //   res_all[0].forEach((obj) => {
    //     if (typeof obj != "number") {
    //       throw new Error("type error for average");
    //     }
    //     sum += Number(obj);
    //   });
    //   return sum;
    // } else if ((body as TargetTableOperator).operator == OperatorEnum.COUNT) {
    //   return res_all[0].length;
    // } else if ((body as TargetTableOperator).operator == OperatorEnum.SPLIT) {
    //   console.log(res_all[0]);
    //   if(res_all[0].length) {
    //     let pattern = (body as TargetTableOperator).parameters[1] as OperatorValueParameter;
    //     let index = (body as TargetTableOperator).parameters[2] as OperatorValueParameter;
    //     return String(res_all[0][0]).split(String(pattern.value))[index.value]; 
    //   }
    // } else if ((body as TargetTableOperator).operator == OperatorEnum.CONCAT) {
    //   if(body.parameters.length == 1){
    //     let ans = "";
    //     res_all[0].forEach((obj) => {
    //       ans += String(obj);
    //     });
    //     return ans;
    //   } else {
    //     let arg1 = res_all[0], arg2 = res_all[1];
    //     if(arg1.length && arg2.length) {
    //       return String(arg1[0]).concat(String(arg2[0]));
    //     } else if(arg1.length && !arg2.length) {
    //       return String(arg1[0]);
    //     } else if(!arg1.length && arg2.length) {
    //       return String(arg2[0]);
    //     } else {
    //       return null;
    //     }
    //   }
    // } else {
    //   throw new Error("illegal operator");
    // }
  }
};
