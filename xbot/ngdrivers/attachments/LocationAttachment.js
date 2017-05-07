import Attachment from "./Attachment";
/**
 * Created by Creeplays on 28.08.2016.
 */
export default class LocationAttachment extends Attachment{
    lat;
    long;
    constructor(lat,long){
        super('Location');
        this.lat=lat;
        this.long=long;
    }
}