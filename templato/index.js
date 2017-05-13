//templatio
import Logger from '@meteor-it/logger';
import {queue} from '@meteor-it/queue';

const p={};
//Chinese
p.fa=p.id=p.ja=p.ko=p.lo=p.ms=p.th=p.tr=p.zh=n=>0;
//German
p.da=p.de=p.en=p.es=p.fi=p.el=p.he=p.hu=p.it=p.nl=p.no=p.pt=p.sv=n=>n!==1?1:0;
//French
p.fr=p.tl=p['pt-br']=n=>n>1?1:0;
//Russian
p.hr=p.ru=n=>n%10===1&&n%100!==11?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2;
//Czesc
p.cs=n=>(n===1)?0:(n>=2&&n<=4)?1:2;
//Polish
p.pl=n=>(n===1?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2);
//Iceland
p.is=n=>(n%10!==1||n%100===11)?1:0;

let DATA_REGEX=/{{([a-zA-Z]+)}}/g;
let NUMERAL_REGEX=/(%[1-9\-]+(?::[a-zA-Zа-яА-Я\s]*)+%)/g;

let template='В коризне %{{count}}:фрукт::а:ов%';
let data={
    count:141
};

export default class Templato {
    logger=new Logger('translate');
    languages={};
    constructor(){}
    @queue
    async addLanguage(folder,family){
        let language={plural:null};
        if(!p[family]){
            this.logger.warn('Unknown language family: %s!\nSupported families is %s',family,Object.keys[p].join(', '));
            language.plural=n=>0;
        }else{
            language.plural=p[family];
        }
        this.logger.ident('Walking dir and searching for yml...');
        
        this.logger.deent();
    }
}

// function replaceData(string,data){
//     let matches= string.match(DATA_REGEX)
//     if(matches===null)
//         return null;
//     matches.forEach(m=>{
//         string=string.replace(m,data[m.slice(2,-2)]);
//     })
//     return string;
// }
// function replaceNumeral(string,data,plural){
//     let matches= string.match(NUMERAL_REGEX)
//     if(matches===null)
//         return null;
//     matches.forEach(m=>{
//         let parsed=m.slice(1,-1).split(':');
//         let id=plural(+parsed[0]);
//         string=string.replace(m,parsed[0]+' '+parsed[1]+parsed[id+2]);
//     });
//     return string;
// }
// replaceNumeral(replaceData(template,data),data,getPluralType('ru'));