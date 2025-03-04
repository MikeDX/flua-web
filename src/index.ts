import * as PIXI from 'pixi.js';
import * as fengari from 'fengari-web';
import { examples, loadExample } from './examples';

// Get the Lua globals and libraries
const { L, lua, lauxlib, lualib } = fengari;

// Initialize Pixi.js application
const app = new PIXI.Application();
let graphics: PIXI.Graphics;

// Store the current Lua state
let luaState: any = null;
let setupCalled = false;
let lastTime = performance.now();

// Initialize the application asynchronously
async function initializeApp() {
    await app.init({
        width: window.innerWidth * 0.6,
        height: window.innerHeight,
        backgroundColor: 0x1099bb,
        antialias: true,
        resizeTo: document.getElementById('canvas-container') as HTMLElement
    });

    // Add the Pixi.js canvas to the DOM
    document.getElementById('canvas-container')?.appendChild(app.canvas);

    // Graphics object for drawing
    graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    // Set up the game loop
    app.ticker.add(() => {
        if (!luaState) return;

        // Call setup function once
        if (!setupCalled) {
            lua.lua_getglobal(luaState, fengari.to_luastring('setup'));
            if (lua.lua_isfunction(luaState, -1)) {
                const pcallResult = lua.lua_pcall(luaState, 0, 0, 0);
                if (pcallResult !== 0) {
                    console.error('Error in setup function:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
                    lua.lua_pop(luaState, 1); // Pop error message
                }
            } else {
                lua.lua_pop(luaState, 1); // Pop non-function value
            }
            setupCalled = true;
        }

        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        // Clear previous drawings
        graphics.clear();

        // Call update function
        lua.lua_getglobal(luaState, fengari.to_luastring('update'));
        if (lua.lua_isfunction(luaState, -1)) {
            lua.lua_pushnumber(luaState, deltaTime);
            const pcallResult = lua.lua_pcall(luaState, 1, 0, 0);
            if (pcallResult !== 0) {
                console.error('Error in update function:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
                lua.lua_pop(luaState, 1); // Pop error message
            }
        } else {
            lua.lua_pop(luaState, 1); // Pop non-function value
        }

        // Call draw function
        lua.lua_getglobal(luaState, fengari.to_luastring('draw'));
        if (lua.lua_isfunction(luaState, -1)) {
            const pcallResult = lua.lua_pcall(luaState, 0, 0, 0);
            if (pcallResult !== 0) {
                console.error('Error in draw function:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
                lua.lua_pop(luaState, 1); // Pop error message
            }
        } else {
            lua.lua_pop(luaState, 1); // Pop non-function value
        }
    });

    // Run the initial Lua code when the app is initialized
    const editorElement = document.getElementById('lua-editor') as HTMLTextAreaElement;
    const luaCode = editorElement.value;
    runLuaCode(luaCode);
}

// Function to run Lua code
function runLuaCode(code: string) {
    // Clear previous state if it exists
    if (luaState) {
        lua.lua_close(luaState);
    }

    // Create a new Lua state
    luaState = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(luaState);

    // Register JavaScript functions to be called from Lua
    registerJsFunctions();

    // Load and execute the Lua code
    const loadResult = lauxlib.luaL_loadstring(luaState, fengari.to_luastring(code));
    if (loadResult !== 0) {
        console.error('Error loading Lua code:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
        lua.lua_pop(luaState, 1); // Pop error message
        return;
    }

    const pcallResult = lua.lua_pcall(luaState, 0, 0, 0);
    if (pcallResult !== 0) {
        console.error('Error executing Lua code:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
        lua.lua_pop(luaState, 1); // Pop error message
        return;
    }

    // Reset setup flag
    setupCalled = false;
    lastTime = performance.now();

    // Start the game loop if not already running
    if (!app.ticker.started) {
        app.ticker.start();
    }
}

// Register JavaScript functions to be called from Lua
function registerJsFunctions() {
    // Register drawCircle function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const x = lua.lua_tonumber(L, 1);
        const y = lua.lua_tonumber(L, 2);
        const radius = lua.lua_tonumber(L, 3);
        const color = lua.lua_tointeger(L, 4);
        
        graphics.beginFill(color);
        graphics.drawCircle(x, y, radius);
        graphics.endFill();
        
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('drawCircle'));

    // Register drawRect function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const x = lua.lua_tonumber(L, 1);
        const y = lua.lua_tonumber(L, 2);
        const width = lua.lua_tonumber(L, 3);
        const height = lua.lua_tonumber(L, 4);
        const color = lua.lua_tointeger(L, 5);
        
        graphics.beginFill(color);
        graphics.drawRect(x, y, width, height);
        graphics.endFill();
        
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('drawRect'));

    // Register drawLine function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const x1 = lua.lua_tonumber(L, 1);
        const y1 = lua.lua_tonumber(L, 2);
        const x2 = lua.lua_tonumber(L, 3);
        const y2 = lua.lua_tonumber(L, 4);
        const color = lua.lua_tointeger(L, 5);
        const thickness = lua.lua_tonumber(L, 6) || 1;
        
        graphics.lineStyle(thickness, color);
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('drawLine'));

    // Register setBackgroundColor function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const color = lua.lua_tointeger(L, 1);
        app.renderer.background.color = color;
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('setBackgroundColor'));
}

// Event listener for the run button
document.getElementById('run-button')?.addEventListener('click', () => {
    const editorElement = document.getElementById('lua-editor') as HTMLTextAreaElement;
    const luaCode = editorElement.value;
    runLuaCode(luaCode);
});

// Event listener for the examples dropdown
document.getElementById('examples-dropdown')?.addEventListener('change', (event) => {
    const dropdown = event.target as HTMLSelectElement;
    const selectedExample = dropdown.value;
    
    if (selectedExample) {
        const editorElement = document.getElementById('lua-editor') as HTMLTextAreaElement;
        loadExample(selectedExample, editorElement);
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (app.renderer) {
        app.renderer.resize(
            document.getElementById('canvas-container')?.clientWidth || window.innerWidth * 0.6,
            document.getElementById('canvas-container')?.clientHeight || window.innerHeight
        );
    }
});

// Initialize the app when the page loads
window.addEventListener('load', () => {
    initializeApp().catch(console.error);
}); 