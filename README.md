# APU Wild Escape

**A multi-role, browser-based event platform for a campus station game.**

APU Wild Escape was developed to support a team-based event at Asia Pacific University (APU). The platform connects participants, Game Masters, and administrators through an interactive number board, an overview of team progress, station-management controls, and a multi-level campus map.

This repository preserves the original event application and serves as a software engineering portfolio project.

**[Explore the participant page](https://xuanzs.github.io/htmls/guest.html?team=1)** · **[View source code](https://github.com/xuanzs/xuanzs.github.io)**

> **Demo note:** The linked participant page opens a specific team view from the original event. Some actions rely on the original Firebase data and event state and may not be available in a read-only portfolio demonstration.

## Overview

The application supports three main roles:

| Role | Main capabilities |
| --- | --- |
| **Participant** | Arrange numbers on a 5 × 5 board before submitting; view earned stations and blocked stations; open the campus station map. |
| **Game Master** | Record teams' successful station attempts; mark a station as vacant or occupied so its availability can be reflected on the map. |
| **Administrator** | Manage event operations and special game effects, including station shutdown, restoration, swapping, and pausing/unpausing. |

An additional **group overview page** presents the progress boards of multiple teams in one place.

## How the game works

1. **Set up a team board.** Participants arrange station numbers on a 5 × 5 board. Once submitted, their arrangement is locked for the event.
2. **Play station challenges.** Teams visit campus stations to participate in games.
3. **Record progress.** Game Masters record which teams successfully complete a station challenge. Completed stations appear in **green** on the participant board and group overview.
4. **Apply special game effects.** Administrators can apply relevant event actions. For example, a station may be blocked or shut down through game mechanics.
5. **Check station availability.** Participants can use the campus map to find stations and view their current availability.

### Understanding the colours

The colour meanings depend on the screen:

| Screen | Colour | Meaning |
| --- | --- | --- |
| Participant and group boards | **Green** | Station challenge successfully completed by the team |
| Participant and group boards | **Black** | Station blocked or locked by a special game effect |
| Station map | **Green** | Vacant station |
| Station map | **Red** | Occupied station |
| Station map | **Black** | Shut-down station |

## Main interfaces

### Participant board

- A 5 × 5 number board configured by the team before the game.
- A submitted board that can no longer be rearranged.
- Visual progress showing completed and blocked stations.
- A map button linking to the campus station map.

### Group overview

- Multiple teams' boards presented together.
- An event-wide snapshot of completed stations and blocked positions.
- Designed to make progress easy to compare during the event.

### Game Master dashboard

- Station-specific management interface.
- Records team and station results through selection controls.
- **Vacant / Occupied** controls to update the station's availability, reflected in the shared station map.

### Administrator dashboard

Provides event-management controls for special game situations, including:

- **Shutdown:** disable a selected station.
- **Restore:** reactivate or restore a station or game state.
- **Swap:** apply a swap action to selected game elements.
- **Pause / Unpause:** control a game pause state.

These controls were designed for Game Masters and organisers running the original event rather than public visitors.

### Interactive campus map

- A layered view of the APU campus with station location markers.
- Colour-coded station availability (vacant, occupied, or shut down).
- Helps teams decide which station to visit next.

## Technology stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend services / data:** Firebase and Cloud Firestore
- **Hosting:** GitHub Pages

The application was built as a web project for an event, without requiring a separate Java or Spring Boot backend.

## Repository layout

The repository includes web pages and supporting assets in directories such as:

```text
htmls/    Web interfaces (participant, group overview, admin, Game Master)
css/      Page styling
js/       Frontend behaviour and Firebase integration
img/      Visual assets
map/      Campus map resources
sound/    Game audio assets
public/   Additional public resources
```

Key page paths used during the event include `htmls/guest.html`, `htmls/View.html`, `htmls/admin.html`, and `htmls/gm.html`.

## Running locally

Open the repository in a local web server (for example, the VS Code Live Server extension), then visit:

```text
/htmls/guest.html?team=1
```

Some interfaces use the original Firebase project and may require data or access permissions that are not part of a read-only portfolio demo. Avoid submitting test data to the original event database.

## Screenshots

Recommended screenshots to include in this section when adding images to the repository:

1. **Participant board:** locked number arrangement with green completed and black blocked stations.
2. **Group overview:** several teams' progress boards side by side.
3. **Administrator dashboard:** station-management and special-action controls.
4. **Game Master dashboard:** station results and Vacant / Occupied actions.
5. **Campus station map:** floor layout with colour-coded station markers.

Store the images in a folder such as `docs/screenshots/`, then add Markdown image references here. Avoid showing real passwords, private Firebase records, or other secrets in screenshots.

## Portfolio and access note

This is an archived event project presented for demonstration and code review. The original application included role-specific event controls and Firebase-backed state. **A public URL does not mean that admin operations or database writes are intended for visitors.** Before advertising any interactive demo as safe for unrestricted public use, verify Firestore and Storage rules and restrict legacy credential-based access.

## Potential future improvements

- A standalone demo mode using sample team and station state without database writes.
- Firebase Authentication and role-based authorization if organiser logins are needed again.
- Automated tests for board validation and station-state changes.
- Responsive layouts and improved accessibility for smaller screens.
