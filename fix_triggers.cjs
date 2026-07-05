const fs = require('fs');
let code = fs.readFileSync('database_setup_full.sql', 'utf-8');
code = code.replace(/CREATE TRIGGER (\w+) BEFORE UPDATE ON ([\w\.]+) FOR EACH ROW EXECUTE FUNCTION update_updated_at_column\(\);/g, 
  "DROP TRIGGER IF EXISTS $1 ON $2;\nCREATE TRIGGER $1 BEFORE UPDATE ON $2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();");
fs.writeFileSync('database_setup_full.sql', code);
