# Dashboards Job Scheduler

Dashboards Job Scheduler is an OpenSearch Dashboards plugin that adds administrative pages for viewing and managing jobs scheduled through the OpenSearch Job Scheduler plugin.

The plugin adds a Dashboards management application that can inspect registered jobs, schedule metadata, enabled state, lock state, and execution history through server-side routes that proxy the OpenSearch Job Scheduler APIs. It is intended to provide a UI companion to the Job Scheduler REST APIs and is related to [opensearch-project/job-scheduler#776](https://github.com/opensearch-project/job-scheduler/issues/776).

## Project Status

This repository is in active development. It is not currently included in the default OpenSearch Dashboards distribution and should be treated as a standalone plugin while the project is being prepared for upstream development.

Current expectations:

- The API and UI can change while the plugin is under development.
- The plugin may need to be installed or built separately from the default OpenSearch Dashboards artifact.
- Repository checks and release automation are still being established.
- Version increments are currently manual; future automation should align plugin versions with compatible OpenSearch Dashboards releases.

## Features

- Lists registered jobs from the OpenSearch Job Scheduler APIs.
- Shows job type, schedule metadata, enabled state, lock state, and execution timing.
- Filters and searches jobs in the Dashboards UI.
- Links report scheduler jobs to their report definition details when available.
- Shows job execution history.

## Compatibility

| Dashboards Job Scheduler | OpenSearch Dashboards |
| ------------------------ | --------------------- |
| 3.7.0                    | 3.7.0                 |

The plugin version should match the OpenSearch Dashboards version it is built against.

## Development Setup

This plugin is intended to be developed inside an OpenSearch Dashboards plugin workspace.

1. Clone OpenSearch Dashboards.
2. Clone this repository into the OpenSearch Dashboards `plugins` directory.
3. Bootstrap dependencies from the plugin directory.

```bash
cd OpenSearch-Dashboards/plugins/dashboards-job-scheduler
yarn osd bootstrap
```

## Build

Create a distributable plugin artifact with:

```bash
yarn build
```

The generated artifact is written to the plugin build output directory.

## Useful Scripts

| Command | Description |
| ------- | ----------- |
| `yarn osd bootstrap` | Installs dependencies for OpenSearch Dashboards and the plugin workspace. |
| `yarn lint` | Runs JavaScript/TypeScript and style lint checks. |
| `yarn lint:es` | Runs the OpenSearch Dashboards ESLint task. |
| `yarn lint:style` | Runs the OpenSearch Dashboards stylelint task. |
| `yarn build` | Builds a distributable plugin artifact. |

## Repository Automation

The repository does not yet have the full set of upstream project automation. Planned follow-up work includes:

- Pull request checks for linting, tests, and build validation.
- Version increment automation for OpenSearch Dashboards release alignment.
- Release packaging and publication workflows.
- Additional branch protection and ownership rules as maintainership expands.

## Contributing

Contributions are welcome while the plugin is under development. Before opening a pull request, run the relevant local checks and make sure changes follow OpenSearch Dashboards plugin conventions.

For general project guidance, see the OpenSearch Dashboards contributing guide:

https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md

## Maintainers

See [MAINTAINERS.md](MAINTAINERS.md) for the current maintainer list.
