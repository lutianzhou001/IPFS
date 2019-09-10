const request = require('request');
const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const simple = require('simpleid-node-sdk');
const accountSid = "AC5930fd68b3dbe2822f47fef2cd62d92c";
const authToken = "94030eab62079c31b6176e0acc1b2917";
const client = require('twilio')(accountSid, authToken);
const config = {
  apiKey: "-LoP_8eOTl-vcu83-Trn", //found in your SimpleID account page
  devId: "lutianzhou001", //found in your SimpleID account page
  authProviders: ['ethereum'], //array of auth providers that matches your modules selected
  storageProviders: ['pinata'], //array of storage providers that match the modules you selected
  appOrigin: "https://yourapp.com", //even if using SimpleID on a server or as a desktop/mobile app, you'll need to pass an origin for reference
  scopes: ['publish_data', 'store_write'], //array of permission you are requesting from the user
  development: false
}

app.use(bodyParser.json());
app.get('/content', (req, res) => {
  //this is where we will fetch the IPFS content
  res.send('Eventually content will be here')
})
app.post('/auth/create', async (req, res) => {
  //this is where we will create a user account
  const { email, id, password } = req.body;
  const credObj = {
    email,
    id,
    password,
    hubUrl: "https://hub.blockstack.org" //this is for blockstack storage, but needs to be sent even when not in use
  }
  const account = await simple.createUserAccount(credObj, config);
  res.send(account);
})

app.post('/auth/login', async (req, res) => {
  //this is where we will log a user in
  const { id, password } = req.body;
  const credObj = {
    id,
    password,
    hubUrl: "https://hub.blockstack.org"
  }
  const params = {
    credObj,
    appObj: config
  }
  const loggedIn = await simple.login(params);
  res.send(loggedIn);
})

app.post('/postContent', async (req, res) => {
  //this is where we will post the IPFS content
  const { id, ethAddr, content } = req.body;
  const contentToPin = {
    id,
    date: Date.now(),
    address: ethAddr, 
    content  
  }
  const params = {
    devId: config.devId, //your dev ID found in your SimpleID account page
    username: id, //your logged in user's username
    id: "ipfs-text", //an identifier you can use to reference your content later
    content: contentToPin, //the content we discussed previously
    apiKey: config.apiKey, //the api key found in your SimpleID account page
  }
  const postedContent = await simple.pinContent(params);
  // we begin to send messages
  const postData = {
  from: params.username,
  content: params.content.content
}
  var options = { 
  method: 'POST', 
  url: 'http://localhost:3000/sendText',
  headers: { 
    Host: 'localhost:3000', 
   'Content-Type': 'application/json' },
  body: postData,
  json: true };
  request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
  });
  res.send(postedContent);
})

app.post('/sendText', async (req, res) => {
  //this is where we will trigger the outbound text
  const { content, from } = req.body;
  client.messages
  .create({
    body: `New post from ${from}: ${content}`,
  from: "+15012731257",
  to: "+8618015565550"
  })
  .then(message => res.send(message));
  res.send("Text sent here");
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
