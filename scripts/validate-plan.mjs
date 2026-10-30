import fs from 'node:fs';import {parsePlan,schedulePlan} from '../src/plan-format.mjs';
const file=process.argv[2];if(!file){console.error('Kullanım: node scripts/validate-plan.mjs /tam/yol/plan.json');process.exit(1);}
try{const plan=parsePlan(fs.readFileSync(file,'utf8')),preview=schedulePlan(plan,'custom_'+'0'.repeat(32),new Date().toISOString().slice(0,10));console.log(JSON.stringify({valid:true,title:plan.title,days:preview.metadata.dayCount,startDate:preview.metadata.startDate,endDate:preview.metadata.endDate},null,2));}catch(e){console.error(e.message);process.exitCode=1;}
