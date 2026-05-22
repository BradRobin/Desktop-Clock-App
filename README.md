# Desktop Clock App / Widget

A lightweight, visually appealing desktop clock widget built with Electron.js that runs locally on Windows.

## Features

- **Customizable Appearance**: Change time format (12/24h), layout, font size, font family, colors, and transparency.
- **Glassmorphism Design**: Automatically applies sleek transparency and blurring (where supported).
- **Frameless & Draggable**: Move the widget freely around your screen or lock it in place.
- **Always on Top**: Ensure you never lose track of time while working.
- **Run at Startup**: Option to automatically launch with Windows.
- **Interactive Settings Panel**: Instant live preview as you customize settings.

## How to Run Locally

1. Install [Node.js](https://nodejs.org/).
2. Clone this repository to your local machine.
3. Open a terminal in the project directory.
4. Run `npm install` to install dependencies.
5. Run `npm start` to launch the app.

## How to Customize

- Once the widget is running, either **double-click** the system tray icon (located in the bottom-right of your Windows taskbar) or **right-click** it and select "Settings" to bring up the customization panel.
- Any modifications made in the settings panel are instantly applied and automatically saved.

## Build Instructions

If you want to package the app into a standalone, portable Windows `.exe`:
1. Open a terminal in the project directory.
2. Run `npm install` (if you haven't already).
3. Run `npm run build`.
4. The executable will be found in the `dist` folder.

## Known Limitations

- Locking the position allows clicks to pass through only if you don't click explicitly on the text sometimes; on Windows, Electron's `setIgnoreMouseEvents` works reasonably well but may interfere with other overlay apps.
- Native Windows Acrylic/Mica effects are not natively supported out of the box universally in Electron due to OS-level DWM restrictions, but the CSS `backdrop-filter` provides a comparable glass-like blur over the background.
