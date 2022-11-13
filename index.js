require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const validUrl = require('valid-url')
const shortId = require('shortid')

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
         console.log('Database connection successful')
       })
       .catch(err => {
         console.error('Database connection error')
       });

//Create schema for Url
let urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
})

//Create model for Url
let Url = new mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", async (req, res) => {
  if(!validUrl.isWebUri(req.body.url)){
    res.json({error: "invalid url"})
  }
  else {
    try {
      let findOne = await Url.findOne({
        original_url: req.body.url
      })
      if(findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new Url({original_url: req.body.url, short_url: shortId.generate()})
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch(err) {
      console.error(err)
      res.status(500).json("Server error...")
    }
  }
})

app.get("/api/shorturl/:short_url?", async (req,res) => {
  try {
    let urlParams = await Url.findOne({
      short_url: req.params.short_url
    })
    if(urlParams) return res.redirect(urlParams.original_url)
    else return res.status(404).json("No URL found")
  } catch(err){
    console.log(err)
    res.status(500).json("Server error...")
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
