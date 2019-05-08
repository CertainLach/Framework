import { encodeHtmlSpecials } from "@meteor-it/utils";

/**
 * Fancify error message for developer
 * @param title
 * @param desc
 * @param stack
 */
export default function developerErrorPage(title: string, desc: string, stack: string | undefined = undefined) {
    // Developer friendly
    if (title)
        title = encodeHtmlSpecials(title).replace(/\n/g, '<br>');
    if (desc)
        desc = encodeHtmlSpecials(desc).replace(/\n/g, '<br>');
    if (stack)
        stack = encodeHtmlSpecials(stack).replace(/\n/g, '<br>');
    return `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${desc}</h1><hr>${stack ? `<code style="white-space:pre;">${stack}</code><hr>` : ''}<h2>uFramework xPress</h2></body></html>`;
}
