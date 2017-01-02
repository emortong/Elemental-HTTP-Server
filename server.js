const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
let existingFiles = null;

let auth = {
  username: 'emortong',
  password: 'duque'
}

const server = http.createServer((req,res) => {

  function setResponse() {
    let number = existingFiles.length - 6;
    console.log(req.method)
    if(req.url !== '/') {
      req.url = req.url.substring(1);
    }
    let exists = false;
    let authorized = false;

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
            if(authorized === false) {
              let li = `    <li>\n      <a href="/${fileName}">${elementName}</a>\n    </li>`
              createNewLi(li, () => {
              changeNumber('add', number);
            });
            } else {
              let li = `    <li>\n      <a href="/${fileName}">${elementName}</a> <button type="button" id="deleteBtn" onClick="deleteReq(event)" data-pageurl="/${req.url}">X</button>\n    </li>`
              createNewLi(li, () => {
              changeNumber('add', number);
            });
            }
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
        } else if (req.url === 'create.html') {
            if(req.headers.authorization === undefined) {
              res.statusCode = 401;
              res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
              res.end();
              return;
            } else {
                let authArr = req.headers.authorization.split(' ');
                let encodedString = authArr[1];
                let base64Buffer = new Buffer(encodedString, 'base64');
                let decodedString = base64Buffer.toString();
                let userAndPass = decodedString.split(':');

                if(userAndPass[0] === auth.username && userAndPass[1] === auth.password) {
                  authorized = true;
                  deleteBtns();
                  // pass through
                } else {
                  res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"'});
                  res.end('<html><body>Invalid Authentication Credentials</body></html>')
                }
            }

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
            console.log('req.url: ', req.url);
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
                let li = `      <a href="/${req.url}">${element}</a> <button type="button" id="deleteBtn" onClick="deleteReq(event)" data-pageurl="/${req.url}">X</button>`;
                deleteLi(li, () => {
                  changeNumber('sub', number);
                });
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

function createNewLi(li, done) {
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    data.splice(12, 0, li);
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    done()
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

function deleteLi(li, done) {
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    let indextoDelete = data.indexOf(li) -1;
    data.splice(indextoDelete, 1);
    data.splice(indextoDelete, 1);
    data.splice(indextoDelete, 1);
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    done()
    });
  })
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function changeNumber(operation, number) {
  if(operation === 'add') {
    number += 1;
  } else {
    number-= 1;
  }
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    let wordsArr = data[10].split(' ')
    wordsArr.splice(4,1, `${number}</h3>`)
    wordsArr = wordsArr.join(' ');
    data.splice(10, 1, wordsArr);
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    });
  })
}

function deleteBtns() {
  console.log('hi');
  fs.readFile('./public/index.html', (err, fileContent) => {
    data = fileContent.toString().split("\n");
    data.forEach((x, i) => {
      let dataArr = x.split(' ');
      if(dataArr[6] === '<a' && dataArr[7] !== 'href="/create.html"' && dataArr[8] !== '<button') {
        console.log('dataArr: ', dataArr);
        let url = dataArr[7].split('"');
        console.log('url: ', url);
        url = url[1]
        console.log('url:', url)
        let btn = `<button type="button" id="deleteBtn" onClick="deleteReq(event)" data-pageurl="${url}">X</button>`;
        dataArr.push(btn);
      }
      dataArr = dataArr.join(' ');
      data.splice(i, 1, dataArr);
    })
    var text = data.join("\n");

  fs.writeFile('./public/index.html', text, function (err) {
    if (err) return console.log(err);
    });
  })
}
deleteBtns();