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
