const http = require('http');
const req = http.request({hostname:'localhost', port:3000, path:'/api/servicios?todos=true', method:'GET'}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const d = JSON.parse(b);
      console.log('Success:', d.success);
      console.log('Servicios:', d.data?.slice(0,5).map(s => s.id + ':' + s.nombre));
    } catch(e) {
      console.log('Error:', b.substring(0,100));
    }
  });
});
req.on('error', e => console.log('Error:', e.message));
req.end();