import DataTable from "./data_source";

export const getTableByName = (tables: DataTable[], name: string): DataTable => {
  return tables.find((table) => table.name === name);
};

export const isTableAttribute = (table: DataTable, attrName: string): Boolean => {
  return table.attributes.map((attr) => attr.name).includes(attrName);
};

export const calcDimension = (arr: any): number => {
  let j = 1;
  for (let i in arr) {
    if(arr[i] instanceof Array) {
      let d = calcDimension(arr[i]);
      if (1 + d > j) {
        j = 1 + d;
      }
    }
  }
  return j;
};