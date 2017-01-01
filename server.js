const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

let existingFiles = null;

const server = http.createServer((req,res) => {

  function setResponse() {
    console.log(req.method)
    if(req.url !== '/') {
      req.url = req.url.substring(1);
    }
    let exists = false;

    //========================
    //   POST
    //========================

    if(req.method === 'POST' && req.url === 'element') {
      let rawData = '';
      req.on('data', (data) => {
        rawData += data;
        let parsedData = querystring.parse(rawData);
        let fileName = `${parsedData.elementName.toLowerCase()}.html`;
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
          res.writeHead(200, { 'Content-Type': 'application/json'});
          let li = `    <li>\n      <a href="/${fileName}">${elementName}</a>\n    </li>`
          createNewLi(li);
          res.end(`{ "success" : true }`);
        } else {
            res.end(`{ "success" : false }`);
          }
      })
    }

    //========================
    //   GET
    //========================

    if(req.method === 'GET') {
        if(req.url === '/') {
          req.url = 'index.html'
        }

        existingFiles.forEach((x) => {
          if(x === req.url) {
            exists = true;
          }
        })

        if(req.url.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css')
          exists = true;
        }

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

    //========================
    //   PUT
    //========================

    if(req.method === 'PUT') {
    res.setHeader('Content-Type', 'application/json');
    let rawData = '';

     req.on('data', (data) => {
        rawData += data;
        let parsedData = querystring.parse(rawData);
        let fileName = `${parsedData.elementName.toLowerCase()}.html`;
        let elementName = parsedData.elementName;
        let elementSymbol = parsedData.elementSymbol;
        let elementAtomicNumber = parsedData.elementAtomicNumber;
        let elementDescription = parsedData.elementDescription;
        let template = generateTemplate(elementName, elementSymbol, elementAtomicNumber, elementDescription)

      existingFiles.forEach((x) => {
        if(x === req.url) {
          exists = true;
        }
      })

       if(exists) {
          let oldElement = req.url.split('.');
          oldElement = toTitleCase(oldElement[0]);
          let fileWriteStream = fs.readFile(`./public/${req.url}`)
          fs.writeFile(`./public/${req.url}`, template, (err) => {
            if (err) throw err;
          })
          fs.rename(`./public/${req.url}`,`./public/${fileName}`, (err) => {
            if (err) throw err;
          })
          res.writeHead(200, { 'Content-Type': 'application/json'});
          let newEl = `      <a href="/${fileName}">${elementName}</a>`;
          let oldEl = `      <a href="/${req.url}">${oldElement}</a>`
          replaceEl(newEl, oldEl);
          res.end(`{ "success" : true }`);
        } else {
          res.statusCode = 500;
          res.end(`{ "error" : "resource /${req.url} does not exist" }`);
        }
      });
    }

      //========================
      //   DELETE
      //========================

      if(req.method === 'DELETE') {
        let element = req.url.split('.');
        element = element[0];
        element = toTitleCase(element);
        existingFiles.forEach((x) => {
          if(x === req.url) {
            exists = true;
          }
        })
        if(exists) {
          fs.unlink(`./public/${req.url}`, (err) => {
            if (err) throw err;
            let li = `      <a href="/${req.url}">${element}</a>`;
            deleteLi(li);
            res.writeHead(200, { 'Content-Type': 'application/json'});
            res.end(`{ "success" : true }`)
          });
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json'});
          res.end(`{ "error" : "resource /${req.url} does not exist" }`)

        }
      }

  }

  fs.readdir('./public', (err, files) => {
      if (err) throw err;
      existingFiles = files;
      setResponse(); // everything is called from here bc async
    });

}); // close server

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

function createNewLi(li) {
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    data.splice(12, 0, li);
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    });
  })
}

function replaceEl(newEl, oldEl) {
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    let oldElIndex = data.indexOf(oldEl);
    data.splice(oldElIndex, 1, newEl);
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    });
  })
}

function deleteLi(li) {
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    let indextoDelete = data.indexOf(li) -1;
    data.splice(indextoDelete, 1);
    data.splice(indextoDelete, 1);
    data.splice(indextoDelete, 1);
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    });
  })
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}