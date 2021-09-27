export interface DataSource {
  name: string;
  type?: DataSourceTypeEnum;
  format?: DataSourceFormatEnum;
  values?: CSVArray | JSONArray;
  url?: string;
}

export enum DataSourceTypeEnum {
  INLINE = "inline",
  URL = "url",
}

export enum DataSourceFormatEnum {
  JSON = "json",
  CSV = "csv",
}

export type CSVArray = any[][];
export type JSONArray = object[];

export interface InlineDataSource extends DataSource {
  type: DataSourceTypeEnum.INLINE;
}

export interface InlineCSVDataSource extends InlineDataSource {
  format: DataSourceFormatEnum.CSV;
  values: CSVArray;
}

export interface InlineJSONDataSource extends InlineDataSource {
  format: DataSourceFormatEnum.JSON;
  values: JSONArray;
}

export interface UrlDataSource extends DataSource {
  type: DataSourceTypeEnum.URL;
  url: string;
}

export interface DataTableInterface {
  name: string;
  attributes: DataTableAttribute[];
  tuples: DataTableTuple[];
}

export interface DataTableAttribute {
  name: string;
  values: DataTableAttributeValue[];
}

export interface DataTableAttributeValue {
  value: string|number;
  table: string;
  attribute: string;
}

export type DataTableTuple = any;
