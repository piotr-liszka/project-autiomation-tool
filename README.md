```markdown
# Time In Status Command

The `TimeInStatusCommand` is part of the Project Automation Tool (PAT) and is used to track the time issues spend in different statuses. This command fetches issues from a GitHub project, updates their start dates if necessary, and logs the time spent in each status.

## Usage

```sh
pat issue-times [options] <query>
```

## Options

- `-c, --configFile <configFile>`: Path to the configuration file.
- `-gt, --ghToken <ghToken>`: GitHub token for authentication.
- `-go, --ghOrganizationName <ghOrganizationName>`: GitHub organization name.
- `-gp, --ghProjectNumber <ghProjectNumber>`: GitHub project number.

## Description

The `TimeInStatusCommand` performs the following steps:

1. Initializes the configuration using the provided config file or default config file (`./config.json`).
2. Extracts the GitHub organization name, project number, and query parameters from the command-line arguments or the configuration file.
3. Authenticates with GitHub using the provided GitHub token.
4. Fetches project details and issues from the specified GitHub project.
5. Updates the start date of issues if the start date is enabled and the issue status matches the configured status.
6. Calculates the time spent in each status for each issue.
7. Updates the issue comments with the calculated time in status and other relevant information.

## Example

```sh
pat issue-times -c ./config.json -gt <your_github_token> -go <your_org_name> -gp <your_project_number> "is:open"
```

## Configuration

The tool uses a configuration file to store settings. By default, it looks for `config.json` in the current directory. You can specify a different configuration file using the `-c` or `--configFile` option.

**Example Configuration (`config.json`):**

```json
{
  "ghToken": "your_github_token",
  "ghOrganizationName": "your_org_name",
  "ghProjectNumber": 1,
  "startDate": {
    "enabled": true,
    "status": "in progress"
  },
  "eta": {
    "enabled": true
  }
}
```

## Error Handling

If any errors occur during the execution of the command, they will be logged to the console.

## Dependencies

- `configstore`: Used for managing configuration.
- `github-repository`: Custom module for interacting with GitHub.
- `markdown-doc-builder`: Used for building markdown content.
- `typedi`: Dependency injection framework.

## License

This project is licensed under the MIT License.
```