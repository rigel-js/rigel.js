import {
  DataSource,
  DataSourceFormatEnum,
  DataSourceTypeEnum,
  CSVArray,
  InlineCSVDataSource,
  InlineJSONDataSource,
  DataTableInterface,
  DataTableAttribute,
  DataTableTuple,
} from "./types";

const isCSVArray = (array: any[]): boolean => {
  return Array.isArray(array[0]);
};

const isJSONArray = (array: any[]): boolean => {
  return array[0].toString().includes("object");
};

// 将 DataSource 解析成 DataTable：补全默认值、加载数据、构造 Table 等
// TODO：感觉需要加个 hash 索引，各属性值之间能方便对应上，但两个表 union 的时候会比较蛋疼
export default class DataTable implements DataTableInterface {
  name: string = "";
  attributes: DataTableAttribute[] = [];
  tuples: DataTableTuple[] = [];

  constructor(dataSource: DataSource) {
    this.name = dataSource.name;

    const type =
      dataSource.type || (dataSource.values && !dataSource.url)
        ? DataSourceTypeEnum.INLINE
        : undefined || (!dataSource.values && dataSource.url)
        ? DataSourceTypeEnum.URL
        : undefined;
    if (!type) throw Error("undefined data source type.");

    if (type === DataSourceTypeEnum.URL) {
      // TODO: load external data
    }

    const format =
      dataSource.format || isCSVArray(dataSource.values)
        ? DataSourceFormatEnum.CSV
        : undefined || isJSONArray(dataSource.values)
        ? DataSourceFormatEnum.JSON
        : undefined;
    if (!format) throw Error("undefined data source format.");

    let values: CSVArray = [];
    if (format === DataSourceFormatEnum.JSON) {
      const attrs = Object.keys(dataSource.values[0]);
      values.push(attrs);

      (dataSource as InlineJSONDataSource).values.forEach((dataObj: object) => {
        const CSVLineArray = [];
        for (const attr of attrs) {
          CSVLineArray.push(dataObj[attr]);
        }
        values.push(CSVLineArray);
      });
    } else {
      values = (dataSource as InlineCSVDataSource).values;
    }

    this.tuples = values.slice(1);
    this.attributes = values[0].map((attrName, index) => ({
      name: attrName,
      values: Array.from(new Set(this.tuples.map((tuple) => tuple[index]))),
    }));
  }
}
