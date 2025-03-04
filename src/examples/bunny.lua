-- wabbit
bunny = loadImage("assets/wabbit_alpha.png")
bunnies = 0
while true do
    clear()
    t = touch()
    t = t[0]

    if t.z then
        for i = 1,100 do
            local newbunny = createSprite()
            setSpriteImage(newbunny, bunny)
            setSpritePosition(newbunny, t.x, t.y)
            setSpriteSpeed(newbunny, {rnd(200)-100, rnd(200)-100})
            setSpriteColor(newbunny, rnd(101)/100, rnd(101)/100, rnd(101)/100, 1)
            bunnies = bunnies + 1
        end
    end
    updateSprites()
    drawSprites()
    printAt(0,0,"FPS: " .. getFPS())
    printAt(0,20,"Bunnies: " .. bunnies)
    update()
end 