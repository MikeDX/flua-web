-- Draw 100 random boxes
clear()
while true do
	clear()
--	print(getFPS())
for i = 0, 1000 do 
    -- Pick random colour
    col = { random( 101 ) / 100, random( 101 ) / 100, random( 101 ) / 100, random( 101 ) / 100 }
    x = random( gWidth() )
    y = random( gHeight() )
    width = random( gWidth() / 4 )
    height = random( gHeight() / 4 )
    outline = random( 2 )
    box( x, y, width, height, col, random(2) )
end
    printAt(0,0,getFPS())
    update()

end
-- Wait 3 seconds
sleep( 3 )
