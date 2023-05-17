// load express module with "require" directive
const express = require("express");
const fileUpload = require("express-fileupload");
const { Web3Storage, getFilesFromPath } = require("web3.storage");
const app = express();
app.use(express.static(__dirname));
app.use(
  fileUpload({
    extended: true,
  })
);
app.use(express.json());
const path = require("path");

require("dotenv").config();
const ethers = require("ethers");

var port = 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/uploadData", async (req, res) => {
  var name = req.body.filename;
  var sampleFile = req.files.file1;
  var filename = req.files.file1.name;

  async function moveFiletoServer() {
    sampleFile.mv(__dirname + `/${filename}`, (err) => {
      if (err) {
        return res.status(500).send(err);
      }
      console.log("File berhasil ditambahkan ke server!");
    });
  }

  async function uploadAddDataToIPFS() {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGUwOUJDQjZBYjAxRDQzMzlEMjY3MjVDRDcyQWFjMUEyYzUyRWJiOTciLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODQyNzc5OTU2NjgsIm5hbWUiOiJ0ZXN0aW5nIn0.gCHtwTQvqHYInM4qXKyhOtextW-fxkJlqYSR8NUfqyE";
    const storage = new Web3Storage({ token: token });
    const files = await getFilesFromPath(__dirname + `/${filename}`);
    console.log("Mengupload file ke IPFS, mohon tunggu...");
    const cid = await storage.put(files);
    console.log(`IPFS CID: ${cid}`);
    return cid;
  }

  async function storeDataInBlockchain(hash) {
    const API_URL = process.env.API_URL;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const CONTRACT_ADDRESS_1 = process.env.CONTRACT_ADDRESS;
    // Contract ABI
    const {
      abi,
    } = require("./artifacts/contracts/IPFSHashStorage.sol/IPFSHashStorage.json");
    const provider = new ethers.providers.JsonRpcProvider(API_URL);
    // Mengkalkulasi Alamat Blockchain Dari Private Key
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    // console.log(signer)
    const StorageContract = new ethers.Contract(
      CONTRACT_ADDRESS_1,
      abi,
      signer
    );

    let _hash = hash.toString();

    const isStored = await StorageContract.isFileStored(name);

    if (isStored == false) {
      console.log("Menyimpan data IPFS Hash");
      const tx = await StorageContract.upload(name, _hash);
      await tx.wait();
      const storedhash = await StorageContract.getIPFSHash(name);
      res.send(
        `IPFS hash telah ditersimpan ke dalam Smart Contract: ${storedhash}`
      );
    } else {
      console.log("Data file ini telah tersimpan dalam Smart Contract");
      const IPFShash = await StorageContract.getIPFSHash(name);
      res.send(`Store Hash adalah: ${IPFShash}`);
    }
  }

  await moveFiletoServer();
  await new Promise((resolve) => setTimeout(resolve, 3000));

  let hash = await uploadAddDataToIPFS();
  await storeDataInBlockchain(hash);
});

app.listen(port, function () {
  console.log("App is listening on port 3000");
});
