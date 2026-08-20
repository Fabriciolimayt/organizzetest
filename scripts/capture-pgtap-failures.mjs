import { readFileSync } from "node:fs";

const source = readFileSync(process.argv[2], "utf8");
const statements = [];
let statement = "";
let index = 0;
let state = "normal";
let dollarTag = "";

while (index < source.length) {
  const current = source[index];
  const next = source[index + 1];

  if (state === "normal") {
    if (current === "'" || current === '"') {
      state = current === "'" ? "single" : "double";
      statement += current;
      index += 1;
      continue;
    }
    if (current === "-" && next === "-") {
      state = "line-comment";
      statement += current + next;
      index += 2;
      continue;
    }
    if (current === "/" && next === "*") {
      state = "block-comment";
      statement += current + next;
      index += 2;
      continue;
    }
    if (current === "$") {
      const match = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        dollarTag = match[0];
        state = "dollar";
        statement += dollarTag;
        index += dollarTag.length;
        continue;
      }
    }
    if (current === ";") {
      if (statement.trim()) statements.push(statement.trim());
      statement = "";
      index += 1;
      continue;
    }
  } else if (state === "single" || state === "double") {
    const quote = state === "single" ? "'" : '"';
    if (current === quote && next === quote) {
      statement += current + next;
      index += 2;
      continue;
    }
    if (current === quote) state = "normal";
  } else if (state === "line-comment") {
    if (current === "\n") state = "normal";
  } else if (state === "block-comment") {
    if (current === "*" && next === "/") {
      statement += current + next;
      state = "normal";
      index += 2;
      continue;
    }
  } else if (state === "dollar" && source.startsWith(dollarTag, index)) {
    statement += dollarTag;
    index += dollarTag.length;
    state = "normal";
    continue;
  }

  statement += current;
  index += 1;
}

if (statement.trim()) statements.push(statement.trim());

const transformed = [];
for (const sql of statements) {
  if (/^rollback$/i.test(sql)) continue;
  transformed.push(sql);
  if (/^begin$/i.test(sql)) {
    transformed.push("create temp table pg_temp.tap_results (output text) on commit drop");
    transformed.push("grant select, insert on pg_temp.tap_results to authenticated, service_role");
  }
}

const sqlLiteral = (value) => `'${value.replaceAll("'", "''")}'`;
const wrapped = transformed.map((sql, statementIndex) => {
  if (!/^select\b/i.test(sql)) return sql;

  const label = sql.replace(/\s+/g, " ").slice(0, 120);
  return `do $capture$
begin
  insert into pg_temp.tap_results (output) ${sql};
exception when others then
  insert into pg_temp.tap_results (output)
  values (
    'not ok capture-${statementIndex} - ' || ${sqlLiteral(label)} || E'\\n# ' || sqlstate || ': ' || sqlerrm
  );
end;
$capture$`;
});

wrapped.push(`do $$
declare
  failures text;
begin
  select string_agg(output, E'\\n' order by ctid)
  into failures
  from pg_temp.tap_results
  where output like 'not ok %' or output like '# %';

  raise exception '%', coalesce(failures, 'all pgTAP assertions passed');
end;
$$`);

process.stdout.write(`${wrapped.join(";\n\n")};\n`);
