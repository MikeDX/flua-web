-- Particle System Example

-- Set background color to black
setBackgroundColor(0x000000)

-- Initialize particle system
local particles = {}
local emitterX = gWidth() / 2
local emitterY = gHeight() / 2
local totalTime = 0
local dt = 0.016  -- Fixed time step (approximately 60 FPS)

-- Main loop
while true do
    -- Clear previous drawings
    clear()
    
    -- Update time (frame-based)
    totalTime = totalTime + dt
    
    -- Update and remove dead particles
    local i = 1
    while i <= #particles do
        local p = particles[i]
        
        -- Update particle position
        p.x = p.x + p.vx
        p.y = p.y + p.vy
        p.vy = p.vy + 0.1  -- gravity
        p.life = p.life - dt  -- Use fixed time step
        
        -- Update particle color (fade out)
        local alpha = p.life / p.maxLife
        local r = math.floor(255 * alpha)
        local g = math.floor(100 * alpha)
        local b = math.floor(50 * alpha)
        
        -- Draw particle if alive, remove if dead
        if p.life > 0 then
            circle(p.x, p.y, p.radius * alpha, 32, {r/255, g/255, b/255, alpha}, 0)
            i = i + 1
        else
            table.remove(particles, i)
        end
    end
    
    -- Spawn new particles
    for i = 1, 3 do
        local p = {
            x = emitterX,
            y = emitterY,
            vx = (rnd(200) - 100) / 25,
            vy = (rnd(200) - 100) / 25,
            radius = rnd(5) + 2,
            life = rnd(200) / 100 + 1,
            maxLife = 0  -- will be set below
        }
        p.maxLife = p.life
        table.insert(particles, p)
    end
    
    -- Move emitter in a circle
    emitterX = gWidth() / 2 + math.cos(totalTime * 2) * 100  -- Multiply by 2 for faster movement
    emitterY = gHeight() / 2 + math.sin(totalTime * 2) * 100
    
    -- Draw emitter
    circle(emitterX, emitterY, 10, 32, {1, 0, 0, 1}, 0)
    
    -- Display stats
    printAt(10, 10, "FPS: " .. getFPS())
    printAt(10, 30, "Particles: " .. #particles)
    
    -- Update display
    update()
end 