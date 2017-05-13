import * as seedrandom from 'seedrandom';

function pad0(a) {
    if(a.length===1)return '0'+a;
    return a;
}

export default class Random{
    wrapped;
    constructor(seed) {
        this.wrapped=seedrandom(seed);
    }
    nextFloat(){
        return this.wrapped();
    }
    nextInt(min,max){
        if(!max){
            max=min;
            min=0;
        }
        min=+min;
        max=+max;
        return Math.floor(min + this.nextFloat()* (max + 1 - min));
    }
    randomArrayElement(array){
        return array[Math.floor(this.nextFloat()*array.length)];
    }
    randomColor(){
        let r=pad0(this.nextInt(0,255).toString(16));
        let g=pad0(this.nextInt(0,255).toString(16));
        let b=pad0(this.nextInt(0,255).toString(16));
        return '#'+r+g+b;
    }
}