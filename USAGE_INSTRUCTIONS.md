# People Management App - Usage Instructions

## How to Use the Application Locally

### Option 1: Direct Launcher (Recommended)

1. Simply double-click the `launch-app.html` file in the root directory
2. This will open the application in your default browser
3. The application will load from the local `dist` folder

### Option 2: Create a Desktop Shortcut

#### On Windows:

1. Right-click on the `launch-app.html` file
2. Select "Create shortcut"
3. Move the shortcut to your desktop or preferred location
4. Double-click the shortcut to open the application

#### On macOS:

1. Open Automator
2. Create a new "Application"
3. Add a "Run Shell Script" action
4. Enter: `open /path/to/your/launch-app.html`
   (Replace with the actual path to your file)
5. Save the application to your Applications folder or desktop
6. Double-click to run

#### On Linux:

1. Create a .desktop file with the following content:
   ```
   [Desktop Entry]
   Type=Application
   Name=People Management App
   Exec=xdg-open /path/to/your/launch-app.html
   Icon=/path/to/icon.png
   Terminal=false
   ```
2. Replace the paths with your actual paths
3. Save it to your desktop or ~/.local/share/applications/
4. Make it executable: `chmod +x filename.desktop`

## Important Notes

1. The application data is stored in your browser's local storage
2. Always use the same browser to access your data
3. If you need to move the application, make sure to keep the `dist` folder and `launch-app.html` file together

## Troubleshooting

If the application doesn't load:
1. Make sure the `dist` folder is in the same directory as `launch-app.html`
2. Try opening the application in a different browser
3. If you're using Chrome and seeing security errors, try Firefox or Edge instead

## Rebuilding the Application

If you need to make changes to the source code:

1. Make your changes
2. Run `npm run build` to rebuild the application
3. The `dist` folder will be updated with your changes 