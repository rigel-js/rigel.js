import DataTable from "./data_source";

const getTableByName = (tables: DataTable[], name: string): DataTable => {
  return tables.find((table) => table.name === name);
};

const isTableAttribute = (table: DataTable, attrName: string): Boolean => {
  return table.attributes.map((attr) => attr.name).includes(attrName);
};
