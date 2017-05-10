var express = require('express')
var app = express()
var mongodb = require('mongodb')
var autoIncrement = require("mongodb-autoincrement")

var MongoClient = mongodb.MongoClient
var port = process.env.PORT || 8080
var mongodburl = process.env.MONGOLAB_URI
var collectionName = 'urlshort'

app.get('/new/:url(*)', function(req, res) {
  console.log('url', req.params.url)
  MongoClient.connect(mongodburl, function(err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server [' + mongodburl + ']. Error:', err)
    }
    else {
      console.log('Connection established to', mongodburl)

      autoIncrement.getNextSequence(db, collectionName, function(err, autoIndex) {
        if (err) {
          console.log('error', err)
        }
        else {
          var collection = db.collection(collectionName)
          collection.insert({
            _id: autoIndex,
            url: req.params.url
          }, function(err, records) {
            if (err) {
              console.log('error', err)
            }
            else {
              console.log(records)
              console.log("Record added as " + records.insertedIds[0])
              var r = {
                original_url: req.params.url,
                short_url: req.header('x-forwarded-proto') + "://" + req.header('host') + "/" + records.insertedIds[0]
              }
              res.send(JSON.stringify(r))
            }
            db.close()
          })
        }
      })
    }
  })
})
app.get('/:urlid', function(req, res) {
  var urlid = parseInt(req.params.urlid, 10)
  console.log('urlid', urlid)
  if (!isNaN(urlid)) {
    MongoClient.connect(mongodburl, function(err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server [' + mongodburl + ']. Error:', err)
      }
      else {
        var collection = db.collection(collectionName)
        collection.findOne({
          '_id': urlid
        }, function(err, d) {
          if (err) {
            console.log('error', err)
          }
          else {
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
app.listen(port, function() {
  console.log('Example app listening on port ' + port)
})
