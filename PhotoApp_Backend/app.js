const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require('firebase-admin');
const serviceAccount = require('./photofinder-2bab3-firebase-adminsdk-xaw94-a26fe089c2.json');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
require('./UserDetails')

const mongoUrl =
  "mongodb+srv://poojanvyas03:admin@cluster0.sx0ec1g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  const JWT_SECRET =
  "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jdsds039[]]pou89ywe";

  const FaceLinksJoin = mongoose.model("FaceLinksJoinDetails");

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((e) => {
    console.log(e);
  });


  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'photofinder-2bab3.appspot.com' // Replace this with your storage bucket
  });
  
  // Create a Cloud Storage bucket reference
  const bucket = admin.storage().bucket();
  
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());


require("./UserDetails");
const User = mongoose.model("UserInfo");

app.get("/", (req, res) => {
  res.send({ status: "Started" });
});

app.post("/register", async (req, res) => {
  const { name, email, mobile, password, userType } = req.body;
  console.log(req.body);

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    return res.send({ data: "User already exists!!" });
  }
  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({
      name: name,
      email: email,
      mobile,
      password: encryptedPassword,
      userType,
    });
    res.send({ status: "ok", data: "User Created" });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

app.post("/login-user", async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    const oldUser = await User.findOne({ email: email });
  
    if (!oldUser) {
      return res.send({ data: "User doesn't exists!!" });
    }
  
    if (await bcrypt.compare(password, oldUser.password)) {
      const token = jwt.sign({ email: oldUser.email }, JWT_SECRET);
      console.log(token);
      if (res.status(201)) {
        return res.send({
          status: "ok",
          data: token,
        });
      } else {
        return res.send({ error: "error" });
      }
    }
  });

  app.post("/userdata", async (req, res) => {
    const { token } = req.body;
    try {
      const user = jwt.verify(token, JWT_SECRET);
      const useremail = user.email;
  
      User.findOne({ email: useremail }).then((data) => {
        return res.send({ status: "Ok", data: data });
      });
    } catch (error) {
      return res.send({ error: error });
    }
  });

  app.post("/update-user", async (req, res) => {
    const { name, email, mobile, image, gender, profession } = req.body;
    console.log(req.body);
    try {
      await User.updateOne(
        { email: email },
        {
          $set: {
            name,
            mobile,
            image,
            gender,
            profession,
          },
        }
      );
      res.send({status:"Ok",data:"Updated"})
    } catch (error) {
      return res.send({ error: error });
    }
  });

  app.get('/create-event-folder/:eventName', async (req, res) => {
    const eventName = req.params.eventName;
    const password = req.query.password;
    try {
      // Create a reference to the event folder
      const folder = bucket.file(`${eventName}/`);
  
      // Upload a dummy file to the reference to create the folder
      await folder.save('');
  
      const folderLink = `https://storage.googleapis.com/photofinder-2bab3.appspot.com/${eventName}/`;
      
      const newFaceLinksJoin = new FaceLinksJoin({
        EventName: eventName,
        Password: password,
        Link: folderLink
      });
      await newFaceLinksJoin.save();
  
      res.json({ link: folderLink });
    } catch (error) {
      console.error('Error creating event folder:', error);
      res.status(500).json({ message: 'Error creating event folder' });
    }
  });
  
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  
  app.post('/upload-images/:eventName', upload.array('images'), async (req, res) => {
    console.log("uploading the image node")
    const eventName = req.params.eventName;
    
    // Log the names or paths of uploaded images
    req.files.forEach(file => {
      file.originalname = file.originalname.split('.')[0] + '.jpg';
      
      // console.log('Uploaded image path:', file.path); // Uncomment this line to log the file path
    });
    
    const images = req.files;
    try {
          const imageUrls = [];
          // Iterate through the uploaded images
          for (const image of images) {
            const file = bucket.file(`${eventName}/${image.originalname}`);
            // Upload the image to Firebase Storage
            await file.save(image.buffer);
      
            // Get the public URL of the uploaded image
            const [url] = await file.getSignedUrl({ action: 'read', expires: '01-01-2500' });
            imageUrls.push(url);
          }
      
          // Print the URLs of the uploaded images to the Node terminal
          console.log('Uploaded image URLs:', imageUrls);
      
          res.json({ message: 'Images uploaded successfully', imageUrls });
        } catch (error) {
          console.error('Error uploading images:', error);
          res.status(500).json({ message: 'Error uploading images' });
        }
  });
  
  app.post("/join-event-auth", async (req, res) => {
    const { authEventName, authEventLink, authPassword } = req.body;
    console.log(authEventName + ": " + authPassword + " " + authEventLink);
  
    try {
      // Find the event details from the database
      const eventFromDb = await FaceLinksJoin.findOne({ EventName: authEventName });
  
      // If eventFromDb is null, the event does not exist
      if (!eventFromDb) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      // Check if the provided credentials match the database values
      if (
        eventFromDb.EventName === authEventName &&
        eventFromDb.Link === authEventLink &&
        eventFromDb.Password === authPassword
      ) {
        // Authentication successful
        return res.json({ data: "join event success!" });
      } else {
        // Authentication failed
        return res.status(401).json({ data: "join event failed" });
      }
    } catch (error) {
      console.error("Error joining event:", error);
      return res.status(500).json({ message: "Error joining event" });
    }
  });
  

app.listen(5001,()=>{
    console.log("Node js server started");
})