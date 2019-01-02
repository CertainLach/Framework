import { encodeHtmlSpecials } from "@meteor-it/utils";

// noinspection JSUnusedGlobalSymbols
/**
 * Fancify error message for user
 * @param hello
 * @param whatHappened
 * @param sorry
 * @param post
 */
export default function userErrorPage(hello: string, whatHappened: string, sorry: string, post: string) {
    // User friendly
    if (hello)
        hello = encodeHtmlSpecials(hello).replace(/&#10;/g, '<br/>');
    if (whatHappened)
        whatHappened = encodeHtmlSpecials(whatHappened).replace(/\n/g, '<br/>');
    if (sorry)
        sorry = encodeHtmlSpecials(sorry).replace(/&#10;/g, '<br/>');
    if (post)
        post = encodeHtmlSpecials(post).replace(/&#10;/g, '<br/>');
    return `<html><body style='font-family:Arial,sans-serif;font-size:22px;color:#CCC;background:#222;padding:40px;'>${hello}<br/><br/><span style='color:#FC0;font-weight:600;'>${whatHappened}</span><br/><br/>${sorry}<br/><br/><span style='font-size: 14px;'>${post}</span></body></html>`;
}
