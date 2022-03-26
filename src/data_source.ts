import {
  DataSource,
  DataSourceFormatEnum,
  DataSourceTypeEnum,
  CSVArray,
  InlineCSVDataSource,
  InlineJSONDataSource,
  DataTableInterface,
  DataTableAttribute,
  DataTableAttributeValue,
  DataTableTuple,
  JSONArray,
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
    let attrs: string[] = [];
    if (format === DataSourceFormatEnum.JSON) {
      attrs = Object.keys(dataSource.values[0]);
      // values.push(attrs);

      (dataSource as InlineJSONDataSource).values.forEach((dataObj: object) => {
        const CSVLineArray = [];
        for (const attr of attrs) {
          let value: DataTableAttributeValue = {
            value: dataObj[attr],
            table: this.name,
            attribute: attr,
          };
          CSVLineArray.push(value);
        }
        values.push(CSVLineArray);
      });
    } else {
      // values = (dataSource as InlineCSVDataSource).values;  //TODO
    }

    // this.tuples = values.slice(1);
    this.tuples = dataSource.values;
    this.attributes = attrs.map((attrName, index) => {
      let valueList = [];
      values.forEach((tuple) => {
        if(tuple[index].value != undefined) {
          valueList.push(tuple[index]);
        }
      });
      var obj = {};
      valueList = valueList.reduce(function (item, next) {
        obj[next.value] ? "" : (obj[next.value] = true && item.push(next));
        return item;
      }, []);
      return {
        name: attrName,
        values: valueList,
      };
    });
    // console.log(JSON.stringify(this.attributes))
  }
}
