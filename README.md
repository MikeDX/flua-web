# Pixi.js with Lua Scripting

This project integrates Pixi.js v8 as a rendering backend with Lua as a scripting language. It allows you to write Lua code that controls graphics rendered by Pixi.js.

## Live Demo

Try out the live demo at [https://yourusername.github.io/pixidev](https://yourusername.github.io/pixidev)

## Features

- Real-time Lua script editing and execution
- Pixi.js v8 rendering engine
- Built-in functions for drawing shapes and manipulating sprites
- Frame-based animation system
- Example scripts demonstrating various features

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser and navigate to `http://localhost:9000`

### Building for Production

To build the project for production:

```bash
npm run build:prod
```

The built files will be in the `dist` directory.

## Usage

The application is split into two main areas:
- The left side shows the Pixi.js canvas where your graphics will be rendered
- The right side contains a Lua code editor where you can write and run scripts

### Lua API

The following functions are available in the Lua environment:

#### Drawing Functions

- `circle(x, y, radius, vertices, color, outline)`: Draw a circle
  - `color`: Table with {r, g, b, a} values (0-1) or hex value
  - `outline`: 0 for filled, 1 for outline
- `box(x, y, width, height, color, outline)`: Draw a rectangle
- `drawLine(x1, y1, x2, y2, color, thickness)`: Draw a line
- `setBackgroundColor(color)`: Set the background color
- `clear()`: Clear all graphics
- `update()`: Update the display (yields to next frame)

#### Utility Functions

- `gWidth()`: Get canvas width
- `gHeight()`: Get canvas height
- `getFPS()`: Get current FPS
- `printAt(x, y, text)`: Draw text at position
- `rnd(max)`: Get random number from 0 to max-1

#### Sprite Functions

- `loadImage(path)`: Load an image texture
- `createSprite()`: Create a new sprite
- `setSpriteImage(sprite, texture)`: Set sprite texture
- `setSpritePosition(sprite, x, y)`: Set sprite position
- `setSpriteColor(sprite, r, g, b, a)`: Set sprite color/tint
- `setSpriteSpeed(sprite, {x, y})`: Set sprite movement speed
- `updateSprites()`: Update all sprites
- `drawSprites()`: Draw all sprites

### Example Scripts

#### Particles Example
```lua
-- Initialize particle system
local particles = {}
local emitterX = gWidth() / 2
local emitterY = gHeight() / 2
local totalTime = 0
local dt = 0.016  -- Fixed time step

while true do
    clear()
    totalTime = totalTime + dt
    
    -- Update and spawn particles
    -- Move emitter in a circle
    emitterX = gWidth() / 2 + math.cos(totalTime * 2) * 100
    emitterY = gHeight() / 2 + math.sin(totalTime * 2) * 100
    
    -- Display stats
    printAt(10, 10, "FPS: " .. getFPS())
    update()
end
```

#### Bunny Example
```lua
bunny = loadImage("assets/wabbit_alpha.png")
while true do
    clear()
    t = touch()
    if t[0].z then
        -- Spawn bunnies on click
        createSprite()
        setSpriteImage(newbunny, bunny)
    end
    updateSprites()
    drawSprites()
    update()
end
```

## Technical Notes

- Uses frame-based timing for consistent animation
- Supports both filled and outlined shapes
- Color values can be specified as RGB tables or hex values
- Sprites support automatic screen edge collision

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- [Pixi.js](https://pixijs.com/) - 2D WebGL/WebGPU renderer
- [Fengari](https://fengari.io/) - Lua VM written in JavaScript 