# Project Manager

> A GitHub App built with [Probot](https://github.com/probot/probot)

This GitHub App creates and moves cards in a project around when a label is added to an issue.

The labels and their corrisponding columns can be configured in a .github/config.yml file:

```yaml
Project-Manager:
  org: Project-Manager-Test
  project: 1
  inbox: Inbox
  labels:
    To do: To do
    In progress: In progress
    Done: Done
```

The `org` is either the name of the organization or `null`. If `org` is `null` the app searches the current repo for the project.

The `project` is the project number in the url.

The `inbox` is the name of the column that the app will put any new issues that are created. If `inbox` is `null` cards are not created for new issues.

`labels` is the dictionary of label names and the corrisponding column. (`labelName`: `columnName`)

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how project-manager could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 ShadowCommander <10494922+ShadowCommander@users.noreply.github.com>
