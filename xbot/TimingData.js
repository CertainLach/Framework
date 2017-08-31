export default class TimingData {
    data=[];
    cn='';
    st=0;
    constructor(){}
    start(name){
        this.cn=name;
        let hrTime=process.hrtime();
        this.st=hrTime[0] * 1000000000 + hrTime[1];
    }
    stop(){
        let hrTime=process.hrtime();
        let et=hrTime[0] * 1000000000 + hrTime[1];
        let cn=this.cn;
        let st=this.st;
        this.data.push([cn,st,et,Math.round((et-st)/5)]);
    }
}
