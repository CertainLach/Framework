export default class TimingData {
    data=[];
    cn='';
    st=0;
    /**
     * Used to save timings between bot events
     */
    constructor(){}
    /**
     * New timing
     */
    start(name:string){
        this.cn=name;
        let hrTime=process.hrtime();
        this.st=hrTime[0] * 1000000000 + hrTime[1];
    }
    /**
     * Stop timing and write to buffer
     */
    stop(){
        let hrTime=process.hrtime();
        let et=hrTime[0] * 1000000000 + hrTime[1];
        let cn=this.cn;
        let st=this.st;
        if(st!==0)
            this.data.push([cn,st,et,Math.round((et-st)/5)]);
    }

    get buffer(){
        return this.data;
    }
}
