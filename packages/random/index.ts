import seedrandom from 'seedrandom';

export default class Random{
    wrapped:any;
    constructor(seed?:string|number) {
        this.wrapped=seedrandom(seed);
    }
    nextFloat():number{
        return this.wrapped();
    }
    nextInt(min:number,max:number):number{
        if(!max){
            max=min;
            min=0;
        }
        min=+min;
        max=+max;
        return Math.floor(min + this.nextFloat()* (max + 1 - min));
    }
    randomArrayElement(array:Array<any>):any{
        return array[Math.floor(this.nextFloat()*array.length)];
    }
    randomColor():string{
        let r=this.nextInt(0,255).toString(16).padStart(2,'0');
        let g=this.nextInt(0,255).toString(16).padStart(2,'0');
        let b=this.nextInt(0,255).toString(16).padStart(2,'0');
        return '#'+r+g+b;
    }
}