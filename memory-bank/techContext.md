# Tech Context: Outiiil

## Technologies Used
- **Type:** Browser Extension (Chrome, currently Manifest V2)
- **Primary Language:** JavaScript (ES6+)
- **Frontend Libraries:**
    - jQuery
    - Moment.js
    - Numeral.js
    - DataTables
    - Highcharts
    - jQuery UI
    - jQuery Toast
- **Styling:** CSS

## Development Setup
- Standard web development environment.
- Requires a browser compatible with Chrome extensions (for testing and usage).

## Technical Constraints
- **Dependency on Fourmizzz DOM Structure:** The extension relies heavily on the specific HTML structure of the Fourmizzz website. Changes to the game's frontend can break the extension's functionality.
- **Manifest V2:** The extension currently uses Manifest V2, which will require migration to Manifest V3 in the future due to Chrome's deprecation plan.

## Dependencies
- External JavaScript libraries listed under "Technologies Used".
- The Fourmizzz game website itself as the environment for the content script.
