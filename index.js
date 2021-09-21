const fetch = require('node-fetch');

const core = require('@actions/core');
const github = require('@actions/github');

const GoogleSpreadsheet = require('google-spreadsheet');

// fetch from Github API
async function fetchFromGithub(fromGit) {
  await fetch(fromGit.gitUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${fromGit.token}`
    },
    
  })
  .then(response => response.json())
  .then(async (data) => {
    console.log('done');
    console.log(data[0].review_comments_url);
    // return
    await fetch(data[0].review_comments_url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${fromGit.token}`
      },
      
    })
    .then(response => response.json())
    .then((data) => {
      console.log('done 2');
      // console.log(data[0]);
      // console.log(data[4]);
      result = [];
      data.forEach(d => {
        // console.log(d.body, d.user.login, d.path);
        result.push({
          code_review_id: d.id,
          comment: d.body,
          file_name: d.path,
        });
      });
      // console.log(result);
      accessSpreadSheet(fromGit, result);
    });

  });
  
}

fromGit = {
}

fetchFromGithub(fromGit)

async function accessSpreadSheet(fromGit, result) {

  // fetch from github api

  const doc = new GoogleSpreadsheet.GoogleSpreadsheet(fromGit.sheetId);

  await doc.useServiceAccountAuth({
    client_email: fromGit.client_email,
    private_key: fromGit.private_key,
  });

  await doc.loadInfo();

  console.log(doc.title);


  const sheet = doc.sheetsByTitle['CodeReviewSummary'];
  sheet.setHeaderProps('C', 3)

  
  // sheet.addRow({
  //   'Code Review ID': Date.now(),
  //   'Comment': Date.now(),
  // })

  result.forEach(row => {
    console.log(row);
    sheet.addRow({
      'Sprint': row.code_review_id,
      'TaskID': row.comment,
      'Code Review ID': row.file_name,
    })
  });

}

// try {
//   // `who-to-greet` input defined in action metadata file
//   const nameToGreet = core.getInput('who-to-greet');
//   console.log(`Hello ${nameToGreet}!`);
//   console.log(`Hello ${core.getInput('sheetId')}!`);
//   console.log(`Hello ${core.getInput('client_email')}!`);
//   console.log(`Hello ${core.getInput('private_key')}!`);

//   console.log('test 5');
//   const time = (new Date()).toTimeString();

//   fromGit = {
//     sheetId: core.getInput('sheetId'),
//     client_email: core.getInput('client_email'),
//     private_key: core.getInput('private_key'),
//   }

//   accessSpreadSheet(fromGit)

//   core.setOutput("time", time);
//   // Get the JSON webhook payload for the event that triggered the workflow
//   const payload = JSON.stringify(github.context.payload, undefined, 2)
//   console.log(`The event payload: ${payload}`);
// } catch (error) {
//   core.setFailed(error.message);
// }
