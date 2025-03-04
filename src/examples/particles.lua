-- Particle System Example

-- Particle class
Particle = {}
Particle.__index = Particle

function Particle.new(x, y)
    local self = setmetatable({}, Particle)
    self.x = x
    self.y = y
    self.vx = math.random() * 4 - 2
    self.vy = math.random() * 4 - 2
    self.radius = math.random() * 5 + 2
    self.life = math.random() * 2 + 1
    self.maxLife = self.life
    self.color = 0xFFFFFF
    return self
end

function Particle:update(dt)
    self.x = self.x + self.vx
    self.y = self.y + self.vy
    self.vy = self.vy + 0.1 -- gravity
    self.life = self.life - dt
    
    -- Fade out as life decreases
    local alpha = self.life / self.maxLife
    local r = math.floor(255 * alpha)
    local g = math.floor(100 * alpha)
    local b = math.floor(50 * alpha)
    self.color = (r << 16) + (g << 8) + b
    
    return self.life > 0
end

function Particle:draw()
    drawCircle(self.x, self.y, self.radius * (self.life / self.maxLife), self.color)
end

-- Particle system
particles = {}
emitterX = 400
emitterY = 300
spawnRate = 5
timeSinceLastSpawn = 0

function setup()
    setBackgroundColor(0x000000)
end

function update(dt)
    -- Update existing particles
    local i = 1
    while i <= #particles do
        if particles[i]:update(dt) then
            i = i + 1
        else
            table.remove(particles, i)
        end
    end
    
    -- Spawn new particles
    timeSinceLastSpawn = timeSinceLastSpawn + dt
    while timeSinceLastSpawn >= 1 / spawnRate do
        for i = 1, 3 do
            table.insert(particles, Particle.new(emitterX, emitterY))
        end
        timeSinceLastSpawn = timeSinceLastSpawn - 1 / spawnRate
    end
    
    -- Move emitter in a circle
    local time = os.clock()
    emitterX = 400 + math.cos(time) * 100
    emitterY = 300 + math.sin(time) * 100
end

function draw()
    -- Draw all particles
    for i, particle in ipairs(particles) do
        particle:draw()
    end
    
    -- Draw emitter
    drawCircle(emitterX, emitterY, 10, 0xFF0000)
end 