# Automated Code Review Comments javascript action

This action should be executed on pull request merge. It will loop through the commits and get the LOC added, modified (changed + deleted). It will also capture the comments too. Once the data is captured the action will copy the data to a Google Sheet.

## Inputs


## `who-to-greet`
## `sheetId`
## `client_email`
## `private_key`
## `token`
## `gitUrl`
## `pr_number`


***

# How to

Create a Google Sheet with the following rules:

> **`CodeReviewSummary` Sheet Name**

Headers as  
*Sprint	TaskID	Code Review ID	Reviewer	Developer	LOC Added	LOC Modified	Lines Of Code Reviewed	Hours Spent	List of Files Reviewed	Number of Comments	Date of Review	GIT Revision	Remarks*  
**Sprint** Header should start at **C3**  

> **`CodeReviewComments` Sheet Name**

Headers as  
*Code Review ID	Comment	File Name	Comment Type	File Type	Priority	Status	Remarks*  
**Code Review ID** Header should start at **B5**

> **Note do not change the header name or header position.**

## Secrets

We have a service account created in Google Cloud Platform  
*For access check with Admin Team*


- ***`GSHEET_PRIVATE_KEY`***  


Get Private key from https://console.cloud.google.com/iam-admin/serviceaccounts/  
Download the json and copy the private key to a text editor  
Replace "\n" with Enter key  
Copy the private key and add to the GitHub secrets as ***GSHEET_PRIVATE_KEY***  


- ***`GSHEET_CLIENT_EMAIL`***

Copy the client email and add to the GitHub secrets as  

- ***`GSHEET_CLIENT_EMAIL`***  
Also give write permission to the code review tracker for the Code Review Tracker  


- ***`GIT_HUB_CI_TOKEN`***

Create a Personal Access Token from Github who has owner access to the repo  
Copy the token and paste in GitHub secrets as ***GIT_HUB_CI_TOKEN***  


- ***`GIT_URL`***

This will be your repo url in below format  
https://api.github.com/repos/{organisation}/{reponame}/pulls  
For example 
if your repo url is   
https://github.com/Naico-Mobile-Team/ecommerce_nrc  
then the GIT_URL will be  
https://api.github.com/repos/Naico-Mobile-Team/ecommerce_nrc/pulls  
