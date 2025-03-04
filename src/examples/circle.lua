-- Converted by F2F, (c) 2019 MMPJ
-- Reading circle.fuze
-- Read 385 chars (expected 385)
clear()

-- Set background color to dark blue
setBackgroundColor(0x000033)

while true do
    -- Clear previous drawings
    clear()
    
    -- Draw 100 random circles
    for i = 1, 100 do
        -- Pick random colour
        col = { random(101) / 100, random(101) / 100, random(101) / 100, random(101) / 100 }
        x = random(gWidth())
        y = random(gHeight())
        radius = random(gWidth() / 4)
        vertices = 32
        outline = random(2)
        circle(x, y, radius, vertices, col, outline)
    end
    
    -- Display FPS
    printAt(10, 10, "FPS: " .. getFPS())
    
    -- Yield to update the display
    update()
end
