# Pixi.js with Lua Scripting

This project integrates Pixi.js v8 as a rendering backend with Lua as a scripting language. It allows you to write Lua code that controls graphics rendered by Pixi.js.

## Features

- Real-time Lua script editing and execution
- Pixi.js v8 rendering engine
- Built-in functions for drawing shapes and manipulating the canvas
- Game loop with setup, update, and draw functions

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

## Usage

The application is split into two main areas:
- The left side shows the Pixi.js canvas where your graphics will be rendered
- The right side contains a Lua code editor where you can write and run scripts

### Lua API

The following functions are available in the Lua environment:

#### Lifecycle Functions

- `setup()`: Called once when the script starts
- `update(dt)`: Called every frame with delta time in seconds
- `draw()`: Called every frame after update

#### Drawing Functions

- `drawCircle(x, y, radius, color)`: Draw a circle
- `drawRect(x, y, width, height, color)`: Draw a rectangle
- `drawLine(x1, y1, x2, y2, color, thickness)`: Draw a line
- `setBackgroundColor(color)`: Set the background color

### Example

```lua
function setup()
    -- Initialize variables
    circle = {x = 400, y = 300, radius = 50, color = 0xFF0000}
end

function update(dt)
    -- Update logic
    circle.x = circle.x + math.sin(os.clock()) * 2
    circle.y = circle.y + math.cos(os.clock()) * 2
end

function draw()
    -- Draw to the screen
    drawCircle(circle.x, circle.y, circle.radius, circle.color)
end
```

## Technical Notes

- This project uses Pixi.js v8, which requires asynchronous initialization
- Fengari is used as the Lua VM implementation for JavaScript
- TypeScript is used for type safety and better development experience

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- [Pixi.js](https://pixijs.com/) - 2D WebGL/WebGPU renderer
- [Fengari](https://fengari.io/) - Lua VM written in JavaScript 