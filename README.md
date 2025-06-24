# Standup Tool

A very simple tool to pick names for your team's standup.

## Prerequisites

- [Deno](https://deno.land/) (version 2.x )

>[!TIP]
Follow the [official Deno installation guide](https://deno.land/#installation).

## Running the Application Locally

1. Clone the repository:

   ```shell
   git clone https://github.com/your-username/team-tools.git
   cd standup-tool
   deno install
   ```

1. Start the application:

   ```shell
   deno task dev
   ```

1. Open <http://localhost:8000> in your web browser.

## Configuration

Team members' names can be added in the `config.json` file.

## Development

This project uses Deno for the backend and vanilla JavaScript for the frontend. The main server file is `main.ts`, and the static files are located in the `static/` directory.

To make changes, edit the relevant files and the server will automatically reload thanks to the `--watch` flag in the `deno task dev` command.

## Testing

The project includes a comprehensive test suite. To run the tests:

```shell
deno test --allow-read --allow-write --allow-net
```

Tests cover:

- API endpoints functionality
- Team member selection logic
- History management
- Static file serving
- Error handling

The test suite uses Deno's built-in testing framework and includes:

- Mocks for file system operations to ensure reliable test execution
- Proper cleanup of resources to prevent file leaks
- Individual Hono app instances for each test to avoid conflicts

For more detailed test output, you can use the `--log-level` flag:

```shell
deno test --allow-read --allow-write --allow-net
```

This will provide more detailed information about each test case execution and any debug logs.
