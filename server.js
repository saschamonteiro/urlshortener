var express = require('express')
var app = express()
var mongodb = require('mongodb')
var autoIncrement = require("mongodb-autoincrement")
var dns = require('dns')
var urlx = require('url')
var bodyparser = require('body-parser')
var MongoClient = mongodb.MongoClient
var port = process.env.PORT || 8080
var mongodburl = process.env.MONGOLAB_URI
var collectionName = 'urlshort'

app.use(bodyparser.urlencoded({extended: false}))
app.use(express.static('public'))
app.post('/api/shorturl/new', (req, res) => {
  var u = req.body.url
  console.log('url', u)
  var parsedUrl = urlx.parse(u).hostname
  console.log('host', parsedUrl)
  if(parsedUrl !== null){
  dns.lookup(parsedUrl, (err2) => {
    if(err2){
      console.log('error', err2)
      res.send(JSON.stringify({"error":"invalid URL"}))
    }else{
       MongoClient.connect(mongodburl, (err, db) => {
    if (err) {
      console.log('Unable to connect to the mongoDB server [' + mongodburl + ']. Error:', err)
    }
    else {
      console.log('Connection established to', mongodburl)

      autoIncrement.getNextSequence(db, collectionName, (err, autoIndex) => {
        if (err) {
          console.log('error', err)
        }
        else {
          var collection = db.collection(collectionName)
          collection.insert({
            _id: autoIndex,
            url: u
          }, function(err, records) {
            if (err) {
              console.log('error', err)
            }
            else {
              console.log(records)
              console.log("Record added as " + records.insertedIds[0])
              var r = {
                original_url: u,
                short_url: req.header('x-forwarded-proto') + "://" + req.header('host') + "/api/shorturl/" + records.insertedIds[0]
              }
              res.send(JSON.stringify(r))
            }
            db.close()
          })
        }
      })
    }
   
    
  })
    }
  })
}
  
})
app.get('/api/shorturl/:urlid', (req, res) => {
  var urlid = parseInt(req.params.urlid, 10)
  console.log('urlid', urlid)
  if (!isNaN(urlid)) {
    MongoClient.connect(mongodburl, (err, db) => {
      if (err) {
        console.log('Unable to connect to the mongoDB server [' + mongodburl + ']. Error:', err)
      }
      else {
        var collection = db.collection(collectionName)
        collection.findOne({
          '_id': urlid
        }, (err, d) => {
          if (err) {
            console.log('error', err)
          }
          else {
            console.log('redirecting to ', d.url)
            res.writeHead(301, {
              Location: d.url
            });
            res.end();
          }
          db.close()
        })
      }
    })
  }

})
app.listen(port, () => {
  console.log('Example app listening on port ' + port)
})
