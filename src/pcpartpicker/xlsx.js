const XLSX = require('xlsx');
const data = require('../../data/pc_part_picker.json');


// /* add to workbook */
const wb = XLSX.utils.book_new();
data.forEach(cat => {
  console.log(cat.url.replace(/^.*#/,""));
  const ws = XLSX.utils.json_to_sheet(cat.products);
  ws_name = cat.url.replace(/^.*#/, "");
  XLSX.utils.book_append_sheet(wb, ws, ws_name.substr(0, Math.min(ws_name.length,31)));
});
// /* generate an XLSX file */
XLSX.writeFile(wb, 'data/pc_part_picker.xlsx');