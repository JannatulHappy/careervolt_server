const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());
// middleware
// app.use(
//   cors({
//     // origin:["firebase_host_link"],
//     origin: [
//       // 'http://localhost:5173',
//       "https://careervolt-f325b.firebaseapp.com",
//       "https://careervolt-f325b.web.app",
//       "http://localhost:5173",
//     ],
//     credentials: true,
//   })
// );
app.use(
  cors({
    // origin:["firebase_host_link"],
    origin: [
      // 'http://localhost:5173',
      "https://careervolt-01.firebaseapp.com",
      "https://careervolt-01.web.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wlf4d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const logger = (req, res, next) => {
  console.log("log: info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // no token available
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobsCollection = client.db("careerVoltDB").collection("jobs");
    const bidsCollection = client.db("careerVoltDB").collection("bids");
    const testimonialsCollection = client
      .db("careerVoltDB")
      .collection("testimonial");
    // auth related api
    app.post("/api/v1/jwt", logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
      // res
      //   .cookie("token", token, {
      //     httpOnly: true,
      //     secure: true,
      //     sameSite: "none",
      //   })
      //   .send({ success: true ,say:"from post"});
    });

    app.post("/api/v1/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // get all jobs
    app.get("/api/v1/user/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      // console.log(result);
      res.send(result);
    });
    // get all testimonial post by user
    app.get("/api/v1/user/testimonials", async (req, res) => {
      const result = await testimonialsCollection.find().toArray();
      console.log(result);
      res.send(result);
    });

    // get single jobs using id
    app.get("/api/v1/user/jobs/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await jobsCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });

    // place you bid form from details page
    // post single  place bid  data endpoint
    app.post("/api/v1/candidate/bids", async (req, res) => {
      const bidsData = req.body;

      // console.log(" bids", bidsData);
      const result = await bidsCollection.insertOne(bidsData);
      res.status(200).send(result);
    });

    // add job by employer for candidate
    // post single data endpoint
    app.post("/api/v1/employer/addJob", async (req, res) => {
      const jobData = req.body;
      // console.log(jobData);
      const result = await jobsCollection.insertOne(jobData);

      res.status(200).send(result);
    });
    // add testimonial by user
    // post single data endpoint
    app.post("/api/v1/user/addTestimonial", async (req, res) => {
      const testimonialData = req.body;
      console.log(testimonialData)
      // console.log(jobData);
      const result = await testimonialsCollection.insertOne(testimonialData);
      console.log("result",result)
      res.status(200).send(result);
    });

    // get jobs -- added by logged user
    app.get("/api/v1/employer/postedJobs/:email", async (req, res) => {
      const email = req.params.email;
      console.log("email", email);
      console.log("email", email);
      const query = {
        Job_poster_email: email,
      };
      const result = await jobsCollection.find(query).toArray();

      res.send(result);
    });
    // get the bid requests made by the logged user or job owner
    app.get("/api/v1/employer/bidRequests/:email", async (req, res) => {
      const email = req.params.email;
      console.log("cookie", req.cookies);
      console.log("email", email);
      const query = {
        Job_poster_email: email,
      };
      const result = await bidsCollection.find(query).toArray();

      res.send(result);
    });
    // // get all the bids  made by logged candidate
    // app.get("/api/v1/candidate/myBids/:email", async (req, res) => {
    //   const email = req.params.email;
    //   console.log("email", email);
    //   const query = {
    //     Candidate_email: email,
    //   };
    //   const result = await bidsCollection.find(query).toArray();

    //   res.send(result);
    // });
    // Get all the bids made by a logged candidate, sorted by status in ascending order
    app.get("/api/v1/candidate/myBids/:email", async (req, res) => {
      const email = req.params.email;
console.log("token", req.cookies.token);
      console.log("emailbids", email);
      console.log("token asce?", req.cookies);
      const query = {
        Candidate_email: email,
      };

      // Add the sorting operation to the MongoDB query
      const sortCriteria = { status: 1 }; // 1 for ascending order
      const result = await bidsCollection
        .find(query)
        .sort(sortCriteria)
        .toArray();

      res.send(result);
    });

    // get single posted job for update job

    app.get("/api/v1/employer/singlePostedJobs/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await jobsCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });
    // update  single job data by employer which he/she has posted
    app.put("/api/v1/employer/myPostedJobs/update/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(id, data);
      const filter = {
        _id: new ObjectId(id),
      };
      const options = { upsert: true };
      const updatedData = {
        $set: {
          Job_title: data.Job_title,
          Deadline: data.Deadline,
          Category: data.Category,
          Short_description: data.Short_description,
          Category: data.Category,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
        },
      };
      const result = await jobsCollection.updateOne(
        filter,
        updatedData,
        options
      );
      console.log(result);
      res.send(result);
    });
    // // update  status of single jobs by job posted owner
    //  app.put("/api/v1/employer/bidRequests/update/:id", async (req, res) => {
    //    const id = req.params.id;
    //    const data = req.body;
    //    console.log(id,data,"id of bid req");
    //    const filter = {
    //      _id: new ObjectId(id),
    //    };
    //    const options = { upsert: true };
    //    const updatedData = {
    //      $set: {
    //        status: data.status,

    //      },
    //    };
    //    const result = await bidsCollection.updateOne(
    //      filter,
    //      updatedData,
    //      options
    //    );
    //    console.log(result);
    //    res.send(result);
    //  });

    // Import ObjectId from the MongoDB driver

    app.put("/api/v1/employer/bidRequests/update/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Check if the id is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send("Invalid ObjectId format.");
        }

        const data = req.body;
        console.log(id, data, "id of bid req");
        const filter = {
          _id: new ObjectId(id), // Convert id to a valid ObjectId
        };
        const updatedData = {
          $set: {
            status: data.status,
          },
        };
        const result = await bidsCollection.updateOne(filter, updatedData);

        if (result.matchedCount === 0) {
          return res.status(404).send("Document not found.");
        }

        console.log(result);
        res.send("Update successful");
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // delete a  posted job from job collection by a employer
    // delete single posted job
    app.delete("/api/v1/employer/delete/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobsCollection.deleteOne(query);
      console.log(result);
      res.status(200).send(result);
    });

    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Career Volt server is running");
});

app.listen(port, () => {
  console.log(`Career Volt server is running on port ${port}`);
});
