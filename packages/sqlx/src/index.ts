export type Column = { name: string; type: string; null?: boolean; default?: string; extra?: string };
export type Table = { name: string; columns: Column[]; pk?: string[] };
export function createTableSql(t: Table){
  const cols = t.columns.map(c => `\`${c.name}\` ${c.type} ${c.null? 'NULL':'NOT NULL'}${c.default? ` DEFAULT ${c.default}`:''}${c.extra? ` ${c.extra}`:''}`.trim());
  const pk = t.pk?.length ? [ `PRIMARY KEY (${t.pk.map(x=>`\`${x}\``).join(', ')})` ] : [];
  return `CREATE TABLE IF NOT EXISTS \`${t.name}\` (\n  ${[...cols, ...pk].join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
}
