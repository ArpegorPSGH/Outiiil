# System Patterns: Outiiil

## System architecture
The extension follows a **Content Script** model for Chrome extensions. The main script (`js/content.js`) is injected into pages on the `fourmizzz.fr` domain.

## Key technical decisions
- **Global Initialization (`content.js`)**:
    *   Checks if the user is logged in.
    *   Loads game constants and configures libraries (moment, numeral, datatables).
    *   Instantiates the `monProfil` object (class `Joueur`) representing the current user.
    *   Retrieves extension parameters and basic player data (profile, constructions, research) via `localStorage` or initial AJAX calls.
    *   Instantiates and displays global UI components (e.g., `Dock`, `BoiteComptePlus`, `BoiteRadar`).
    *   Launches persistent functionalities (e.g., Tracker if activated).

- **Page Routing (`content.js`)**:
    *   Detects the current page URL (`location.pathname`, `location.search`).
    *   Instantiates the corresponding `Page*` class (e.g., `PageArmee`, `PageForum`), sometimes passing references to global boxes (e.g., `BoiteComptePlus`).
    *   Calls the `executer()` method of the page module.

- **Page-Specific Logic (`js/page/*.js`)**:
    *   The `executer()` method of the page module contains the specific logic:
        *   **DOM Parsing**: Extracts relevant information from the HTML page.
        *   **Calculations/Business Logic**: Performs necessary calculations (e.g., HOF time, army stats, hunting simulation).
        *   **UI Injection**: Adds buttons, tables, or visual modifications specific to this page.
        *   **Event Handling**: Attaches event listeners to added elements.
        *   **Global Data Update**: Can update `monProfil` or data in `localStorage` (e.g., `PageArmee` which could save units).

- **UI Components (`js/boite/*.js`)**:
    *   Each class manages the display (`afficher()`) and internal logic of a specific UI component (e.g., the info box, the toolbar, rank management popups).
    *   These components can read data from `monProfil` or `Utils` and interact with other parts of the extension (e.g., `Dock` which opens other boxes).

- **Data Classes (`js/class/*.js`)**:
    *   Model game entities (`Joueur`, `Alliance`, `Armee`, `Commande`).
    *   Encapsulate data and associated methods (calculations, parsing, formatting).
    *   `Utils.js` provides static accessors for global data extracted from the DOM (`Utils.nourriture`, `Utils.terrain`, etc.) and utility functions (time, formatting).
    *   `Parametre.js` manages the structure of extension parameters.

## Design patterns in use
- **Dependency Injection (Simple)**: Page modules sometimes receive instances of global boxes via their constructor.
- **Module Pattern (via ES6 Classes)**: Code is organized into classes, encapsulating state and behavior.
- **Observer Pattern (MutationObserver)**: Used in `PageForum` and `PageAlliance` to detect asynchronous content loading and trigger processing.

## Component relationships
- `content.js` is the central orchestrator, routing to specific `js/page/*` modules.
- `js/page/*` modules interact with the DOM, use `js/class/*` for data modeling and utilities, and can interact with `js/boite/*` UI components.
- `js/boite/*` components use `js/class/*` for data and utilities.
- `js/class/*` provides data structures and utility functions used across the extension.

## Critical implementation paths
- **Data Access**: Via the `monProfil` instance and the static `Utils` class.
- **Persistence**: Via `localStorage` for parameters, player profile, and evolution state.
- **Asynchronous Requests**: Use of `$.ajax` (jQuery Promises) and `async/await` for network calls. This is notably used for fetching forum data, including consulting individual topics to get the creation date of commands.
- **Recensement Functionality Flow**:
    1.  Click on button (`PageAlliance.js`).
    2.  AJAX call to `/Armee.php`.
    3.  Parsing of HTML response via `Armee.parseHtml()`.
    4.  Retrieval of other data via `Utils` and `monProfil`.
    5.  Message formatting.
    6.  Check `monProfil.sujetForum`.
    7.  If ID absent:
        a. Retrieve `idSection` from `monProfil.parametre`.
        b. Call `forumManager.consulterSection(idSection)`.
        c. Parse response to find `idSujet`.
    8.  Call `forumManager.envoyerMessage(idSujet, message)`.
    9.  Display notification (`$.toast`).
- **Command Loading Flow**:
    1.  Navigate to Commerce page (`PageCommerce.js`).
    2.  Call `forumManager.consulterSection` to get the list of topics in the command section.
    3.  Filter topics based on their state ('Nouvelle', 'En cours', 'En attente').
    4.  For each filtered topic, call `forumManager.consulterSujet` to get the topic content.
    5.  Use `Promise.all` to wait for all topic content to be fetched.
    6.  Parse the first message of each topic content to extract the creation date using `Utils.parseForumDate`.
    7.  Create `Commande` objects with the extracted data, including the creation date.
    8.  Store `Commande` objects in `forumManager._commande`.
    9.  Call `PageCommerce.afficherCommande` to display the table using the loaded command data.
