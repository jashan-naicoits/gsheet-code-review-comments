# Hello world javascript action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

## `who-to-greet`
## `sheetId`
## `client_email`
## `private_key`
## `token`
## `gitUrl`
## `pr_number`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

## `time`

The time we greeted you.

## Example usage

uses: actions/hello-world-javascript-action@v1.4
with:
  who-to-greet: 'Mona the Octocat'