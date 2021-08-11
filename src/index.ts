import {
  Spec,
  DataSource,
  TargetTableExpression,
  TargetTableSyntax,
  TargetTable,
  ExpressionToken,
} from "./types";
import DataTable from "./data_source";
import {
  tokenizeExpression,
  parseTokens,
  computeTargetTable,
} from "./target_table";

const transform = (spec: Spec) => {
  const tables: DataTable[] = spec.data.map(
    (dataSource: DataSource): DataTable => new DataTable(dataSource)
  );

  return spec.target_table.map(
    (targetTable: TargetTableSyntax | TargetTableExpression): TargetTable => {
      let syntaxTree: TargetTableSyntax;
      if (typeof targetTable === "string") {
        const tokens: ExpressionToken[] = tokenizeExpression(targetTable);
        syntaxTree = parseTokens(tokens);
      } else {
        syntaxTree = targetTable;
      }
      // TODO: 加一个 check 环节
      return computeTargetTable(tables, syntaxTree);
    }
  );
};

const explore = () => {};

export default {
  transform,
  explore,
};
