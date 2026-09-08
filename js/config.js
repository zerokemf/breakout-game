export const CONFIG=Object.freeze({width:1280,height:720,initialSpeed:440,maxSpeedFactor:1.7,paddleSpeed:1100,paddleWidth:170,paddleHeight:18,paddleY:658,ballRadius:9,maxBounceAngle:Math.PI*65/180,fixedStep:1/240});
// Public configuration only. No credentials belong here.
export const API_BASE_URL='https://willienas.myqnapcloud.com/web-arcade';
export const STATES=Object.freeze(Object.fromEntries(['MENU','READY','PLAYING','PAUSED','LEVEL_CLEAR','GAME_OVER','ENTER_INITIALS','LEADERBOARD'].map(x=>[x,x])));
