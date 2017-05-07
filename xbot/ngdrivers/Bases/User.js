/**
 * Created by Creeplays on 29.08.2016.
 */
export default class User{
    uid; //Uid
    fn; //First name
    nn; //Nick name or middle name
    ln; //Last name
    sex; //Sex
    avatar; //Avatar url
    profileLink; //Link to profile
    getName(){
        return this.nn || this.fn;
    }
    getFullName(){
        return ((this.fn?this.fn:'')+(this.ln?' '+this.ln:'')+(this.nn?' ('+this.nn+')':'')).trim();
    }
    isMale(){
        return this.sex==SEX.MALE;
    }
    isFemale(){
        return this.sex==SEX.MALE;
    }
}

export const SEX={
    MALE:1,
    FEMALE:2,
    ANIMAL:3
};

export const PLATFORM={
    MOBILE:1,
    IPHONE:2,
    IPAD:3,
    ANDROID:4,
    WPHONE:5,
    WINDOWS:6,
    WEB:7,
    UNKNOWN:8
};