import { sql, SQL } from "drizzle-orm";
import {
  PgTable,
  PgTableWithColumns,
  PgUpdateSetSource,
  TableConfig,
} from "drizzle-orm/pg-core";
const nonColunsKeys = ["enableRLS"];

export function getCollumNamesOfTable<T extends TableConfig>(
  table: PgTableWithColumns<T>,
) {
  const columns = Object.keys(table)
    .filter((key) => !nonColunsKeys.includes(key))
    .map((key) => {
      const value = table[key];
      return "name" in value ? value.name : undefined;
    });
  return columns.filter((column) => column) as string[];
}

export function mapColumnNameWithJsKey<T extends TableConfig>(
  table: PgTableWithColumns<T>,
) {
  const columns = Object.keys(table).filter(
    (key) => !nonColunsKeys.includes(key),
  );

  return new Map(
    columns.map((key) => {
      const column = table[key];
      return [column.name, key];
    }),
  );
}

export function generateUpdateSet<T extends TableConfig>(
  table: PgTableWithColumns<T>,
  primaryKeyColumn: T["columns"][string],
): PgUpdateSetSource<PgTable<T>> {
  const allColumns = getCollumNamesOfTable(table);
  const mapColumns = mapColumnNameWithJsKey(table);
  const validColumns = allColumns.filter(
    (columnName) => columnName !== primaryKeyColumn.name,
  );
  const itens: Record<string, SQL> = {};

  for (const column of validColumns) {
    const columnJSKey = mapColumns.get(column);
    if (!columnJSKey) continue;
    const str = "EXCLUDED." + column;
    itens[columnJSKey] = sql.raw(str);
  }
  return itens;
}
