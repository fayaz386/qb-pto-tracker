const fs = require('fs');
let content = fs.readFileSync('public/app.js', 'utf8');

const target = 'document.getElementById("deductionSummaryExtras").innerHTML = `';
const replacement = `      let warningHtml = "";
      if (d.remittance_for_period && Math.abs(Number(d.remittance_for_period) - grandTotal) > 0.01) {
         warningHtml = \\\`<div style="margin-top:10px; color: #d32f2f; font-weight:bold; background: #ffebee; padding: 10px; border-radius: 4px;">
           ⚠️ Warning: PD7A Remittance for period is \\\${fmtVal(d.remittance_for_period)}. Totals do not match!
         </div>\\\`;
      }

      document.getElementById("deductionSummaryExtras").innerHTML = \\\`
         \\\${warningHtml}`;

content = content.replace(target, replacement);
fs.writeFileSync('public/app.js', content);
console.log("Done");
