import DataTable from "./data_source";

export const getTableByName = (
  tables: DataTable[],
  name: string
): DataTable => {
  return tables.find((table) => table.name === name);
};

export const isTableAttribute = (
  table: DataTable,
  attrName: string
): Boolean => {
  return table.attributes.map((attr) => attr.name).includes(attrName);
};

export const calcDimension = (arr: any): number => {
  // let j = 1;
  // for (let i in arr) {
  //   if (arr[i] instanceof Array) {
  //     let d = calcDimension(arr[i]);
  //     if (1 + d > j) {
  //       j = 1 + d;
  //     }
  //   }
  // }
  // return j;
  if (!(arr instanceof Array) || arr.length == 0) return 0;
  if (arr instanceof Array) {
    if (arr[0] instanceof Array) {
      return arr[0].length;
    } else {
      return 1;
    }
  }

};

// 字符串化spec
export const calString = (spec) => {
  if (!spec) { 
    return ""; 
  } else if (typeof (spec.value) == "number") {
    return String(spec.value);
  } else if (typeof (spec.value) == "string") {
    return `'${String(spec.value)}'`;
  } else if (spec.data) {
    return `${spec.data}.${spec.attribute}`;
  } else {
    let res = [];
    if (spec.parameters && spec.parameters.length > 0) {
      spec.parameters.forEach(item => {
        res.push(calString(item));
      })
    }
    if (spec.operator == "cross" || spec.operator == "add") {
      let tmp = res[0];
      for (let i = 1; i < res.length; i++) {
        tmp += ` × ${res[i]}`;
      }
      return tmp;
    } else {
      let tmp = spec.operator + "(";
      for (let i = 0; i < res.length; i++) {
        if (i == 0) {
          tmp = tmp + res[i];
        } else {
          tmp = tmp + ", " + res[i];
        }
      }
      tmp = tmp + ")";
      return tmp;
    }
  }
}
