// Simple test script to fetch planner debug endpoint
const http = require('http');
const url = 'http://localhost:5002/api/planner/debug';

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      console.log('debug sample breakfast combos:', JSON.stringify(j.sample.breakfast.combos, null, 2));
    } catch (e) {
      console.error('Failed to parse response', e, data);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Request failed', err.message);
  process.exit(1);
});
