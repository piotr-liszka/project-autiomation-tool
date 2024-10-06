export default {
  configFilePath: 'Path to config file',
  ghToken: 'Github token  ( https://github.com/settings/tokens )',
  ghOrganizationName: 'Organization name (eg. acme-corp)',
  ghProjectNumber: 'Project number (eg. 3)',
  pathToRepo: 'Path to repository, eg. ./acme-corp/project/',
  repoName: 'Repo name on github',
  prNumber: 'Pull request number',
  ghQuery:
    'Query to search in Github Graph eg. ticket id (https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax)',
  dryRun: 'Run command without making changes',
  timeInStatus: 'Extract time in status, save results to issue comment',
  queryToStart: "Query to start eg. state:open 9999",
  ghTokenRequired: "Token is required",
  organizationNameRequired: "Organization name is required (please provide it via --ghOrganizationName or in config file)",
  projectNumberRequired: "Project number is required (please provide it via --ghProjectNumber or in config file)",
};
