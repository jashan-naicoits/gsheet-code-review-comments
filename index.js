const core = require('@actions/core');
const github = require('@actions/github');

const GoogleSpreadsheet = require('google-spreadsheet');
const {  promisify } = require('util');

const credentials = require('./client_secret.json');

async function accessSpreadSheet(fromGit) {
  const doc = new GoogleSpreadsheet.GoogleSpreadsheet(fromGit.sheetId);
  console.log('test 1');
  // await promisify(doc.useServiceAccountAuth)(credentials);

  await doc.useServiceAccountAuth({
    client_email: fromGit.client_email,
    private_key: fromGit.private_key,
  });

  console.log('test 2');

  await doc.loadInfo();

  console.log(doc.title);

  console.log('test 3');

  const sheet = doc.sheetsByTitle['CodeReviewComments'];
  sheet.setHeaderProps('B', 5)

  console.log('test 4');
  
  sheet.addRow({
    'Code Review ID': Date.now(),
    'Comment': Date.now(),
  })

}

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  console.log(`Hello ${core.getInput('sheetId')}!`);
  console.log(`Hello ${core.getInput('client_email')}!`);
  console.log(`Hello ${core.getInput('private_key')}!`);

  console.log('test 5');
  const time = (new Date()).toTimeString();

  fromGit = {
    sheetId: core.getInput('sheetId'),
    client_email: core.getInput('client_email'),
    private_key: core.getInput('private_key'),
  }

  accessSpreadSheet(fromGit)

  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
