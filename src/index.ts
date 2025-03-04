import * as PIXI from 'pixi.js';
import * as fengari from 'fengari-web';
import { examples, loadExample } from './examples';
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { luaLanguage } from './lua-lang';
import { defaultKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";

// Get the Lua globals and libraries
const { L, lua, lauxlib, lualib } = fengari;

// Custom interface for our sprite type
interface CustomSprite extends PIXI.Sprite {
    id: number;
    speed: { x: number; y: number };
    x: number;
    y: number;
    anchor: PIXI.ObservablePoint;
}

// Initialize Pixi.js application
const app = new PIXI.Application();
let graphics: PIXI.Graphics;

// Store the current Lua state
let luaState: any = null;
let luaThread: any = null;
let isRunning = false;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsUpdateTime = 0;

// Store loaded textures
const loadedTextures = new Map<string, PIXI.Texture>();

// CodeMirror editor instance
let editor: EditorView;

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

    // Text container for FPS and debug info
    const textContainer = new PIXI.Container();
    app.stage.addChild(textContainer);

    // Initialize CodeMirror
    const startState = EditorState.create({
        doc: '-- Write your Lua code here\n\n',
        extensions: [
            luaLanguage,
            oneDark,
            syntaxHighlighting(defaultHighlightStyle),
            keymap.of(defaultKeymap),
            EditorView.theme({
                "&": {
                    height: "100%",
                    fontSize: "14px"
                },
                ".cm-scroller": {
                    overflow: "auto",
                    fontFamily: "'Fira Code', monospace"
                },
                ".cm-content": {
                    caretColor: "#fff"
                },
                "&.cm-focused .cm-cursor": {
                    borderLeftColor: "#fff"
                },
                ".cm-gutters": {
                    backgroundColor: "#282c34",
                    color: "#676f7d",
                    border: "none"
                },
                ".cm-activeLineGutter": {
                    backgroundColor: "#2c313c"
                }
            })
        ]
    });

    editor = new EditorView({
        state: startState,
        parent: document.getElementById('lua-editor')!
    });

    // Preload the bunny texture
    try {
        const bunnyPath = 'assets/wabbit_alpha.png';
        const texture = await PIXI.Assets.load(bunnyPath);
        loadedTextures.set('/' + bunnyPath, texture);
        console.log('Bunny texture loaded successfully');
    } catch (error) {
        console.error('Failed to load bunny texture:', error);
    }

    // Run the initial Lua code when the app is initialized
    const luaCode = editor.state.doc.toString();
    runLuaCode(luaCode);
}

// Function to run Lua code
function runLuaCode(code: string) {
    // Stop any existing execution
    isRunning = false;
    
    // Clear previous state if it exists
    if (luaState) {
        lua.lua_close(luaState);
    }

    // Create a new Lua state
    luaState = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(luaState);

    // Register JavaScript functions to be called from Lua
    registerJsFunctions();

    // Clear previous drawings
    graphics.clear();

    // Reset FPS counter
    frameCount = 0;
    fps = 0;
    fpsUpdateTime = performance.now();
    lastFrameTime = performance.now();

    // Wrap the code in a function to create a coroutine
    const wrappedCode = `
        function __main__()
            ${code}
        end
        return __main__
    `;

    // Load the wrapped code
    const loadResult = lauxlib.luaL_loadstring(luaState, fengari.to_luastring(wrappedCode));
    if (loadResult !== 0) {
        console.error('Error loading Lua code:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
        lua.lua_pop(luaState, 1); // Pop error message
        return;
    }

    // Execute the wrapped code to get the main function
    const pcallResult = lua.lua_pcall(luaState, 0, 1, 0);
    if (pcallResult !== 0) {
        console.error('Error executing Lua code:', fengari.to_jsstring(lua.lua_tostring(luaState, -1)));
        lua.lua_pop(luaState, 1); // Pop error message
        return;
    }

    // Create a new thread (coroutine) with the main function
    luaThread = lua.lua_newthread(luaState);
    lua.lua_pushvalue(luaState, -2); // Copy the main function to the top
    lua.lua_xmove(luaState, luaThread, 1); // Move the main function to the thread
    lua.lua_pop(luaState, 1); // Pop the original main function

    // Start the execution
    isRunning = true;
    resumeLuaExecution();

    // Render a single frame
    app.render();
}

// Function to resume Lua execution
function resumeLuaExecution() {
    if (!isRunning || !luaThread) return;

    // Update FPS
    const now = performance.now();
    frameCount++;
    
    if (now - fpsUpdateTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - fpsUpdateTime));
        frameCount = 0;
        fpsUpdateTime = now;
    }
    
    // Calculate delta time
    const deltaTime = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    // Resume the coroutine
    const resumeResult = lua.lua_resume(luaThread, null, 0);
    
    if (resumeResult === 0) {
        // Coroutine finished
        console.log('Lua execution completed');
        isRunning = false;
    } else if (resumeResult === 1) { // LUA_YIELD
        // Coroutine yielded, will be resumed later
        setTimeout(resumeLuaExecution, 16); // ~60fps
    } else {
        // Error occurred
        console.error('Error in Lua execution:', fengari.to_jsstring(lua.lua_tostring(luaThread, -1)));
        lua.lua_pop(luaThread, 1); // Pop error message
        isRunning = false;
    }

    // Render a frame
    app.render();
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

    // Register clear function to clear the graphics
    lua.lua_pushcfunction(luaState, (L: any) => {
        graphics.clear();
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('clear'));

    // Register update function that yields to allow animation
    lua.lua_pushcfunction(luaState, (L: any) => {
        return lua.lua_yield(L, 0);
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('update'));

    // Register stop function to stop execution
    lua.lua_pushcfunction(luaState, (L: any) => {
        isRunning = false;
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('stop'));

    // Register box function (for box.lua example)
    lua.lua_pushcfunction(luaState, (L: any) => {
        const x = lua.lua_tonumber(L, 1);
        const y = lua.lua_tonumber(L, 2);
        const width = lua.lua_tonumber(L, 3);
        const height = lua.lua_tonumber(L, 4);
        
        // Handle color table or single color
        let color = 0xFFFFFF;
        if (lua.lua_istable(L, 5)) {
            // Get r, g, b, a from table
            lua.lua_rawgeti(L, 5, 1); // r
            lua.lua_rawgeti(L, 5, 2); // g
            lua.lua_rawgeti(L, 5, 3); // b
            lua.lua_rawgeti(L, 5, 4); // a (optional)
            
            const r = Math.floor(lua.lua_tonumber(L, -4) * 255);
            const g = Math.floor(lua.lua_tonumber(L, -3) * 255);
            const b = Math.floor(lua.lua_tonumber(L, -2) * 255);
            const a = lua.lua_isnumber(L, -1) ? lua.lua_tonumber(L, -1) : 1;
            
            color = (r << 16) | (g << 8) | b;
            graphics.alpha = a;
            
            lua.lua_pop(L, 4); // Pop r, g, b, a
        } else if (lua.lua_isnumber(L, 5)) {
            color = lua.lua_tointeger(L, 5);
        }
        
        // Check if outline or filled
        const outline = lua.lua_isnumber(L, 6) ? lua.lua_tointeger(L, 6) : 0;
        
        if (outline) {
            graphics.lineStyle(1, color);
            graphics.beginFill(0, 0); // Transparent fill
            graphics.drawRect(x, y, width, height);
            graphics.endFill();
        } else {
            graphics.beginFill(color);
            graphics.drawRect(x, y, width, height);
            graphics.endFill();
        }
        
        graphics.alpha = 1; // Reset alpha
        
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('box'));

    // Register circle function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const x = lua.lua_tonumber(L, 1);
        const y = lua.lua_tonumber(L, 2);
        const radius = lua.lua_tonumber(L, 3);
        const vertices = lua.lua_tonumber(L, 4);
        
        // Handle color table or single color
        let color = 0xFFFFFF;
        if (lua.lua_istable(L, 5)) {
            // Get r, g, b, a from table
            lua.lua_rawgeti(L, 5, 1); // r
            lua.lua_rawgeti(L, 5, 2); // g
            lua.lua_rawgeti(L, 5, 3); // b
            lua.lua_rawgeti(L, 5, 4); // a (optional)
            
            const r = Math.floor(lua.lua_tonumber(L, -4) * 255);
            const g = Math.floor(lua.lua_tonumber(L, -3) * 255);
            const b = Math.floor(lua.lua_tonumber(L, -2) * 255);
            const a = lua.lua_isnumber(L, -1) ? lua.lua_tonumber(L, -1) : 1;
            
            color = (r << 16) | (g << 8) | b;
            graphics.alpha = a;
            
            lua.lua_pop(L, 4); // Pop r, g, b, a
        } else if (lua.lua_isnumber(L, 5)) {
            color = lua.lua_tointeger(L, 5);
        }
        
        // Check if outline or filled
        const outline = lua.lua_isnumber(L, 6) ? lua.lua_tointeger(L, 6) : 0;
        
        if (outline) {
            graphics.lineStyle(1, color);
            graphics.beginFill(0, 0); // Transparent fill
            graphics.drawCircle(x, y, radius);
            graphics.endFill();
        } else {
            graphics.beginFill(color);
            graphics.drawCircle(x, y, radius);
            graphics.endFill();
        }
        
        graphics.alpha = 1; // Reset alpha
        
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('circle'));

    // Register random function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const max = lua.lua_isnumber(L, 1) ? lua.lua_tonumber(L, 1) : 1;
        const result = Math.floor(Math.random() * max);
        lua.lua_pushnumber(L, result);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('random'));

    // Register gWidth function
    lua.lua_pushcfunction(luaState, (L: any) => {
        lua.lua_pushnumber(L, app.screen.width);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('gWidth'));

    // Register gHeight function
    lua.lua_pushcfunction(luaState, (L: any) => {
        lua.lua_pushnumber(L, app.screen.height);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('gHeight'));

    // Register getFPS function
    lua.lua_pushcfunction(luaState, (L: any) => {
        lua.lua_pushnumber(L, fps);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('getFPS'));

    // Register printAt function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const x = lua.lua_tonumber(L, 1);
        const y = lua.lua_tonumber(L, 2);
        const text = fengari.to_jsstring(lua.lua_tostring(L, 3));
        
        // Create a text sprite if it doesn't exist
        if (!app.stage.children.find(child => child.name === 'debug-text')) {
            const textStyle = new PIXI.TextStyle({
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFFFFFF,
            });
            
            const textSprite = new PIXI.Text('', textStyle);
            textSprite.name = 'debug-text';
            app.stage.addChild(textSprite);
        }
        
        // Update the text
        const textSprite = app.stage.children.find(child => child.name === 'debug-text') as PIXI.Text;
        textSprite.text = text;
        textSprite.position.set(x, y);
        
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('printAt'));

    // Register sprite-related functions
    const sprites = new Map<number, CustomSprite>();
    let nextSpriteId = 0;

    // loadImage function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const path = fengari.to_jsstring(lua.lua_tostring(L, 1));
        try {
            // Handle both absolute and relative paths
            const normalizedPath = path.startsWith('/') ? path : '/' + path;
            const texture = loadedTextures.get(normalizedPath);
            if (!texture) {
                throw new Error(`Texture not found: ${normalizedPath}`);
            }
            lua.lua_pushlightuserdata(L, texture);
            return 1;
        } catch (error) {
            console.error('Error in loadImage:', error);
            return 0;
        }
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('loadImage'));

    // createSprite function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const sprite = new PIXI.Sprite() as CustomSprite;
        sprite.anchor.set(0.5);
        sprite.id = nextSpriteId++;
        sprite.speed = { x: 0, y: 0 };
        sprites.set(sprite.id, sprite);
        app.stage.addChild(sprite);
        
        lua.lua_pushlightuserdata(L, sprite);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('createSprite'));

    // setSpriteImage function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const sprite = lua.lua_touserdata(L, 1);
        const texture = lua.lua_touserdata(L, 2);
        sprite.texture = texture;
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('setSpriteImage'));

    // setSpritePosition function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const sprite = lua.lua_touserdata(L, 1);
        const x = lua.lua_tonumber(L, 2);
        const y = lua.lua_tonumber(L, 3);
        sprite.x = x;
        sprite.y = y;
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('setSpritePosition'));

    // setSpriteColor function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const sprite = lua.lua_touserdata(L, 1);
        const r = lua.lua_tonumber(L, 2);
        const g = lua.lua_tonumber(L, 3);
        const b = lua.lua_tonumber(L, 4);
        const a = lua.lua_tonumber(L, 5) || 1;
        sprite.tint = (Math.floor(r * 255) << 16) | (Math.floor(g * 255) << 8) | Math.floor(b * 255);
        sprite.alpha = a;
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('setSpriteColor'));

    // setSpriteSpeed function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const sprite = lua.lua_touserdata(L, 1);
        lua.lua_rawgeti(L, 2, 1); // x speed
        lua.lua_rawgeti(L, 2, 2); // y speed
        sprite.speed.x = lua.lua_tonumber(L, -2);
        sprite.speed.y = lua.lua_tonumber(L, -1);
        lua.lua_pop(L, 2);
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('setSpriteSpeed'));

    // updateSprites function
    lua.lua_pushcfunction(luaState, (L: any) => {
        sprites.forEach(sprite => {
            sprite.x += sprite.speed.x * 0.016; // Assuming 60fps
            sprite.y += sprite.speed.y * 0.016;

            // Bounce off screen edges
            if (sprite.x < 0 || sprite.x > app.screen.width) {
                sprite.speed.x *= -1;
            }
            if (sprite.y < 0 || sprite.y > app.screen.height) {
                sprite.speed.y *= -1;
            }
        });
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('updateSprites'));

    // drawSprites function (no-op since Pixi handles rendering)
    lua.lua_pushcfunction(luaState, (L: any) => {
        return 0;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('drawSprites'));

    // touch simulation function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const touchState = {
            x: app.renderer.events.pointer.x,
            y: app.renderer.events.pointer.y,
            z: app.renderer.events.pointer.buttons !== 0
        };
        
        lua.lua_createtable(L, 1, 0);
        lua.lua_createtable(L, 0, 3);
        
        lua.lua_pushnumber(L, touchState.x);
        lua.lua_setfield(L, -2, fengari.to_luastring('x'));
        
        lua.lua_pushnumber(L, touchState.y);
        lua.lua_setfield(L, -2, fengari.to_luastring('y'));
        
        lua.lua_pushboolean(L, touchState.z);
        lua.lua_setfield(L, -2, fengari.to_luastring('z'));
        
        lua.lua_rawseti(L, -2, 0);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('touch'));

    // rnd function (alias for random)
    lua.lua_pushcfunction(luaState, (L: any) => {
        const max = lua.lua_isnumber(L, 1) ? lua.lua_tonumber(L, 1) : 1;
        const result = Math.floor(Math.random() * max);
        lua.lua_pushnumber(L, result);
        return 1;
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('rnd'));

    // Register sleep function
    lua.lua_pushcfunction(luaState, (L: any) => {
        const seconds = lua.lua_tonumber(L, 1);
        
        // We can't actually sleep in JavaScript, so we'll yield and resume after the specified time
        setTimeout(() => {
            if (isRunning && luaThread) {
                resumeLuaExecution();
            }
        }, seconds * 1000);
        
        return lua.lua_yield(L, 0);
    });
    lua.lua_setglobal(luaState, fengari.to_luastring('sleep'));
}

// Event listener for the run button
document.getElementById('run-button')?.addEventListener('click', () => {
    const luaCode = editor.state.doc.toString();
    runLuaCode(luaCode);
});

// Event listener for the stop button
document.getElementById('stop-button')?.addEventListener('click', () => {
    isRunning = false;
});

// Event listener for the examples dropdown
document.getElementById('examples-dropdown')?.addEventListener('change', (event) => {
    const dropdown = event.target as HTMLSelectElement;
    const selectedExample = dropdown.value;
    
    if (selectedExample) {
        const example = examples[selectedExample as keyof typeof examples];
        editor.dispatch({
            changes: {
                from: 0,
                to: editor.state.doc.length,
                insert: example
            }
        });
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