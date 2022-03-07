const express = require("express");
const mongodb = require("mongodb");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const { consumers } = require("stream");
const jwt = require("jsonwebtoken");

router.delete("/multipleperson", authenticateToken, async (req, res) => {
  try {
    let usersDelete = [];
    const ids = req.body.ids;
    ids.forEach((id) => {
      usersDelete.push(new mongodb.ObjectId(id));
    });

    const queues = await loadQueueCollection();
    await queues.deleteMany({ _id: { $in: usersDelete } });
    console.log("delete multiple Queue");
    res.status(200).json({ msg: "Multiple Queue Successfully Deleted" });
    // res.send(usersDelete);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.post("/multipleperson", authenticateToken, async (req, res) => {
  try {
    const queues = await loadQueueCollection();
    // make it insert many
    const data = req.body;
    const newData = data.map((person) => ({
      _id: new mongodb.ObjectId(person.queueID),
      queueNumber: person.queueNumber,
      firstName: person.firstName,
      lastName: person.lastName,
      age: person.age,
      vaccineBrand: person.vaccineBrand,
      dose: person.dose,
      date: person.date,
    }));
    await queues.insertMany(newData);
    console.log("post missed queue");
    res.status(201).json({
      msg: "multiplequeue Successfully Created",
      multipleQueue: req.body,
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.post("/", authenticateToken, getCurrentQueue, async (req, res, next) => {
  try {
    const queues = await loadQueueCollection();
    await queues.insertOne({
      queueNumber: res.avaiableQueue,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      age: req.body.age,
      vaccineBrand: req.body.vaccineBrand,
      dose: req.body.dose,
      date: new Date(),
    });
    console.log("post queue");
    res.status(201).json({
      msg: "Queue Successfully Created",
      queueInfo: req.body,
      user: req.user,
    });
    next(); // call this to run the next middleware
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// protected
// GET ALL QUEUE
router.get("/", authenticateToken, async (req, res) => {
  const queues = await loadQueueCollection();
  console.log("get all queue");
  res.send(await queues.find({}).toArray());
});

// protected
// Get Limited Queue
router.get("/_limit=:limit", authenticateToken, async (req, res) => {
  const limit = parseInt(req.params.limit);
  const queues = await loadQueueCollection();
  res.send(await queues.find({}).limit(limit).toArray());
  console.log(`Get ${limit} queues only`);
});

// protected
// GET LATEST QUEUE
router.get("/latest", authenticateToken, async (req, res) => {
  const queues = await loadQueueCollection();
  res.send(await queues.find({}).sort({ queueNumber: -1 }).limit(1).toArray());
  console.log("get latest queue");
});

// protected
// Delete Queue
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const queues = await loadQueueCollection();
    await queues.deleteOne({ _id: new mongodb.ObjectId(req.params.id) });
    console.log("delete Queue");
    res.status(200).json({ msg: "Queue Successfully Deleted" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// protected
// Delete All QUeue
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const queues = await loadQueueCollection();
    await queues.deleteMany({});
    console.log("all Queue Deleted");
    res.status(200).json({ msg: "All Queue Successfully Deleted" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// delete multiple queue

// ADD QUEUE
// router.post("/", getCurrentQueue, async (req, res, next) => {
//   try {
//     const queues = await loadQueueCollection();
//     await queues.insertOne({
//       queueNumber: res.avaiableQueue,
//       firstName: req.body.firstName,
//       lastName: req.body.lastName,
//       age: req.body.age,
//       vaccineBrand: req.body.vaccineBrand,
//       dose: req.body.dose,
//       date: new Date(),
//     });
//     console.log("post queue");
//     res
//       .status(201)
//       .json({ msg: "Queue Successfully Created", queueInfo: req.body });
//     next(); // call this to run the next middleware
//   } catch (error) {
//     res.status(400).json({ msg: error.message });
//   }
// });

router.post("/downloadqr", (req, res) => {
  try {
    res.download(
      path.join(__dirname, "../../", "public", "pdf", "Queue Certificate.pdf")
    );
    // res.json({message: 'QR Code Succesfully generated'})
    // res.download(path.join(__dirname, '../../', 'pdf', 'Queue Certificate.pdf'))  //too slow
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.use(getCurrentQueueInfo);

async function getCurrentQueueInfo(req, res, next) {
  let currentQueueInfo;
  try {
    const queues = await loadQueueCollection();
    const response = await queues
      .find({})
      .sort({ queueNumber: -1 })
      .limit(1)
      .toArray();
    currentQueueInfo = response[0];
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.currentQueueInfo = currentQueueInfo;
  console.log(currentQueueInfo);
  generateQR(currentQueueInfo);
  // generatePDF(currentQueueInfo);
  console.log("getCurrentQueueInfo");
  next();
}
function generateQR(queueInfo) {
  const queue = JSON.stringify(queueInfo, null, 2);
  const queue1 = JSON.parse(JSON.stringify(queueInfo, null, 2));
  console.log(queue);
  console.log(queueInfo);
  console.log(queue1);
  QRCode.toFile(
    path.join(
      __dirname,
      "../../../client",
      "src",
      "assets",
      "qrcodes",
      `${queueInfo.queueNumber}-QRCODE.png`
    ),
    queue,
    {
      color: {
        dark: "#000", // Blue dots
        // Transparent background
      },
      width: 1200,
    },
    function (err) {
      if (err) throw err;
      console.log("done");
      generatePDF(queue1);
    }
  );
  console.log("generateQR");
}

function generatePDF(queueInfo) {
  const date = new Date(queueInfo.date);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  let hour = date.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  let minute = date.getMinutes();
  minute = minute < 10 ? "0" + minute : minute;

  function formatMonth(month) {
    if (month === 0) {
      return "January";
    } else if (month === 1) {
      return "February";
    } else if (month === 2) {
      return "March";
    } else if (month === 3) {
      return "April";
    } else if (month === 4) {
      return "May";
    } else if (month === 5) {
      return "June";
    } else if (month === 6) {
      return "July";
    } else if (month === 7) {
      return "August";
    } else if (month === 8) {
      return "September";
    } else if (month === 9) {
      return "October";
    } else if (month === 10) {
      return "November";
    } else if (month === 11) {
      return "December";
    }
  }

  const doc = new PDFDocument();
  doc.pipe(
    fs.createWriteStream(
      path.join(__dirname, "../../", "public", "pdf", "Queue Certificate.pdf")
    )
  );
  doc.image(path.join(__dirname, "../../", "public", `logo.png`), 150, 10, {
    width: 300,
    align: "center",
    valign: "center",
  });
  doc
    .image(
      path.join(
        __dirname,
        "../../../client",
        "src",
        "assets",
        "qrcodes",
        `${queueInfo.queueNumber}-QRCODE.png`
      ),
      20,
      150,
      {
        fit: [300, 300],
        align: "center",
        valign: "center",
      }
    )
    .roundedRect(16, 150, 580, 350, 10)
    .stroke("#008789");
  doc.fontSize(15);
  doc
    .fillColor("#008789")
    .text("Full Name:", 350, 170, {})
    .fillColor("#000")
    .text(`${queueInfo.firstName} ${queueInfo.lastName}`, 350, 190, {})
    .fillColor("#008789")
    .text("Queue Number:", 350, 250, {})
    .fillColor("#000")
    .text(`${queueInfo.queueNumber}`, 350, 270, {})
    .fillColor("#008789")
    .text("Vaccine Brand:", 350, 325, {})
    .fillColor("#000")
    .text(`${queueInfo.vaccineBrand}`, 350, 345, {})
    .fillColor("#008789")
    .text("Date Issued:", 350, 400, {})
    .fillColor("#000")
    .text(
      `${day}-${formatMonth(month)}-${year} ${hour}:${minute} ${ampm}`,
      350,
      420,
      {}
    );
  doc.fontSize(10);
  doc.text(
    "This is an unsecure QR Code and can be verified using the scan functionality at https://sehc.com/scanqr",
    40,
    450,
    {
      width: 280,
    }
  );
  doc.image(path.join(__dirname, "../../", "public", `Footer.jpg`), 0, 700, {
    align: "center",
    valign: "bottom",
  });
  doc.end();
  console.log("Generate PDF");
}

async function getCurrentQueue(req, res, next) {
  let currentQueue;
  try {
    const queues = await loadQueueCollection();
    const response = await queues
      .find({})
      .sort({ queueNumber: -1 })
      .limit(1)
      .toArray();
    currentQueue = response[0];
    currentQueue = currentQueue == undefined ? 0 : currentQueue.queueNumber;
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.avaiableQueue = currentQueue + 1;
  console.log("getCurrentQueue");
  next();
}

function authenticateToken(req, res, next) {
  // GEt the Token
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // set token or become null
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Connect to mongodb
async function loadQueueCollection() {
  const client = await mongodb.MongoClient.connect(
    "mongodb+srv://dev-royet:123@cluster0.witrn.mongodb.net/queue_system_mobile?retryWrites=true&w=majority"
  );
  return client.db("queue_system_mobile").collection("queue_info");
}

module.exports = router;
