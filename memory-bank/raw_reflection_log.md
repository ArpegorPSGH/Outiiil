---
Date: 2025-08-20
TaskRef: "Fix ReferenceError: idSujet is not defined"

Learnings:
- Refactored a constructor (`Objet`) to use an options object for better readability and flexibility, especially when dealing with multiple optional parameters. This is a superior approach to passing `null` for skipped default parameters.
- Updated internal calls to the refactored constructor (`Objet.js` and `FonctionnaliteAlliance.js`) to align with the new options object pattern.
- Confirmed the correct positional arguments for the original `Objet` constructor and how to target specific arguments using the new options object.

Difficulties:
- Initially proposed a less optimal solution (passing `null` for default parameters) which was corrected by user feedback, leading to a more robust and cleaner design using an options object.

Successes:
- Successfully refactored the `Objet` constructor to accept an options object.
- Successfully updated all relevant constructor calls in `Objet.js` and `FonctionnaliteAlliance.js`.
- The implemented solution is cleaner, more maintainable, and adheres to better software engineering practices.
---
