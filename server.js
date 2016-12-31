const http = require('http');
const fs = require('fs');
const querystring = require('querystring');


let existingFiles = ['helium.html', 'hydrogen.html', 'index.html', 'css/styles.css'];


const server = http.createServer((req,res) => {
  res.setHeader('Content-Type', 'text/html');
  console.log(req.method)
  console.log(req.url)
  req.url = req.url.substring(1);
  console.log(req.url)

  if(req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css')
  }

  if(req.method === 'POST' && req.url === 'element') {
    let rawData = '';

    req.on('data', (data) => {
      let exists = false;
      rawData += data;
      let parsedData = querystring.parse(rawData);
      console.log(parsedData);
      let fileName = `${parsedData.elementName.toLowerCase()}.html`;
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
        let fileWriteStream = fs.createWriteStream(`./public/${fileName}`)
        fs.writeFile(`./public/${fileName}`, template, (err) => {
          if (err) throw err;
        })
        existingFiles.push(fileName);
        console.log(existingFiles);
        res.writeHead(200, { 'Content-Type': 'application/json'});

        let li = `
        <li>
          <a href="${fileName}">${elementName}</a>
        </li>`

        createNewLine(li);

        res.end(`{ "success" : true }`);
      }

    })

    req.on('end', () => {
    })
  }

  if(req.method === 'GET') {
      let exists = false;
      if(req.url === '/') {
        req.url = 'index.html'
      }

      existingFiles.forEach((x) => {
        if(x === req.url) {
          exists = true;
          console.log('hi')
        }
      })

      if(exists) {
        fs.readFile(`./public/${req.url}`, (err, fileContent) => {
          if (err) throw err;
          res.write(fileContent);
          res.end();
        });
      } else {
        fs.readFile(`./public/404.html`, (err, fileContent) => {
          if (err) throw err;
          res.statusCode = 404;
          res.write(fileContent);
          res.end();
        })
      }


  }


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

function createNewLine(li) {

fs.readFile('./public/index.html', (err, fileContent) => {
  data = fileContent.toString().split("\n");
  data.splice(12, 0, li);
  var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
  });
})


}