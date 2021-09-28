const fetch = require('node-fetch');

const core = require('@actions/core');
const github = require('@actions/github');

const GoogleSpreadsheet = require('google-spreadsheet');

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
      fetchGithubCommitDetails(fromGit, data);
      console.log('finished')
    });

    return
  });
  
}

async function fetchGithubCommitDetails(fromGit, commits) {
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

  })).then(() => {
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

    console.log('additions', additions);
    console.log('deletions', deletions);
    console.log('changes', changes);
    console.log('fileNames', fileNames);
    const data = {
      'Sprint': new Date(Date.now()).toLocaleString(),
      'TaskID': new Date(Date.now()).toLocaleString(),
      'Code Review ID': new Date(Date.now()).toLocaleString(),
      'Developer': committer,
      'LOC Added': additions,
      'LOC Modified': changes + deletions,
      'Lines Of Code Reviewed': additions + changes + deletions,
      'List of Files Reviewed': fileNames.join('\n'),
    }

    accessSpreadSheet(fromGit, [data], 'CodeReviewSummary', {X: 'C', Y: 3});
    // fetchGitHubReviewComments(fromGit);
  })
}

async function fetchGitHubReviewComments(fromGit) {
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
}

fromGit = {
  gitUrl: 'https://api.github.com/repos/vineethvijayan/workflow/pulls',
  sheetId: '1V2vATD8aplBrz_VfgwZxu48q4t9vHJXfAtPIVWzQSa8',
  client_email: 'codereview@codereviewtracker-296806.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCKQ4ZMWvKzJn32\nJOUXJF1HyUaK7M/7oW0Uk6In7+aX58LL/s0R/RURoA9XFBAv1r18zBWxspqjOcVk\niUurCIeLfUKsMprftDn6ELmtGqFLtr9SD/Hd67cQ5vuRCQvN2w3TZGSpRYa8eXHB\n8IznHWvIAKkQGG0TSPsJo9Jh3u5/lgQLhbH+qgDUZtpb/bx1DJULmVzbKsVijZaT\nC927lk6vMj/BWXHFvqkwpuaXp5YCAR8AQp3wBOpXz7EykpL0WwRBVeotlmXEJlqg\nD1g1Sw3Pp3neUcHi0BEhyDF7I2b6JWCmLfOBmph4BU0xJwoE6o768QZToibrkn3R\nSC1th9V1AgMBAAECggEABjomU/gLUvBFNLnSq5PSs7H9VbJ2vObh/87qZbwTTvzR\niYMvVJkTwth0+GoJ6e2qWR2Ooz3fuGxDV1TWWJyou3/nvykEUAD7qic+BZgxHYox\n3GNQHxDyYiDVFwzTlZuWaCfvCgSnSIPREM1huzhYVgiu6e+qXKJT1B+nEQthAylQ\nj8txR2PQ76mjdBU+bau91U6rd2DEvnrMe88ecKgWVl9aZ8baXv4chZTMrGlOK57u\niVGa2dvA1A1RPvi5EAgHC4DP9CHfNzIhqFImVVxZVqTY8ZrTvT2O+Z7nL2rNv5KU\nqAJmQkWBMpUdKDnOenGVEpSyJxrTKSCQz/6Hbq5cYQKBgQDAcQG83+YwBlT4Kxx2\nHNAu40MHwXRjMhDv7Xyh9EN41NFQhmgo5cgIHo72/5VX/UlUjEbZlnSLtzfJG/Aq\nVzouPOk+gPQ5myLUw3qODHmuCsVIkRshh4PGCMaMWGVlixrEVyWQlLJAwO+1pBsd\nrO7qp6pl2wIa9IVh3yL5/Ivn6QKBgQC37cbKov30aOReadSYvwaj4Gw8sjGHzxlg\nXv7GxP5ya3obC/+ysxxXYFNabYvRLYfB37g3zlZ18iLwXE+MiqWVymKZYQT8gqJe\nTVkIiEcuMEw9+56k+fXcrIu8stxRbLM5Ww34xEfDdLy+m62kzE/8bfOBECVFWyIa\nbELpnYYVrQKBgAhfIic4Skg+jkW5gmR0/m17v3e/57NFA02ctDZLbP/9qhlpr3BQ\nBrKruaZvGe0Y/K6r540hqXJGhyu9hmYhI0vNpIvuijFTWWGOG2/AhS6YE1sDzP1Z\natcbnJ+QXODc+04dSGoQvexpOERbnj5dPouAvb3umBnaF09ZqKjdXqy5AoGAQIhK\noTpCxAgxZ/bVwqnzWHgbQch7nFzLWIa7+V2QsPCIrQiutDInlXiUhju9PK0u3pTx\n+5KHv2YvYAnjVzomEsIpigsCRt5GvbOBs36tCsWjWnP4G4Yf/0cC2DghGOh8kXkj\nE886JpfEyVOxvwp4Xebt8rCJgyYQdxjY+UJtkxkCgYBqv9VOw3kCqxPZ40Sq75gV\na/hkfLRHvGoau1I+LVD9cPPG1rpQG1yAsjjaobP9jzjtq6j/HWx5JAQ6WOc65nUv\nNe47LqW8p7XnYb+zTqToPY04MGlFxqhe8mmk8Zrd3ljO9dOtlcdSjl7g7MliUb8k\nDDOQEGQOvOo2EnRh8Yk9Lw==\n-----END PRIVATE KEY-----\n',
  token: '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'
}

fetchFromGithub(fromGit)

async function accessSpreadSheet(fromGit, result, sheetTitle, sheetPos) {
  // fetch from github api

  const doc = new GoogleSpreadsheet.GoogleSpreadsheet(fromGit.sheetId);

  await doc.useServiceAccountAuth({
    client_email: fromGit.client_email,
    private_key: fromGit.private_key,
  });

  await doc.loadInfo();

  console.log(doc.title);

  const sheet = doc.sheetsByTitle[sheetTitle];
  sheet.setHeaderProps(sheetPos.X, sheetPos.Y);
  // sheet.setHeaderProps('B', 5)

  
  // sheet.addRow({
  //   'Code Review ID': Date.now(),
  //   'Comment': Date.now(),
  // })

  result.forEach(row => {
    console.log('row');
    console.log(row);
    sheet.addRow(row)
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
