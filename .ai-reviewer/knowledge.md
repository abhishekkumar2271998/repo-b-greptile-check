# StenoAI reviewer notes

## Architecture
The StenoAI project is designed as a macOS application that utilizes Electron for the front-end and Python for the backend processing of audio recording, transcribing, and summarizing meetings. The directory structure is organized into an `app` folder containing the Electron application code, a `src` folder for the Python backend, and a `simple_recorder.py` file serving as the command-line interface for quick access to core functionalities. 

## Conventions
- **File Organization**: All application files related to the Electron front-end are located in the `app` directory while the Python scripts are in the `src` directory. The `requirements.txt` file specifies Python dependencies.
- **JavaScript Style**: The team follows a strict JavaScript convention of using `const` and `let` instead of `var`, as indicated in `CONTRIBUTING.md`. Additionally, semicolons are mandatory at the end of each statement.
- **React Patterns**: The React-based front-end uses functional components with hooks, utilizing `React.useEffect` for side effects and `React.useLayoutEffect` for immediate rendering effects, as showcased in `renderer/src/App.tsx`.
- **Linting and Formatting**: Python code is linted with `ruff`, and JavaScript files in the React renderer utilize `eslint` with a configuration that includes rules for React hooks (`eslint-plugin-react-hooks`). Formatting is managed with `prettier`.
- **Versioning**: Manual semantic versioning is applied for releases, with maintainers responsible for bumps and contributors focusing on code quality.

## Intentional non-standard choices
- **Direct Access to `.env`**: The main process loads environment variables directly from a `.env` file next to the script, rather than using a dedicated library. This simplifies configuration but may lead to security risks if sensitive data is not handled appropriately.
- **Custom Build Scripts**: The build process includes specific npm scripts for macOS architecture using `electron-builder`, which may not follow conventional build scripts seen in standard JavaScript applications. For example, the `build:arm64` and `build:intel` scripts differentiate between Apple Silicon and Intel builds, as seen in `app/package.json`. 

## Watch out for
- **Lack of Unit Tests**: The codebase shows limited presence of unit tests. The repository encourages running end-to-end tests but lacks a robust unit testing framework, which can lead to undetected bugs in individual components or functions.
- **Error Handling**: Ensure robust error-handling mechanisms are in place, especially in asynchronous operations in the Electron main process (`app/main.js`). Promises should manage rejections properly to prevent application crashes.
- **Security Considerations**: Be cautious with the usage of `eval` and other potentially unsafe JavaScript constructs that could lead to security vulnerabilities in the Electron application. Ensure that user-generated input is sanitized.
- **Hardcoded Values**: Be mindful of any hardcoded values, particularly in paths and configuration that could affect cross-platform compatibility, especially since the app is currently limited to macOS.