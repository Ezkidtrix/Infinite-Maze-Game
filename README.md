# Infinite Maze Game
An infinite maze where you escape a hunter bot in the game, coded entirely in p5.js.

## How it works:
### Goal of the Game: 
Get to as many checkpoints (or the green squares) as possible before dying to the hunter 3 times.

### Hunter: 
The hunter in the game is a purple square that uses the A* algorithm to pathfind to the player, every time you collect a checkpoint, its position is randomized once again. If you are colliding with the hunter for more than 1.5 seconds, then you lose a life, you have 3 lives total.

### The Player:
WASD/Arrow keys to move around the map, as you move in a direction, the player speed will increase until a certain maximum speed point.
Press enter and the A* algorithm with pathfind to the checkpoint if you cannot find it, after finding the checkpoint, it will then highlight the path you need to go. (it highlights its path as its finding it as well)