const fetch = require('node-fetch');

const core = require('@actions/core');
const github = require('@actions/github');

const GoogleSpreadsheet = require('google-spreadsheet');


async function getNextCodeReviewId(fromGit, sheetTitle, sheetPos) {
  // fetch from github api

  const doc = new GoogleSpreadsheet.GoogleSpreadsheet(fromGit.sheetId);

  await doc.useServiceAccountAuth({
    client_email: fromGit.client_email,
    private_key: fromGit.private_key,
  });

  await doc.loadInfo();

  // console.log(doc.title);

  const sheet = doc.sheetsByTitle[sheetTitle];
  sheet.setHeaderProps(sheetPos.X, sheetPos.Y);

  const rows = await sheet.getRows();
  
  let lastCodeReviewId = ''
  for (let index = rows.length - 2; index > 0; index--) {
    const element = rows[index];
    if (element._rawData[0] != undefined) {
      lastCodeReviewId = element._rawData[2]
      // console.log(element._rawData[2]);
      break;
    }
  }
  let nextCodeReviewId = ''
  if(lastCodeReviewId != '') {
    // split string
    const lastCodeReviewIdSplit = lastCodeReviewId.split('CD_RV_')
    newCodeReviewId = Number(lastCodeReviewIdSplit[1])
    // console.log('newCodeReviewId', newCodeReviewId);
    nextCodeReviewId = 'CD_RV_' + String((newCodeReviewId + 1)).padStart(2, '0')

  }
  else {
    nextCodeReviewId = 'CD_RV_01'
  }
  return nextCodeReviewId
}

// fetch from Github API
async function fetchFromGithub(fromGit) {
  //get main url
  console.log('fetching github url')
  await fetch(fromGit.gitUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${fromGit.token}`
    },
  })
  .then(response => response.json())
  .then(async (data) => {
    console.log('got data from github url');
    console.log(data[0].review_comments_url);
    // console.log(data[0].commits_url);
    // commits_url

    fetchGitHubReviewComments(fromGit, data).then(async (reviewer) => {
      console.log('fetching commits url')
      await fetch(`${data[0].commits_url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${fromGit.token}`
        },
      })
      .then(response => response.json())
      .then(async (data) => {
        console.log('got commits url');
        fetchGithubCommitDetails(fromGit, data, reviewer, reviewer.nextCodeReviewId);
      });

    });

  });
  
}

async function fetchGithubCommitDetails(fromGit, commits, reviewer, nextCodeReviewId) {
  let statResult = []
  let fileResult = []
  let committer
  console.log('fetching commit details url');
  Promise.all(commits.map(async (commit) => {
    res = await fetch(`${commit.url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${fromGit.token}`
      },
    }).then(response => response.json())
    .then(async (data) => {
      committer = data.committer.login;
      return {stat:data.stats, file:data.files}
    })
    statResult.push(res.stat)
    fileResult.push(res.file)

  })).then(async () => {
    console.log('got commit details url combined');
    // console.log('statResult', statResult);
    // console.log(fileResult[0]);

    let additions = 0
    let deletions = 0
    let changes = 0;
    let fileNames = [];
    // statResult.forEach((stat, index) => {
    //   console.log(stat);
    //   // additions += stat.additions;
    //   // deletions += stat.deletions;
    //   // changes += stat.changes;
    // });

    // console.log('fileResult', fileResult[0][0].sha);
    // console.log('fileResult', fileResult[fileResult.length - 1][0].sha);
    let gitRevision = `${fileResult[0][0].sha}...${fileResult[fileResult.length - 1][0].sha}`
    console.log('gitRevision', gitRevision);

    fileResult.forEach((files, index) => {
      // console.log(files);
      files.forEach(file => {
        additions += file.additions;
        deletions += file.deletions;
        changes += file.changes;

        let fileName = file.filename;
        fileNames.push(fileName);
      })
    });

    fileNames = new Set(fileNames);
    fileNames = [...fileNames];

    // console.log('additions', additions);
    // console.log('deletions', deletions);
    // console.log('changes', changes);
    // console.log('fileNames', fileNames);
    const data = {
      'Sprint': 'Sprint Name',
      'TaskID': new Date(Date.now()).toLocaleString(),
      'Code Review ID': nextCodeReviewId,
      'Developer': committer,
      'LOC Added': additions,
      'LOC Modified': changes + deletions,
      'Lines Of Code Reviewed': additions + changes + deletions,
      'List of Files Reviewed': fileNames.join('\n'),
      'Number of Comments': reviewer.commentsResult.length,
      'Reviewer': reviewer.reviewer,
      'Date of Review': new Date(Date.now()).toLocaleString(),
      'GIT Revision': gitRevision,
    }

    accessSpreadSheet(fromGit, [data], 'CodeReviewSummary', {X: 'C', Y: 3});
    // fetchGitHubReviewComments(fromGit);
  })
}

async function fetchGitHubReviewComments(fromGit, data) {
  let reviewer = ''
  let commentsResult = null
  let nextCodeReviewId = ''
  await fetch(data[0].review_comments_url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${fromGit.token}`
    },
  })
  .then(response => response.json())
  .then(async (data) => {
    // console.log('done 2');
    // console.log(data[0]);
    // console.log(data[4]);

    nextCodeReviewId = await getNextCodeReviewId(fromGit, 'CodeReviewSummary', {X: 'C', Y: 3});

    result = [];
    data.forEach(d => {
      // console.log(d.body, d.user.login, d.path);
      reviewer = d.user.login;
      result.push({
        'Code Review ID': nextCodeReviewId,
        'Comment': d.body,
        'File Name': d.path,
      });
    });
    commentsResult = result
    // console.log(result);
    accessSpreadSheet(fromGit, result, 'CodeReviewComments', {X: 'B', Y: 5});
    // return reviewer;
  });
  return {reviewer, commentsResult, nextCodeReviewId};
}

async function accessSpreadSheet(fromGit, result, sheetTitle, sheetPos) {
  // fetch from github api

  const doc = new GoogleSpreadsheet.GoogleSpreadsheet(fromGit.sheetId);

  await doc.useServiceAccountAuth({
    client_email: fromGit.client_email,
    private_key: fromGit.private_key,
  });

  await doc.loadInfo();

  // console.log(doc.title);

  const sheet = doc.sheetsByTitle[sheetTitle];
  sheet.setHeaderProps(sheetPos.X, sheetPos.Y);
  // sheet.setHeaderProps('B', 5)

  
  // sheet.addRow({
  //   'Code Review ID': Date.now(),
  //   'Comment': Date.now(),
  // })
  // console.log(result.length)
  // result.forEach(row => {
  //   console.log('row');
  //   console.log(row);
  //   sheet.addRow(row) // this is a promise
  // });

  //execute promise sequentially 
  // await Promise.all(result.map(row => sheet.addRow(row)))
  sheet.addRows(result);

  // result.reduce(
  //   (p, x) =>
  //     p.then(_ => sheet.addRow(row)),
  //   Promise.resolve()
  // )

}

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  console.log(`Hello ${core.getInput('sheetId')}!`);
  console.log(`Hello ${core.getInput('client_email')}!`);
  console.log(`Hello ${core.getInput('private_key')}!`);
  console.log(`Hello ${core.getInput('token')}!`);
  console.log(`Hello ${core.getInput('gitUrl')}!`);

  console.log('test 5');
  const time = (new Date()).toTimeString();

  fromGit = {
    gitUrl: core.getInput('gitUrl'),
    sheetId: core.getInput('sheetId'),
    client_email: core.getInput('client_email'),
    private_key: core.getInput('private_key'),
    token: core.getInput('token'),
  }

  // accessSpreadSheet(fromGit)

  fetchFromGithub(fromGit)

  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
