const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const connectDB = require('./config/db');

const Url = require('./models/Model-Url');
 
// Express app
const app = express();

// Required Routes
const urlRoute = require("./routes/route-url");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true,}));

// cors
app.use(cors({ origin: true, credentials: true }));
// use Routes
app.use("/api/url", urlRoute);

// Connect Database
connectDB();

//redirect to original url and update visit history
app.get('/:shortId', async (req, res) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId },
      {
        $push: {
          visitHistory: {
            timestamp: new Date(),
          }
        }
      },
      { new: true } // Return the updated document
    );

    if (url) {
      console.log("shortId visited >>>>>>", req.params.shortId);
      return res.redirect(url.originalUrl);
    } else {
      console.log('No url found >>>>>', req.params.shortId);
      return res.status(404).json('No url found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

// 404 Error
app.use((req, res, next) => {
  next(createError(404));
});
app.use(function (err, req, res, next) {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});

// PORT
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log("Connected to port " + port);
});


