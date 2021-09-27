import {
  DataSource,
  InlineDataSource,
  UrlDataSource,
  InlineCSVDataSource,
  InlineJSONDataSource,
  DataSourceTypeEnum,
  DataSourceFormatEnum,
  CSVArray,
  JSONArray,
  DataTableInterface,
  DataTableAttribute,
  DataTableAttributeValue,
  DataTableTuple,
} from "./data_source";

import {
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
} from "./target_table";

interface Spec {
  data: DataSource[];
  target_table: TargetTableSyntax[] | TargetTableExpression[];
}

export {
  Spec,
  DataSource,
  InlineDataSource,
  UrlDataSource,
  InlineCSVDataSource,
  InlineJSONDataSource,
  DataSourceTypeEnum,
  DataSourceFormatEnum,
  CSVArray,
  JSONArray,
  DataTableInterface,
  DataTableAttribute,
  DataTableAttributeValue,
  DataTableTuple,
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
};
