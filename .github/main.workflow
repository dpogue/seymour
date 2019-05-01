workflow "PR Checks" {
  on = "pull_request"
  resolves = [
    "npm test",
    "eslint",
  ]
}

action "npm test" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "cit"
}

action "eslint" {
  uses = "dpogue/eslint-action@dc6a6f1881705f7c00258d9e1d0affe6a823ac6f"
  secrets = ["GITHUB_TOKEN"]
}
