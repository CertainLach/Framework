import {hashCode} from '@meteor-it/utils-common';

export default class Random{
    m_w;
    m_z=987654321;
    mask=0xffffffff;
    constructor(seed) {
        if(!seed)
            seed=Math.round(Math.random()*100000);
        if(typeof seed==='string')
            seed=hashCode(seed);
        this.m_w  = seed;
    }
    nextFloat(){
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        let result = ((this.m_z << 16) + this.m_w) & this.mask;
        result /= 4294967296;
        return result + 0.5;
    }
    nextInt(min,max){
        if(!max){
            max=min;
            min=0;
        }
        min=+min;
        max=+max;
        return Math.floor(min + Math.random() * (max + 1 - min));
    }
    randomArrayElement(array){
        return array[Math.floor(this.nextFloat()*array.length)];
    }
    randomColor(){
        return '#'+(this.nextFloat()*0xFFFFFF<<0).toString(16);
    }
}