const http = require('http');
const fs = require('fs');
const querystring = require('querystring');


let existingFiles = ['helium', 'hydrogen', 'index'];


const server = http.createServer((req,res) => {
  res.setHeader('Content-Type', 'text/html');
  console.log(req.method)
  console.log(req.url)
  console.log()

  if(req.method === 'POST' && req.url === '/element') {
    let rawData = '';

    req.on('data', (data) => {
      let exists = false;
      rawData += data;
      let parsedData = querystring.parse(rawData);
      console.log(parsedData);
      let fileName = parsedData.elementName.toLowerCase();
      console.log(fileName);
      let elementName = parsedData.elementName;
      let elementSymbol = parsedData.elementSymbol;
      let elementAtomicNumber = parsedData.elementAtomicNumber;
      let elementDescription = parsedData.elementDescription;
      let template = generateTemplate(elementName, elementSymbol, elementAtomicNumber, elementDescription)

      existingFiles.forEach((x) => {
        if(x === fileName) {
          exists = true;
        }
      })

      if(!exists) {
        let fileWriteStream = fs.createWriteStream(`./public/${fileName}.html`)
        fs.writeFile(`./public/${fileName}.html`, template, (err) => {
          if (err) throw err;
          console.log('It\'s saved!');
        })
        existingFiles.push(fileName);
        console.log(existingFiles);
        res.writeHead(200, { 'Content-Type': 'application/json'});
        res.end(`{ "success" : true }`);
      }

    })

    req.on('end', () => {
    })
  }

  // if(req.method === 'GET') {}


});

server.listen(8080, () => {
  console.log('opened server on', server.address())
})

function generateTemplate(elementName, elementSymbol, elementAtomicNumber, elementDescription) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements - ${elementName}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>${elementName}</h1>
  <h2>${elementSymbol}</h2>
  <h3>Atomic number ${elementAtomicNumber}</h3>
  <p>${elementDescription}</p>
  <p><a href="/">back</a></p>
</body>
</html>`

}